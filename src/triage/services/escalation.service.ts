import { Injectable } from '@nestjs/common';
import {
  ARTIFACT_NAMES,
  artifactPath,
  ESCALATION_CONFIDENCE_THRESHOLD,
  FALLBACK_CATEGORY,
} from '../triage.constants';
import { EscalationItem, TriagePrediction } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';

@Injectable()
export class EscalationService {
  constructor(private readonly writer: ArtifactWriterService) {}

  writeEscalations(
    cwd: string,
    predictions: TriagePrediction[],
  ): EscalationItem[] {
    const escalations: EscalationItem[] = [];
    for (const p of predictions) {
      const reasons: string[] = [];
      if (p.category === FALLBACK_CATEGORY) reasons.push('category=other');
      if (
        typeof p.confidence === 'number' &&
        p.confidence < ESCALATION_CONFIDENCE_THRESHOLD
      ) {
        reasons.push(`confidence<${ESCALATION_CONFIDENCE_THRESHOLD}`);
      }
      if (reasons.length === 0) continue;
      escalations.push({
        ticket_id: p.ticket_id,
        category: p.category,
        priority: p.priority,
        confidence: p.confidence,
        reason: reasons.join('; '),
      });
    }
    this.writer.writeJson(
      artifactPath(cwd, ARTIFACT_NAMES.escalations),
      escalations,
    );
    return escalations;
  }
}
