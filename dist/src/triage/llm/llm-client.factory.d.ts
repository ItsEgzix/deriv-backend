import { BatchPrediction } from './prediction.schema';
import { NormalizedTicket, TriageConfig } from '../types';
export interface LlmInvocation {
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
}
export interface LlmInvocationResult {
    data: BatchPrediction;
    invocation: LlmInvocation;
}
export declare class LlmClientFactory {
    private readonly logger;
    isMockMode(): boolean;
    invokeBatchTriage(tickets: NormalizedTicket[], config: TriageConfig): Promise<LlmInvocationResult>;
}
