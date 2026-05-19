import { NormalizedTicket, TriageConfig } from '../types';
export declare const SYSTEM_PROMPT = "You are a support-triage classifier for a financial-services product.\nFor every ticket you receive, return exactly one prediction with:\n- category: one of the allowed_categories provided in the config\n- priority: one of the allowed_priorities provided in the config\n- reason: one short sentence (<= 25 words) explaining the classification\n- suggested_reply: a customer-facing reply respecting the provided tone and max_words\n- confidence: a calibrated number between 0 and 1\nRules:\n- Use only values that appear in the config arrays.\n- Never invent routing destinations - routing is handled outside the model.\n- If a ticket is ambiguous, prefer \"other\" with lower confidence rather than guessing.\n- Return one prediction per input ticket_id, no duplicates, no extras.";
export interface BatchPromptInputs {
    config: TriageConfig;
    tickets: NormalizedTicket[];
}
export declare function buildUserPrompt({ config, tickets }: BatchPromptInputs): string;
