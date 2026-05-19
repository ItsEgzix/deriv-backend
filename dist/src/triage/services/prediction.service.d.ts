import { NormalizedTicket, TriageConfig, TriagePrediction } from '../types';
import { LlmClientFactory } from '../llm/llm-client.factory';
import { ArtifactWriterService } from './artifact-writer.service';
import { ConfigValidatorService } from './config-validator.service';
import { LlmCallLoggerService } from './llm-call-logger.service';
import { StageLoggerService } from './stage-logger.service';
export declare class PredictionService {
    private readonly writer;
    private readonly stageLogger;
    private readonly llmFactory;
    private readonly llmCallLogger;
    private readonly configValidator;
    private readonly logger;
    constructor(writer: ArtifactWriterService, stageLogger: StageLoggerService, llmFactory: LlmClientFactory, llmCallLogger: LlmCallLoggerService, configValidator: ConfigValidatorService);
    predict(cwd: string, tickets: NormalizedTicket[], config: TriageConfig): Promise<TriagePrediction[]>;
    private postProcess;
    private buildFallback;
    private warn;
}
