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
var TriageCommand_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageCommand = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const langgraph_1 = require("@langchain/langgraph");
const escalation_service_1 = require("../services/escalation.service");
const review_prompt_service_1 = require("../services/review-prompt.service");
const stage_logger_service_1 = require("../services/stage-logger.service");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const triage_graph_factory_1 = require("../langgraph/triage-graph.factory");
let TriageCommand = TriageCommand_1 = class TriageCommand {
    graphFactory;
    stageLogger;
    reviewPrompt;
    escalation;
    logger = new common_1.Logger(TriageCommand_1.name);
    constructor(graphFactory, stageLogger, reviewPrompt, escalation) {
        this.graphFactory = graphFactory;
        this.stageLogger = stageLogger;
        this.reviewPrompt = reviewPrompt;
        this.escalation = escalation;
    }
    async run(cwd) {
        this.requireInputs(cwd);
        this.stageLogger.reset(cwd);
        const graph = this.graphFactory.build();
        const threadId = computeThreadId(cwd);
        const invokeConfig = { configurable: { thread_id: threadId } };
        this.logger.log(`Starting triage run (thread_id=${threadId}, cwd=${cwd})`);
        const initial = (await graph.invoke({ cwd }, invokeConfig));
        const interrupts = initial.__interrupt__;
        if (!interrupts || interrupts.length === 0) {
            throw new Error('Expected pipeline to interrupt at humanReview but it did not.');
        }
        const config = initial.config ?? loadConfigFromDisk(cwd);
        const predictions = interrupts[0].value.predictions;
        this.reviewPrompt.printPredictionsTable(predictions);
        const overrides = await this.reviewPrompt.collectOverrideLines(config);
        this.logOverridesSubmitted(overrides);
        const final = (await graph.invoke(new langgraph_1.Command({ resume: overrides }), invokeConfig));
        if (final.predictions) {
            this.escalation.writeEscalations(cwd, final.predictions);
        }
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.VALIDATION_COMPLETE);
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.RESULTS_FINALISED);
        this.logger.log('Triage run finished. Artifacts:');
        for (const name of [
            triage_constants_1.ARTIFACT_NAMES.normalized,
            triage_constants_1.ARTIFACT_NAMES.predictions,
            triage_constants_1.ARTIFACT_NAMES.overrides,
            triage_constants_1.ARTIFACT_NAMES.finalQueue,
            triage_constants_1.ARTIFACT_NAMES.summary,
            triage_constants_1.ARTIFACT_NAMES.escalations,
            triage_constants_1.ARTIFACT_NAMES.manifest,
            triage_constants_1.ARTIFACT_NAMES.llmCalls,
        ]) {
            const p = (0, triage_constants_1.artifactPath)(cwd, name);
            if (fs.existsSync(p))
                this.logger.log(`  - ${name}`);
        }
    }
    requireInputs(cwd) {
        for (const name of [triage_constants_1.ARTIFACT_NAMES.tickets, triage_constants_1.ARTIFACT_NAMES.config]) {
            const p = (0, triage_constants_1.artifactPath)(cwd, name);
            if (!fs.existsSync(p)) {
                throw new Error(`Missing required input file: ${p}`);
            }
        }
    }
    logOverridesSubmitted(overrides) {
        if (overrides.length === 0) {
            this.logger.log('No overrides submitted.');
        }
        else {
            this.logger.log(`Submitted ${overrides.length} override(s).`);
        }
    }
};
exports.TriageCommand = TriageCommand;
exports.TriageCommand = TriageCommand = TriageCommand_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [triage_graph_factory_1.TriageGraphFactory,
        stage_logger_service_1.StageLoggerService,
        review_prompt_service_1.ReviewPromptService,
        escalation_service_1.EscalationService])
], TriageCommand);
function computeThreadId(cwd) {
    const ticketsPath = path.join(cwd, triage_constants_1.ARTIFACT_NAMES.tickets);
    const configPath = path.join(cwd, triage_constants_1.ARTIFACT_NAMES.config);
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(ticketsPath));
    hash.update(fs.readFileSync(configPath));
    return `triage:${hash.digest('hex').slice(0, 16)}`;
}
function loadConfigFromDisk(cwd) {
    const filePath = path.join(cwd, triage_constants_1.ARTIFACT_NAMES.config);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
//# sourceMappingURL=triage.command.js.map