export interface ValidationReport {
    passed: boolean;
    errors: string[];
    warnings: string[];
}
export declare function validateArtifacts(cwd: string): ValidationReport;
