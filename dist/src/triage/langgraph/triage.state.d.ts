import { FinalQueueItem, NormalizedTicket, RawTicket, ReviewOverride, TriageConfig, TriagePrediction } from '../types';
export declare const TriageStateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    cwd: import("@langchain/langgraph").LastValue<string>;
    tickets: import("@langchain/langgraph").LastValue<RawTicket[]>;
    config: import("@langchain/langgraph").LastValue<TriageConfig>;
    normalized: import("@langchain/langgraph").LastValue<NormalizedTicket[]>;
    predictions: import("@langchain/langgraph").LastValue<TriagePrediction[]>;
    overrides: import("@langchain/langgraph").LastValue<ReviewOverride[]>;
    postReview: import("@langchain/langgraph").LastValue<TriagePrediction[]>;
    finalQueue: import("@langchain/langgraph").LastValue<FinalQueueItem[]>;
}>;
export type TriageState = typeof TriageStateAnnotation.State;
export type TriageStateUpdate = typeof TriageStateAnnotation.Update;
