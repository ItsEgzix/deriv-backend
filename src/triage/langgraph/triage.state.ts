import { Annotation } from '@langchain/langgraph';
import {
  FinalQueueItem,
  NormalizedTicket,
  RawTicket,
  ReviewOverride,
  TriageConfig,
  TriagePrediction,
} from '../types';

export const TriageStateAnnotation = Annotation.Root({
  cwd: Annotation<string>(),
  tickets: Annotation<RawTicket[]>(),
  config: Annotation<TriageConfig>(),
  normalized: Annotation<NormalizedTicket[]>(),
  predictions: Annotation<TriagePrediction[]>(),
  overrides: Annotation<ReviewOverride[]>(),
  postReview: Annotation<TriagePrediction[]>(),
  finalQueue: Annotation<FinalQueueItem[]>(),
});

export type TriageState = typeof TriageStateAnnotation.State;
export type TriageStateUpdate = typeof TriageStateAnnotation.Update;
