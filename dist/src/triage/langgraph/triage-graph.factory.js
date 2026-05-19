"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageGraphFactory = void 0;
const common_1 = require("@nestjs/common");
const langgraph_1 = require("@langchain/langgraph");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const triage_state_1 = require("./triage.state");
const config_validator_service_1 = require("../services/config-validator.service");
const input_loader_service_1 = require("../services/input-loader.service");
const normalizer_service_1 = require("../services/normalizer.service");
const prediction_service_1 = require("../services/prediction.service");
const queue_builder_service_1 = require("../services/queue-builder.service");
const review_service_1 = require("../services/review.service");
const stage_logger_service_1 = require("../services/stage-logger.service");
const path = __importStar(require("path"));
let TriageGraphFactory = class TriageGraphFactory {
    stageLogger;
    inputLoader;
    configValidator;
    normalizer;
    prediction;
    review;
    queueBuilder;
    constructor(stageLogger, inputLoader, configValidator, normalizer, prediction, review, queueBuilder) {
        this.stageLogger = stageLogger;
        this.inputLoader = inputLoader;
        this.configValidator = configValidator;
        this.normalizer = normalizer;
        this.prediction = prediction;
        this.review = review;
        this.queueBuilder = queueBuilder;
    }
    build() {
        const stageLogger = this.stageLogger;
        const inputLoader = this.inputLoader;
        const configValidator = this.configValidator;
        const normalizer = this.normalizer;
        const prediction = this.prediction;
        const review = this.review;
        const queueBuilder = this.queueBuilder;
        const loadInputs = async (state) => {
            const cwd = state.cwd;
            const tickets = inputLoader.loadTickets(cwd);
            const config = inputLoader.loadConfig(cwd);
            configValidator.validate(config);
            stageLogger.setInputHashes(path.join(cwd, triage_constants_1.ARTIFACT_NAMES.tickets), path.join(cwd, triage_constants_1.ARTIFACT_NAMES.config));
            stageLogger.advanceTo(stage_enum_1.PipelineStage.INPUTS_LOADED);
            return { tickets, config };
        };
        const normalize = async (state) => {
            const normalized = normalizer.normalize(state.cwd, state.tickets);
            return { normalized };
        };
        const predictBatch = async (state) => {
            const predictions = await prediction.predict(state.cwd, state.normalized, state.config);
            return { predictions };
        };
        const humanReview = async (state) => {
            const overrideLines = (0, langgraph_1.interrupt)({ predictions: state.predictions });
            const { overrides, postReview } = review.applyOverrides(state.cwd, state.predictions, overrideLines, state.config);
            return { overrides, postReview };
        };
        const buildFinalQueue = async (state) => {
            const finalQueue = review.buildFinalQueue(state.postReview, state.overrides);
            queueBuilder.writeFinalQueue(state.cwd, finalQueue, state.overrides);
            return { finalQueue };
        };
        const checkpointer = new langgraph_1.MemorySaver();
        const graph = new langgraph_1.StateGraph(triage_state_1.TriageStateAnnotation)
            .addNode('loadInputs', loadInputs)
            .addNode('normalize', normalize)
            .addNode('predictBatch', predictBatch)
            .addNode('humanReview', humanReview)
            .addNode('buildFinalQueue', buildFinalQueue)
            .addEdge(langgraph_1.START, 'loadInputs')
            .addEdge('loadInputs', 'normalize')
            .addEdge('normalize', 'predictBatch')
            .addEdge('predictBatch', 'humanReview')
            .addEdge('humanReview', 'buildFinalQueue')
            .addEdge('buildFinalQueue', langgraph_1.END)
            .compile({ checkpointer });
        return graph;
    }
};
exports.TriageGraphFactory = TriageGraphFactory;
exports.TriageGraphFactory = TriageGraphFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stage_logger_service_1.StageLoggerService,
        input_loader_service_1.InputLoaderService,
        config_validator_service_1.ConfigValidatorService,
        normalizer_service_1.NormalizerService,
        prediction_service_1.PredictionService,
        review_service_1.ReviewService,
        queue_builder_service_1.QueueBuilderService])
], TriageGraphFactory);
//# sourceMappingURL=triage-graph.factory.js.map