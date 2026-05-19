import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ArtifactWriterService } from './artifact-writer.service';
import { NormalizerService } from './normalizer.service';
import { StageLoggerService } from './stage-logger.service';
import { PipelineStage } from '../stage.enum';
import { RawTicket } from '../types';

describe('NormalizerService', () => {
  let cwd: string;
  let writer: ArtifactWriterService;
  let stageLogger: StageLoggerService;
  let normalizer: NormalizerService;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-norm-'));
    fs.writeFileSync(path.join(cwd, 'tickets.json'), '[]');
    fs.writeFileSync(path.join(cwd, 'triage_config.json'), '{}');
    writer = new ArtifactWriterService();
    stageLogger = new StageLoggerService(writer);
    stageLogger.reset(cwd);
    stageLogger.setInputHashes(
      path.join(cwd, 'tickets.json'),
      path.join(cwd, 'triage_config.json'),
    );
    stageLogger.advanceTo(PipelineStage.INPUTS_LOADED);
    normalizer = new NormalizerService(writer, stageLogger);
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('produces deterministic, sorted, evaluator-shaped output', () => {
    const tickets: RawTicket[] = [
      {
        ticket_id: 'T-2',
        subject: '  Z subject ',
        message: 'second\n  message',
        channel: 'email',
        created_at: '2026-01-02T00:00:00Z',
      },
      {
        ticket_id: 'T-1',
        subject: 'A   subject',
        message: 'first message',
        channel: 'chat',
        created_at: '2026-01-01T00:00:00Z',
      },
    ];

    const out = normalizer.normalize(cwd, tickets);
    expect(out.map((t) => t.ticket_id)).toEqual(['T-1', 'T-2']);
    expect(out[0].text_for_model).toBe('Subject: A subject\n\nMessage: first message');
    expect(out[0].char_count).toBe(out[0].text_for_model.length);
    expect(stageLogger.getCurrentStage()).toBe(PipelineStage.TICKETS_NORMALIZED);

    const written = JSON.parse(
      fs.readFileSync(path.join(cwd, 'normalized_tickets.json'), 'utf-8'),
    );
    expect(written).toEqual(out);
  });

  it('refuses to normalize without INPUTS_LOADED stage', () => {
    const freshWriter = new ArtifactWriterService();
    const freshLogger = new StageLoggerService(freshWriter);
    freshLogger.reset(cwd);
    const freshNormalizer = new NormalizerService(freshWriter, freshLogger);
    expect(() => freshNormalizer.normalize(cwd, [])).toThrow(/Stage gate failed/);
  });
});
