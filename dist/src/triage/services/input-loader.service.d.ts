import { RawTicket, TriageConfig } from '../types';
export declare class InputLoaderService {
    loadTickets(cwd: string): RawTicket[];
    loadConfig(cwd: string): TriageConfig;
}
