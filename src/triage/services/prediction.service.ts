import { Injectable, Logger } from '@nestjs/common';
import { PipelineStage } from '../stage.enum';
import {
  ARTIFACT_NAMES,
  artifactPath,
  FALLBACK_CATEGORY,
  FALLBACK_PRIORITY,
  FALLBACK_ROUTE,
} from '../triage.constants';
import { truncateToMaxWords, wordCount } from '../text.util';
import {
  NormalizedTicket,
  TriageConfig,
  TriagePrediction,
} from '../types';
import { LlmClientFactory } from '../llm/llm-client.factory';
import { PredictionItem } from '../llm/prediction.schema';
import { ArtifactWriterService } from './artifact-writer.service';
import { ConfigValidatorService } from './config-validator.service';
import { LlmCallLoggerService } from './llm-call-logger.service';
import { StageLoggerService } from './stage-logger.service';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(
    private readonly writer: ArtifactWriterService,
    private readonly stageLogger: StageLoggerService,
    private readonly llmFactory: LlmClientFactory,
    private readonly llmCallLogger: LlmCallLoggerService,
    private readonly configValidator: ConfigValidatorService,
  ) {}

  async predict(
    cwd: string,
    tickets: NormalizedTicket[],
    config: TriageConfig,
  ): Promise<TriagePrediction[]> {
    this.stageLogger.requireStage(PipelineStage.TICKETS_NORMALIZED);

    const { data, invocation } = await this.llmFactory.invokeBatchTriage(
      tickets,
      config,
    );

    const predictions = this.postProcess(tickets, data.predictions, config, cwd);

    this.writer.writeJson(
      artifactPath(cwd, ARTIFACT_NAMES.predictions),
      predictions,
    );

    this.llmCallLogger.log({
      cwd,
      stage: PipelineStage.TRIAGE_PREDICTED,
      provider: invocation.provider,
      model: invocation.model,
      systemPrompt: invocation.systemPrompt,
      userPrompt: invocation.userPrompt,
      inputArtifacts: [ARTIFACT_NAMES.normalized, ARTIFACT_NAMES.config],
      outputArtifact: ARTIFACT_NAMES.predictions,
    });

    this.stageLogger.advanceTo(PipelineStage.TRIAGE_PREDICTED);
    return predictions;
  }

  private postProcess(
    tickets: NormalizedTicket[],
    rawPredictions: PredictionItem[],
    config: TriageConfig,
    cwd: string,
  ): TriagePrediction[] {
    const byId = new Map<string, PredictionItem>();
    for (const p of rawPredictions) {
      if (p && p.ticket_id) byId.set(p.ticket_id, p);
    }

    return tickets.map((ticket) => {
      const raw = byId.get(ticket.ticket_id);
      if (!raw) {
        this.warn(
          cwd,
          `LLM returned no prediction for ticket ${ticket.ticket_id}; falling back to "${FALLBACK_CATEGORY}".`,
        );
        return this.buildFallback(ticket.ticket_id, config);
      }

      let category = raw.category;
      if (!this.configValidator.isAllowedCategory(config, category)) {
        this.warn(
          cwd,
          `LLM returned invalid category "${category}" for ${ticket.ticket_id}; using "${FALLBACK_CATEGORY}".`,
        );
        category = FALLBACK_CATEGORY;
      }

      let priority = raw.priority;
      if (!this.configValidator.isAllowedPriority(config, priority)) {
        this.warn(
          cwd,
          `LLM returned invalid priority "${priority}" for ${ticket.ticket_id}; using "${FALLBACK_PRIORITY}".`,
        );
        priority = FALLBACK_PRIORITY;
      }

      const route = this.configValidator.computeRoute(config, category) ?? FALLBACK_ROUTE;
      const maxWords = config.reply_style.max_words;
      let reply = raw.suggested_reply ?? '';
      if (wordCount(reply) > maxWords) {
        this.warn(
          cwd,
          `Reply for ${ticket.ticket_id} exceeded max_words=${maxWords}; truncating.`,
        );
        reply = truncateToMaxWords(reply, maxWords);
      }

      const prediction: TriagePrediction = {
        ticket_id: ticket.ticket_id,
        category,
        priority,
        reason: raw.reason ?? '',
        suggested_reply: reply,
        route_to: route,
      };
      if (raw.confidence !== null && raw.confidence !== undefined) {
        prediction.confidence = raw.confidence;
      }
      return prediction;
    });
  }

  private buildFallback(
    ticketId: string,
    config: TriageConfig,
  ): TriagePrediction {
    const category = this.configValidator.isAllowedCategory(
      config,
      FALLBACK_CATEGORY,
    )
      ? FALLBACK_CATEGORY
      : config.allowed_categories[0];
    const priority = this.configValidator.isAllowedPriority(
      config,
      FALLBACK_PRIORITY,
    )
      ? FALLBACK_PRIORITY
      : config.allowed_priorities[0];
    return {
      ticket_id: ticketId,
      category,
      priority,
      reason: 'Fallback applied due to missing or invalid LLM output.',
      suggested_reply:
        'Hi, thanks for reaching out. A support agent will review your request and follow up shortly.',
      route_to:
        this.configValidator.computeRoute(config, category) ?? FALLBACK_ROUTE,
      confidence: 0,
    };
  }

  private warn(cwd: string, message: string): void {
    this.logger.warn(message);
    this.writer.appendLog(
      artifactPath(cwd, ARTIFACT_NAMES.pipelineLog),
      `WARN ${message}`,
    );
  }
}
