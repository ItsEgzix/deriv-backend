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
exports.LlmCallLoggerService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const triage_constants_1 = require("../triage.constants");
const artifact_writer_service_1 = require("./artifact-writer.service");
let LlmCallLoggerService = class LlmCallLoggerService {
    writer;
    constructor(writer) {
        this.writer = writer;
    }
    log(params) {
        const entry = {
            stage: params.stage,
            timestamp: new Date().toISOString(),
            provider: params.provider,
            model: params.model,
            prompt_hash: hashPrompt(params.systemPrompt, params.userPrompt),
            input_artifacts: params.inputArtifacts,
            output_artifact: params.outputArtifact,
        };
        this.writer.appendJsonl((0, triage_constants_1.artifactPath)(params.cwd, triage_constants_1.ARTIFACT_NAMES.llmCalls), entry);
    }
};
exports.LlmCallLoggerService = LlmCallLoggerService;
exports.LlmCallLoggerService = LlmCallLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService])
], LlmCallLoggerService);
function hashPrompt(systemPrompt, userPrompt) {
    return crypto
        .createHash('sha256')
        .update(systemPrompt)
        .update('\n---\n')
        .update(userPrompt)
        .digest('hex');
}
//# sourceMappingURL=llm-call-logger.service.js.map