import { FinalQueueItem, ReviewOverride, TriageConfig, TriagePrediction } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { ConfigValidatorService } from './config-validator.service';
import { ParsedOverrideLine } from './review-prompt.service';
import { StageLoggerService } from './stage-logger.service';
export declare class ReviewService {
    private readonly writer;
    private readonly stageLogger;
    private readonly configValidator;
    constructor(writer: ArtifactWriterService, stageLogger: StageLoggerService, configValidator: ConfigValidatorService);
    applyOverrides(cwd: string, predictions: TriagePrediction[], parsedOverrides: ParsedOverrideLine[], config: TriageConfig): {
        overrides: ReviewOverride[];
        postReview: TriagePrediction[];
    };
    buildFinalQueue(postReview: TriagePrediction[], overrides: ReviewOverride[]): FinalQueueItem[];
}
