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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const artifact_writer_service_1 = require("./artifact-writer.service");
const config_validator_service_1 = require("./config-validator.service");
const stage_logger_service_1 = require("./stage-logger.service");
let ReviewService = class ReviewService {
    writer;
    stageLogger;
    configValidator;
    constructor(writer, stageLogger, configValidator) {
        this.writer = writer;
        this.stageLogger = stageLogger;
        this.configValidator = configValidator;
    }
    applyOverrides(cwd, predictions, parsedOverrides, config) {
        this.stageLogger.requireStage(stage_enum_1.PipelineStage.TRIAGE_PREDICTED);
        const overridesById = new Map();
        for (const o of parsedOverrides)
            overridesById.set(o.ticket_id, o);
        const overrides = [];
        const postReview = predictions.map((p) => {
            const override = overridesById.get(p.ticket_id);
            if (!override)
                return p;
            const categoryChanged = override.new_category !== p.category;
            const priorityChanged = override.new_priority !== p.priority;
            if (!categoryChanged && !priorityChanged)
                return p;
            overrides.push({
                ticket_id: p.ticket_id,
                old_category: p.category,
                new_category: override.new_category,
                old_priority: p.priority,
                new_priority: override.new_priority,
            });
            const newRoute = categoryChanged
                ? this.configValidator.computeRoute(config, override.new_category)
                : p.route_to;
            return {
                ...p,
                category: override.new_category,
                priority: override.new_priority,
                route_to: newRoute,
            };
        });
        this.writer.writeJson((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.overrides), overrides);
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.HUMAN_REVIEW_COMPLETE);
        return { overrides, postReview };
    }
    buildFinalQueue(postReview, overrides) {
        const overriddenIds = new Set(overrides.map((o) => o.ticket_id));
        return postReview.map((p) => ({
            ticket_id: p.ticket_id,
            final_category: p.category,
            final_priority: p.priority,
            final_route_to: p.route_to,
            suggested_reply: p.suggested_reply,
            was_overridden: overriddenIds.has(p.ticket_id),
        }));
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService,
        stage_logger_service_1.StageLoggerService,
        config_validator_service_1.ConfigValidatorService])
], ReviewService);
//# sourceMappingURL=review.service.js.map