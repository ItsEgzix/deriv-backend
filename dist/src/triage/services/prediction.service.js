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
var PredictionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const text_util_1 = require("../text.util");
const llm_client_factory_1 = require("../llm/llm-client.factory");
const artifact_writer_service_1 = require("./artifact-writer.service");
const config_validator_service_1 = require("./config-validator.service");
const llm_call_logger_service_1 = require("./llm-call-logger.service");
const stage_logger_service_1 = require("./stage-logger.service");
let PredictionService = PredictionService_1 = class PredictionService {
    writer;
    stageLogger;
    llmFactory;
    llmCallLogger;
    configValidator;
    logger = new common_1.Logger(PredictionService_1.name);
    constructor(writer, stageLogger, llmFactory, llmCallLogger, configValidator) {
        this.writer = writer;
        this.stageLogger = stageLogger;
        this.llmFactory = llmFactory;
        this.llmCallLogger = llmCallLogger;
        this.configValidator = configValidator;
    }
    async predict(cwd, tickets, config) {
        this.stageLogger.requireStage(stage_enum_1.PipelineStage.TICKETS_NORMALIZED);
        const { data, invocation } = await this.llmFactory.invokeBatchTriage(tickets, config);
        const predictions = this.postProcess(tickets, data.predictions, config, cwd);
        this.writer.writeJson((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.predictions), predictions);
        this.llmCallLogger.log({
            cwd,
            stage: stage_enum_1.PipelineStage.TRIAGE_PREDICTED,
            provider: invocation.provider,
            model: invocation.model,
            systemPrompt: invocation.systemPrompt,
            userPrompt: invocation.userPrompt,
            inputArtifacts: [triage_constants_1.ARTIFACT_NAMES.normalized, triage_constants_1.ARTIFACT_NAMES.config],
            outputArtifact: triage_constants_1.ARTIFACT_NAMES.predictions,
        });
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.TRIAGE_PREDICTED);
        return predictions;
    }
    postProcess(tickets, rawPredictions, config, cwd) {
        const byId = new Map();
        for (const p of rawPredictions) {
            if (p && p.ticket_id)
                byId.set(p.ticket_id, p);
        }
        return tickets.map((ticket) => {
            const raw = byId.get(ticket.ticket_id);
            if (!raw) {
                this.warn(cwd, `LLM returned no prediction for ticket ${ticket.ticket_id}; falling back to "${triage_constants_1.FALLBACK_CATEGORY}".`);
                return this.buildFallback(ticket.ticket_id, config);
            }
            let category = raw.category;
            if (!this.configValidator.isAllowedCategory(config, category)) {
                this.warn(cwd, `LLM returned invalid category "${category}" for ${ticket.ticket_id}; using "${triage_constants_1.FALLBACK_CATEGORY}".`);
                category = triage_constants_1.FALLBACK_CATEGORY;
            }
            let priority = raw.priority;
            if (!this.configValidator.isAllowedPriority(config, priority)) {
                this.warn(cwd, `LLM returned invalid priority "${priority}" for ${ticket.ticket_id}; using "${triage_constants_1.FALLBACK_PRIORITY}".`);
                priority = triage_constants_1.FALLBACK_PRIORITY;
            }
            const route = this.configValidator.computeRoute(config, category) ?? triage_constants_1.FALLBACK_ROUTE;
            const maxWords = config.reply_style.max_words;
            let reply = raw.suggested_reply ?? '';
            if ((0, text_util_1.wordCount)(reply) > maxWords) {
                this.warn(cwd, `Reply for ${ticket.ticket_id} exceeded max_words=${maxWords}; truncating.`);
                reply = (0, text_util_1.truncateToMaxWords)(reply, maxWords);
            }
            const prediction = {
                ticket_id: ticket.ticket_id,
                category,
                priority,
                reason: raw.reason ?? '',
                suggested_reply: reply,
                route_to: route,
            };
            if (raw.confidence !== null && raw.confidence !== undefined) {
                prediction.confidence = raw.confidence;
            }
            return prediction;
        });
    }
    buildFallback(ticketId, config) {
        const category = this.configValidator.isAllowedCategory(config, triage_constants_1.FALLBACK_CATEGORY)
            ? triage_constants_1.FALLBACK_CATEGORY
            : config.allowed_categories[0];
        const priority = this.configValidator.isAllowedPriority(config, triage_constants_1.FALLBACK_PRIORITY)
            ? triage_constants_1.FALLBACK_PRIORITY
            : config.allowed_priorities[0];
        return {
            ticket_id: ticketId,
            category,
            priority,
            reason: 'Fallback applied due to missing or invalid LLM output.',
            suggested_reply: 'Hi, thanks for reaching out. A support agent will review your request and follow up shortly.',
            route_to: this.configValidator.computeRoute(config, category) ?? triage_constants_1.FALLBACK_ROUTE,
            confidence: 0,
        };
    }
    warn(cwd, message) {
        this.logger.warn(message);
        this.writer.appendLog((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.pipelineLog), `WARN ${message}`);
    }
};
exports.PredictionService = PredictionService;
exports.PredictionService = PredictionService = PredictionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService,
        stage_logger_service_1.StageLoggerService,
        llm_client_factory_1.LlmClientFactory,
        llm_call_logger_service_1.LlmCallLoggerService,
        config_validator_service_1.ConfigValidatorService])
], PredictionService);
//# sourceMappingURL=prediction.service.js.map