import { TriageConfig } from '../types';
export declare class ConfigValidatorService {
    validate(config: TriageConfig): void;
    isAllowedCategory(config: TriageConfig, category: string): boolean;
    isAllowedPriority(config: TriageConfig, priority: string): boolean;
    computeRoute(config: TriageConfig, category: string): string;
}
