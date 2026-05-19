import { Injectable } from '@nestjs/common';
import { PipelineStage } from '../stage.enum';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { buildTextForModel } from '../text.util';
import { NormalizedTicket, RawTicket } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { StageLoggerService } from './stage-logger.service';

@Injectable()
export class NormalizerService {
  constructor(
    private readonly writer: ArtifactWriterService,
    private readonly stageLogger: StageLoggerService,
  ) {}

  normalize(cwd: string, tickets: RawTicket[]): NormalizedTicket[] {
    this.stageLogger.requireStage(PipelineStage.INPUTS_LOADED);

    const normalized: NormalizedTicket[] = tickets
      .map((ticket) => {
        if (!ticket.ticket_id) {
          throw new Error('Encountered ticket without ticket_id');
        }
        const subject = ticket.subject ?? '';
        const message = ticket.message ?? '';
        const text_for_model = buildTextForModel(subject, message);
        return {
          ticket_id: ticket.ticket_id,
          subject: subject.trim(),
          message: message.trim(),
          channel: ticket.channel,
          created_at: ticket.created_at,
          text_for_model,
          char_count: text_for_model.length,
        };
      })
      .sort((a, b) => a.ticket_id.localeCompare(b.ticket_id));

    this.writer.writeJson(
      artifactPath(cwd, ARTIFACT_NAMES.normalized),
      normalized,
    );
    this.stageLogger.advanceTo(PipelineStage.TICKETS_NORMALIZED);
    return normalized;
  }
}
