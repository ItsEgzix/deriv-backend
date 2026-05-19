import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ArtifactWriterService } from './artifact-writer.service';
import { ConfigValidatorService } from './config-validator.service';
import { ReviewService } from './review.service';
import { StageLoggerService } from './stage-logger.service';
import { PipelineStage } from '../stage.enum';
import { TriageConfig, TriagePrediction } from '../types';

describe('ReviewService', () => {
  let cwd: string;
  let writer: ArtifactWriterService;
  let stageLogger: StageLoggerService;
  let review: ReviewService;
  const config: TriageConfig = {
    allowed_categories: ['billing_issue', 'account_access', 'product_how_to', 'bug_report', 'other'],
    allowed_priorities: ['urgent', 'high', 'normal', 'low'],
    reply_style: { tone: 'clear', max_words: 80 },
    routing_rules: {
      billing_issue: 'payments_queue',
      account_access: 'trust_and_access_queue',
      product_how_to: 'general_support_queue',
      bug_report: 'technical_queue',
      other: 'manual_review_queue',
    },
  };

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-review-'));
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
    stageLogger.advanceTo(PipelineStage.TICKETS_NORMALIZED);
    stageLogger.advanceTo(PipelineStage.TRIAGE_PREDICTED);
    review = new ReviewService(writer, stageLogger, new ConfigValidatorService());
  });

  afterEach(() => {
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('applies overrides, recomputes route_to, and records old/new values', () => {
    const predictions: TriagePrediction[] = [
      {
        ticket_id: 'T-1',
        category: 'product_how_to',
        priority: 'normal',
        reason: 'guidance question',
        suggested_reply: 'reply A',
        route_to: 'general_support_queue',
      },
      {
        ticket_id: 'T-2',
        category: 'bug_report',
        priority: 'normal',
        reason: 'crash',
        suggested_reply: 'reply B',
        route_to: 'technical_queue',
      },
    ];
    const { overrides, postReview } = review.applyOverrides(
      cwd,
      predictions,
      [{ ticket_id: 'T-1', new_category: 'billing_issue', new_priority: 'urgent' }],
      config,
    );
    expect(overrides).toEqual([
      {
        ticket_id: 'T-1',
        old_category: 'product_how_to',
        new_category: 'billing_issue',
        old_priority: 'normal',
        new_priority: 'urgent',
      },
    ]);
    expect(postReview[0].category).toBe('billing_issue');
    expect(postReview[0].priority).toBe('urgent');
    expect(postReview[0].route_to).toBe('payments_queue');
    expect(postReview[1]).toEqual(predictions[1]);

    const finalQueue = review.buildFinalQueue(postReview, overrides);
    expect(finalQueue.find((f) => f.ticket_id === 'T-1')!.was_overridden).toBe(true);
    expect(finalQueue.find((f) => f.ticket_id === 'T-2')!.was_overridden).toBe(false);
    expect(finalQueue.find((f) => f.ticket_id === 'T-1')!.final_route_to).toBe('payments_queue');

    expect(stageLogger.getCurrentStage()).toBe(PipelineStage.HUMAN_REVIEW_COMPLETE);
    const written = JSON.parse(
      fs.readFileSync(path.join(cwd, 'review_overrides.json'), 'utf-8'),
    );
    expect(written).toEqual(overrides);
  });

  it('writes empty overrides array when no overrides provided', () => {
    const predictions: TriagePrediction[] = [
      {
        ticket_id: 'T-1',
        category: 'bug_report',
        priority: 'normal',
        reason: 'bug',
        suggested_reply: 'reply',
        route_to: 'technical_queue',
      },
    ];
    const { overrides } = review.applyOverrides(cwd, predictions, [], config);
    expect(overrides).toEqual([]);
    const written = JSON.parse(
      fs.readFileSync(path.join(cwd, 'review_overrides.json'), 'utf-8'),
    );
    expect(written).toEqual([]);
  });
});
