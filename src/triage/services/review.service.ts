import { Injectable } from '@nestjs/common';
import { PipelineStage } from '../stage.enum';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import {
  FinalQueueItem,
  ReviewOverride,
  TriageConfig,
  TriagePrediction,
} from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { ConfigValidatorService } from './config-validator.service';
import { ParsedOverrideLine } from './review-prompt.service';
import { StageLoggerService } from './stage-logger.service';

@Injectable()
export class ReviewService {
  constructor(
    private readonly writer: ArtifactWriterService,
    private readonly stageLogger: StageLoggerService,
    private readonly configValidator: ConfigValidatorService,
  ) {}

  applyOverrides(
    cwd: string,
    predictions: TriagePrediction[],
    parsedOverrides: ParsedOverrideLine[],
    config: TriageConfig,
  ): { overrides: ReviewOverride[]; postReview: TriagePrediction[] } {
    this.stageLogger.requireStage(PipelineStage.TRIAGE_PREDICTED);

    const overridesById = new Map<string, ParsedOverrideLine>();
    for (const o of parsedOverrides) overridesById.set(o.ticket_id, o);

    const overrides: ReviewOverride[] = [];
    const postReview = predictions.map((p) => {
      const override = overridesById.get(p.ticket_id);
      if (!override) return p;

      const categoryChanged = override.new_category !== p.category;
      const priorityChanged = override.new_priority !== p.priority;
      if (!categoryChanged && !priorityChanged) return p;

      overrides.push({
        ticket_id: p.ticket_id,
        old_category: p.category,
        new_category: override.new_category,
        old_priority: p.priority,
        new_priority: override.new_priority,
      });

      const newRoute = categoryChanged
        ? this.configValidator.computeRoute(config, override.new_category)
        : p.route_to;

      return {
        ...p,
        category: override.new_category,
        priority: override.new_priority,
        route_to: newRoute,
      };
    });

    this.writer.writeJson(
      artifactPath(cwd, ARTIFACT_NAMES.overrides),
      overrides,
    );
    this.stageLogger.advanceTo(PipelineStage.HUMAN_REVIEW_COMPLETE);
    return { overrides, postReview };
  }

  buildFinalQueue(
    postReview: TriagePrediction[],
    overrides: ReviewOverride[],
  ): FinalQueueItem[] {
    const overriddenIds = new Set(overrides.map((o) => o.ticket_id));
    return postReview.map((p) => ({
      ticket_id: p.ticket_id,
      final_category: p.category,
      final_priority: p.priority,
      final_route_to: p.route_to,
      suggested_reply: p.suggested_reply,
      was_overridden: overriddenIds.has(p.ticket_id),
    }));
  }
}
