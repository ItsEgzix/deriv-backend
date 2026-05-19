import * as path from 'path';

export const ARTIFACT_NAMES = {
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
} as const;

export function artifactPath(cwd: string, name: string): string {
  return path.join(cwd, name);
}

export const FALLBACK_CATEGORY = 'other';
export const FALLBACK_PRIORITY = 'normal';
export const FALLBACK_ROUTE = 'manual_review_queue';
export const ESCALATION_CONFIDENCE_THRESHOLD = 0.6;
