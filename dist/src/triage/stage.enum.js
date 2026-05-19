"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_ORDER = exports.PipelineStage = void 0;
var PipelineStage;
(function (PipelineStage) {
    PipelineStage["INIT"] = "INIT";
    PipelineStage["INPUTS_LOADED"] = "INPUTS_LOADED";
    PipelineStage["TICKETS_NORMALIZED"] = "TICKETS_NORMALIZED";
    PipelineStage["TRIAGE_PREDICTED"] = "TRIAGE_PREDICTED";
    PipelineStage["HUMAN_REVIEW_COMPLETE"] = "HUMAN_REVIEW_COMPLETE";
    PipelineStage["FINAL_QUEUE_GENERATED"] = "FINAL_QUEUE_GENERATED";
    PipelineStage["VALIDATION_COMPLETE"] = "VALIDATION_COMPLETE";
    PipelineStage["RESULTS_FINALISED"] = "RESULTS_FINALISED";
})(PipelineStage || (exports.PipelineStage = PipelineStage = {}));
exports.STAGE_ORDER = [
    PipelineStage.INIT,
    PipelineStage.INPUTS_LOADED,
    PipelineStage.TICKETS_NORMALIZED,
    PipelineStage.TRIAGE_PREDICTED,
    PipelineStage.HUMAN_REVIEW_COMPLETE,
    PipelineStage.FINAL_QUEUE_GENERATED,
    PipelineStage.VALIDATION_COMPLETE,
    PipelineStage.RESULTS_FINALISED,
];
//# sourceMappingURL=stage.enum.js.map