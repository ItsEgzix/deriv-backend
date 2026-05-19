import { FinalQueueItem, ReviewOverride } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { StageLoggerService } from './stage-logger.service';
export declare class QueueBuilderService {
    private readonly writer;
    private readonly stageLogger;
    constructor(writer: ArtifactWriterService, stageLogger: StageLoggerService);
    writeFinalQueue(cwd: string, finalQueue: FinalQueueItem[], overrides: ReviewOverride[]): void;
}
