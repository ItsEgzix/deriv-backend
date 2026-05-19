export declare const ARTIFACT_NAMES: {
    readonly tickets: "tickets.json";
    readonly config: "triage_config.json";
    readonly normalized: "normalized_tickets.json";
    readonly predictions: "triage_predictions.json";
    readonly overrides: "review_overrides.json";
    readonly finalQueue: "final_queue.json";
    readonly summary: "queue_summary.md";
    readonly escalations: "escalations.json";
    readonly llmCalls: "llm_calls.jsonl";
    readonly manifest: "run_manifest.json";
    readonly pipelineLog: "pipeline.log";
};
export declare function artifactPath(cwd: string, name: string): string;
export declare const FALLBACK_CATEGORY = "other";
export declare const FALLBACK_PRIORITY = "normal";
export declare const FALLBACK_ROUTE = "manual_review_queue";
export declare const ESCALATION_CONFIDENCE_THRESHOLD = 0.6;
