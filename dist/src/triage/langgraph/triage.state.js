"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriageStateAnnotation = void 0;
const langgraph_1 = require("@langchain/langgraph");
exports.TriageStateAnnotation = langgraph_1.Annotation.Root({
    cwd: (0, langgraph_1.Annotation)(),
    tickets: (0, langgraph_1.Annotation)(),
    config: (0, langgraph_1.Annotation)(),
    normalized: (0, langgraph_1.Annotation)(),
    predictions: (0, langgraph_1.Annotation)(),
    overrides: (0, langgraph_1.Annotation)(),
    postReview: (0, langgraph_1.Annotation)(),
    finalQueue: (0, langgraph_1.Annotation)(),
});
//# sourceMappingURL=triage.state.js.map