export interface RawTicket {
  ticket_id: string;
  customer_id?: string;
  subject: string;
  message: string;
  channel: string;
  created_at: string;
}

export interface NormalizedTicket {
  ticket_id: string;
  subject: string;
  message: string;
  channel: string;
  created_at: string;
  text_for_model: string;
  char_count: number;
}

export interface TriageConfig {
  allowed_categories: string[];
  allowed_priorities: string[];
  reply_style: {
    tone: string;
    max_words: number;
  };
  routing_rules: Record<string, string>;
}

export interface TriagePrediction {
  ticket_id: string;
  category: string;
  priority: string;
  reason: string;
  suggested_reply: string;
  route_to: string;
  confidence?: number;
}

export interface ReviewOverride {
  ticket_id: string;
  old_category: string;
  new_category: string;
  old_priority: string;
  new_priority: string;
}

export interface FinalQueueItem {
  ticket_id: string;
  final_category: string;
  final_priority: string;
  final_route_to: string;
  suggested_reply: string;
  was_overridden: boolean;
}

export interface EscalationItem {
  ticket_id: string;
  category: string;
  priority: string;
  confidence?: number;
  reason: string;
}

export interface RunManifestEntry {
  stage: string;
  timestamp: string;
}

export interface RunManifest {
  input_hashes: {
    tickets: string;
    config: string;
  };
  stages: RunManifestEntry[];
}

export interface LlmCallLogEntry {
  stage: string;
  timestamp: string;
  provider: string;
  model: string;
  prompt_hash: string;
  input_artifacts: string[];
  output_artifact: string;
}
