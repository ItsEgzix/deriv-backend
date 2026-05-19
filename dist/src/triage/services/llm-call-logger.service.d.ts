import { ArtifactWriterService } from './artifact-writer.service';
export interface LogLlmCallParams {
    cwd: string;
    stage: string;
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    inputArtifacts: string[];
    outputArtifact: string;
}
export declare class LlmCallLoggerService {
    private readonly writer;
    constructor(writer: ArtifactWriterService);
    log(params: LogLlmCallParams): void;
}
