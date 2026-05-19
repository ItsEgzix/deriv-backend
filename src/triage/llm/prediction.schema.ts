import { z } from 'zod';

export const PredictionItemSchema = z.object({
  ticket_id: z.string(),
  category: z.string(),
  priority: z.string(),
  reason: z.string(),
  suggested_reply: z.string(),
  confidence: z.number().min(0).max(1).nullable(),
});

export const BatchPredictionSchema = z.object({
  predictions: z.array(PredictionItemSchema),
});

export type PredictionItem = z.infer<typeof PredictionItemSchema>;
export type BatchPrediction = z.infer<typeof BatchPredictionSchema>;
