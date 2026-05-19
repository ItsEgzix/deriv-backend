import { Module } from '@nestjs/common';
import { TriageCommand } from './cli/triage.command';
import { TriageGraphFactory } from './langgraph/triage-graph.factory';
import { LlmClientFactory } from './llm/llm-client.factory';
import { ArtifactWriterService } from './services/artifact-writer.service';
import { ConfigValidatorService } from './services/config-validator.service';
import { EscalationService } from './services/escalation.service';
import { InputLoaderService } from './services/input-loader.service';
import { LlmCallLoggerService } from './services/llm-call-logger.service';
import { NormalizerService } from './services/normalizer.service';
import { PredictionService } from './services/prediction.service';
import { QueueBuilderService } from './services/queue-builder.service';
import { ReviewPromptService } from './services/review-prompt.service';
import { ReviewService } from './services/review.service';
import { StageLoggerService } from './services/stage-logger.service';

@Module({
  providers: [
    ArtifactWriterService,
    StageLoggerService,
    InputLoaderService,
    ConfigValidatorService,
    NormalizerService,
    LlmClientFactory,
    LlmCallLoggerService,
    PredictionService,
    ReviewPromptService,
    ReviewService,
    QueueBuilderService,
    EscalationService,
    TriageGraphFactory,
    TriageCommand,
  ],
  exports: [TriageCommand],
})
export class TriageModule {}
