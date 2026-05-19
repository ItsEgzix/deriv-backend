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
exports.NormalizerService = void 0;
const common_1 = require("@nestjs/common");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const text_util_1 = require("../text.util");
const artifact_writer_service_1 = require("./artifact-writer.service");
const stage_logger_service_1 = require("./stage-logger.service");
let NormalizerService = class NormalizerService {
    writer;
    stageLogger;
    constructor(writer, stageLogger) {
        this.writer = writer;
        this.stageLogger = stageLogger;
    }
    normalize(cwd, tickets) {
        this.stageLogger.requireStage(stage_enum_1.PipelineStage.INPUTS_LOADED);
        const normalized = tickets
            .map((ticket) => {
            if (!ticket.ticket_id) {
                throw new Error('Encountered ticket without ticket_id');
            }
            const subject = ticket.subject ?? '';
            const message = ticket.message ?? '';
            const text_for_model = (0, text_util_1.buildTextForModel)(subject, message);
            return {
                ticket_id: ticket.ticket_id,
                subject: subject.trim(),
                message: message.trim(),
                channel: ticket.channel,
                created_at: ticket.created_at,
                text_for_model,
                char_count: text_for_model.length,
            };
        })
            .sort((a, b) => a.ticket_id.localeCompare(b.ticket_id));
        this.writer.writeJson((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.normalized), normalized);
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.TICKETS_NORMALIZED);
        return normalized;
    }
};
exports.NormalizerService = NormalizerService;
exports.NormalizerService = NormalizerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService,
        stage_logger_service_1.StageLoggerService])
], NormalizerService);
//# sourceMappingURL=normalizer.service.js.map