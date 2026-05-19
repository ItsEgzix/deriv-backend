import { z } from 'zod';
export declare const PredictionItemSchema: z.ZodObject<{
    ticket_id: z.ZodString;
    category: z.ZodString;
    priority: z.ZodString;
    reason: z.ZodString;
    suggested_reply: z.ZodString;
    confidence: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    ticket_id: string;
    category: string;
    priority: string;
    reason: string;
    suggested_reply: string;
    confidence: number | null;
}, {
    ticket_id: string;
    category: string;
    priority: string;
    reason: string;
    suggested_reply: string;
    confidence: number | null;
}>;
export declare const BatchPredictionSchema: z.ZodObject<{
    predictions: z.ZodArray<z.ZodObject<{
        ticket_id: z.ZodString;
        category: z.ZodString;
        priority: z.ZodString;
        reason: z.ZodString;
        suggested_reply: z.ZodString;
        confidence: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        ticket_id: string;
        category: string;
        priority: string;
        reason: string;
        suggested_reply: string;
        confidence: number | null;
    }, {
        ticket_id: string;
        category: string;
        priority: string;
        reason: string;
        suggested_reply: string;
        confidence: number | null;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    predictions: {
        ticket_id: string;
        category: string;
        priority: string;
        reason: string;
        suggested_reply: string;
        confidence: number | null;
    }[];
}, {
    predictions: {
        ticket_id: string;
        category: string;
        priority: string;
        reason: string;
        suggested_reply: string;
        confidence: number | null;
    }[];
}>;
export type PredictionItem = z.infer<typeof PredictionItemSchema>;
export type BatchPrediction = z.infer<typeof BatchPredictionSchema>;
