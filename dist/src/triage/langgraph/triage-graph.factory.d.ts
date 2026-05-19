import { TriageState } from './triage.state';
import { ConfigValidatorService } from '../services/config-validator.service';
import { InputLoaderService } from '../services/input-loader.service';
import { NormalizerService } from '../services/normalizer.service';
import { PredictionService } from '../services/prediction.service';
import { QueueBuilderService } from '../services/queue-builder.service';
import { ReviewService } from '../services/review.service';
import { StageLoggerService } from '../services/stage-logger.service';
export interface ReviewInterruptPayload {
    predictions: TriageState['predictions'];
}
export declare class TriageGraphFactory {
    private readonly stageLogger;
    private readonly inputLoader;
    private readonly configValidator;
    private readonly normalizer;
    private readonly prediction;
    private readonly review;
    private readonly queueBuilder;
    constructor(stageLogger: StageLoggerService, inputLoader: InputLoaderService, configValidator: ConfigValidatorService, normalizer: NormalizerService, prediction: PredictionService, review: ReviewService, queueBuilder: QueueBuilderService);
    build(): import("@langchain/langgraph").CompiledStateGraph<{
        cwd: string;
        tickets: import("../types").RawTicket[];
        config: import("../types").TriageConfig;
        normalized: import("../types").NormalizedTicket[];
        predictions: import("../types").TriagePrediction[];
        overrides: import("../types").ReviewOverride[];
        postReview: import("../types").TriagePrediction[];
        finalQueue: import("../types").FinalQueueItem[];
    }, {
        cwd?: string | undefined;
        tickets?: import("../types").RawTicket[] | undefined;
        config?: import("../types").TriageConfig | undefined;
        normalized?: import("../types").NormalizedTicket[] | undefined;
        predictions?: import("../types").TriagePrediction[] | undefined;
        overrides?: import("../types").ReviewOverride[] | undefined;
        postReview?: import("../types").TriagePrediction[] | undefined;
        finalQueue?: import("../types").FinalQueueItem[] | undefined;
    }, "normalize" | "__start__" | "loadInputs" | "predictBatch" | "humanReview" | "buildFinalQueue", {
        cwd: import("@langchain/langgraph").LastValue<string>;
        tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
        config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
        normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
        predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
        overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
        postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
        finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
    }, {
        cwd: import("@langchain/langgraph").LastValue<string>;
        tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
        config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
        normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
        predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
        overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
        postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
        finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
    }, import("@langchain/langgraph").StateDefinition, {
        loadInputs: import("@langchain/langgraph").UpdateType<{
            cwd: import("@langchain/langgraph").LastValue<string>;
            tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
            config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
            normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
            predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
            postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
        }>;
        normalize: import("@langchain/langgraph").UpdateType<{
            cwd: import("@langchain/langgraph").LastValue<string>;
            tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
            config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
            normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
            predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
            postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
        }>;
        predictBatch: import("@langchain/langgraph").UpdateType<{
            cwd: import("@langchain/langgraph").LastValue<string>;
            tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
            config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
            normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
            predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
            postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
        }>;
        humanReview: import("@langchain/langgraph").UpdateType<{
            cwd: import("@langchain/langgraph").LastValue<string>;
            tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
            config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
            normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
            predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
            postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
        }>;
        buildFinalQueue: import("@langchain/langgraph").UpdateType<{
            cwd: import("@langchain/langgraph").LastValue<string>;
            tickets: import("@langchain/langgraph").LastValue<import("../types").RawTicket[]>;
            config: import("@langchain/langgraph").LastValue<import("../types").TriageConfig>;
            normalized: import("@langchain/langgraph").LastValue<import("../types").NormalizedTicket[]>;
            predictions: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            overrides: import("@langchain/langgraph").LastValue<import("../types").ReviewOverride[]>;
            postReview: import("@langchain/langgraph").LastValue<import("../types").TriagePrediction[]>;
            finalQueue: import("@langchain/langgraph").LastValue<import("../types").FinalQueueItem[]>;
        }>;
    }, unknown, unknown, []>;
}
