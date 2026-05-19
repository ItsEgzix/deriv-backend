import { EscalationItem, TriagePrediction } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
export declare class EscalationService {
    private readonly writer;
    constructor(writer: ArtifactWriterService);
    writeEscalations(cwd: string, predictions: TriagePrediction[]): EscalationItem[];
}
