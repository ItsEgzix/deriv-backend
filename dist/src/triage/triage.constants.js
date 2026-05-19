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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESCALATION_CONFIDENCE_THRESHOLD = exports.FALLBACK_ROUTE = exports.FALLBACK_PRIORITY = exports.FALLBACK_CATEGORY = exports.ARTIFACT_NAMES = void 0;
exports.artifactPath = artifactPath;
const path = __importStar(require("path"));
exports.ARTIFACT_NAMES = {
    tickets: 'tickets.json',
    config: 'triage_config.json',
    normalized: 'normalized_tickets.json',
    predictions: 'triage_predictions.json',
    overrides: 'review_overrides.json',
    finalQueue: 'final_queue.json',
    summary: 'queue_summary.md',
    escalations: 'escalations.json',
    llmCalls: 'llm_calls.jsonl',
    manifest: 'run_manifest.json',
    pipelineLog: 'pipeline.log',
};
function artifactPath(cwd, name) {
    return path.join(cwd, name);
}
exports.FALLBACK_CATEGORY = 'other';
exports.FALLBACK_PRIORITY = 'normal';
exports.FALLBACK_ROUTE = 'manual_review_queue';
exports.ESCALATION_CONFIDENCE_THRESHOLD = 0.6;
//# sourceMappingURL=triage.constants.js.map