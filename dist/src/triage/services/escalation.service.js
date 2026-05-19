"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscalationService = void 0;
const common_1 = require("@nestjs/common");
const triage_constants_1 = require("../triage.constants");
const artifact_writer_service_1 = require("./artifact-writer.service");
let EscalationService = class EscalationService {
    writer;
    constructor(writer) {
        this.writer = writer;
    }
    writeEscalations(cwd, predictions) {
        const escalations = [];
        for (const p of predictions) {
            const reasons = [];
            if (p.category === triage_constants_1.FALLBACK_CATEGORY)
                reasons.push('category=other');
            if (typeof p.confidence === 'number' &&
                p.confidence < triage_constants_1.ESCALATION_CONFIDENCE_THRESHOLD) {
                reasons.push(`confidence<${triage_constants_1.ESCALATION_CONFIDENCE_THRESHOLD}`);
            }
            if (reasons.length === 0)
                continue;
            escalations.push({
                ticket_id: p.ticket_id,
                category: p.category,
                priority: p.priority,
                confidence: p.confidence,
                reason: reasons.join('; '),
            });
        }
        this.writer.writeJson((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.escalations), escalations);
        return escalations;
    }
};
exports.EscalationService = EscalationService;
exports.EscalationService = EscalationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService])
], EscalationService);
//# sourceMappingURL=escalation.service.js.map