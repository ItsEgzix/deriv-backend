"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchPredictionSchema = exports.PredictionItemSchema = void 0;
const zod_1 = require("zod");
exports.PredictionItemSchema = zod_1.z.object({
    ticket_id: zod_1.z.string(),
    category: zod_1.z.string(),
    priority: zod_1.z.string(),
    reason: zod_1.z.string(),
    suggested_reply: zod_1.z.string(),
    confidence: zod_1.z.number().min(0).max(1).nullable(),
});
exports.BatchPredictionSchema = zod_1.z.object({
    predictions: zod_1.z.array(exports.PredictionItemSchema),
});
//# sourceMappingURL=prediction.schema.js.map