import { TriageConfig, TriagePrediction } from '../types';
export interface ParsedOverrideLine {
    ticket_id: string;
    new_category: string;
    new_priority: string;
}
export declare class ReviewPromptService {
    private readonly logger;
    printPredictionsTable(predictions: TriagePrediction[]): void;
    collectOverrideLines(config: TriageConfig): Promise<ParsedOverrideLine[]>;
    private readLines;
    private parseLine;
}
