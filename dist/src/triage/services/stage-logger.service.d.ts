import { PipelineStage } from '../stage.enum';
import { RunManifest } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
export declare class StageLoggerService {
    private readonly writer;
    private cwd;
    private currentStage;
    private manifest;
    constructor(writer: ArtifactWriterService);
    setCwd(cwd: string): void;
    getCwd(): string;
    reset(cwd?: string): void;
    getCurrentStage(): PipelineStage;
    getManifest(): RunManifest;
    setInputHashes(ticketsPath: string, configPath: string): void;
    advanceTo(next: PipelineStage): void;
    requireStage(expected: PipelineStage): void;
    private persist;
}
