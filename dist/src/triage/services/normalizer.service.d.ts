import { NormalizedTicket, RawTicket } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { StageLoggerService } from './stage-logger.service';
export declare class NormalizerService {
    private readonly writer;
    private readonly stageLogger;
    constructor(writer: ArtifactWriterService, stageLogger: StageLoggerService);
    normalize(cwd: string, tickets: RawTicket[]): NormalizedTicket[];
}
