export declare class ArtifactWriterService {
    writeJson(filePath: string, data: unknown): void;
    writeText(filePath: string, content: string): void;
    appendJsonl(filePath: string, record: unknown): void;
    appendLog(filePath: string, message: string): void;
}
