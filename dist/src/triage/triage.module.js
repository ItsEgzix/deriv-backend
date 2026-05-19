"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageModule = void 0;
const common_1 = require("@nestjs/common");
const triage_command_1 = require("./cli/triage.command");
const triage_graph_factory_1 = require("./langgraph/triage-graph.factory");
const llm_client_factory_1 = require("./llm/llm-client.factory");
const artifact_writer_service_1 = require("./services/artifact-writer.service");
const config_validator_service_1 = require("./services/config-validator.service");
const escalation_service_1 = require("./services/escalation.service");
const input_loader_service_1 = require("./services/input-loader.service");
const llm_call_logger_service_1 = require("./services/llm-call-logger.service");
const normalizer_service_1 = require("./services/normalizer.service");
const prediction_service_1 = require("./services/prediction.service");
const queue_builder_service_1 = require("./services/queue-builder.service");
const review_prompt_service_1 = require("./services/review-prompt.service");
const review_service_1 = require("./services/review.service");
const stage_logger_service_1 = require("./services/stage-logger.service");
let TriageModule = class TriageModule {
};
exports.TriageModule = TriageModule;
exports.TriageModule = TriageModule = __decorate([
    (0, common_1.Module)({
        providers: [
            artifact_writer_service_1.ArtifactWriterService,
            stage_logger_service_1.StageLoggerService,
            input_loader_service_1.InputLoaderService,
            config_validator_service_1.ConfigValidatorService,
            normalizer_service_1.NormalizerService,
            llm_client_factory_1.LlmClientFactory,
            llm_call_logger_service_1.LlmCallLoggerService,
            prediction_service_1.PredictionService,
            review_prompt_service_1.ReviewPromptService,
            review_service_1.ReviewService,
            queue_builder_service_1.QueueBuilderService,
            escalation_service_1.EscalationService,
            triage_graph_factory_1.TriageGraphFactory,
            triage_command_1.TriageCommand,
        ],
        exports: [triage_command_1.TriageCommand],
    })
], TriageModule);
//# sourceMappingURL=triage.module.js.map