"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate_1 = require("./triage/validation/validate");
function main() {
    const report = (0, validate_1.validateArtifacts)(process.cwd());
    if (report.warnings.length > 0) {
        for (const w of report.warnings)
            process.stderr.write(`WARN: ${w}\n`);
    }
    if (report.passed) {
        process.stdout.write('Validation PASSED. All checks succeeded.\n');
        process.exit(0);
    }
    process.stderr.write('Validation FAILED:\n');
    for (const e of report.errors)
        process.stderr.write(`  - ${e}\n`);
    process.exit(1);
}
main();
//# sourceMappingURL=validate-cli.js.map