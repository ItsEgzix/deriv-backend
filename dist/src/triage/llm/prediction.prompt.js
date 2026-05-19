"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYSTEM_PROMPT = void 0;
exports.buildUserPrompt = buildUserPrompt;
exports.SYSTEM_PROMPT = `You are a support-triage classifier for a financial-services product.
For every ticket you receive, return exactly one prediction with:
- category: one of the allowed_categories provided in the config
- priority: one of the allowed_priorities provided in the config
- reason: one short sentence (<= 25 words) explaining the classification
- suggested_reply: a customer-facing reply respecting the provided tone and max_words
- confidence: a calibrated number between 0 and 1
Rules:
- Use only values that appear in the config arrays.
- Never invent routing destinations - routing is handled outside the model.
- If a ticket is ambiguous, prefer "other" with lower confidence rather than guessing.
- Return one prediction per input ticket_id, no duplicates, no extras.`;
function buildUserPrompt({ config, tickets }) {
    const tone = config.reply_style.tone;
    const maxWords = config.reply_style.max_words;
    const payload = {
        config: {
            allowed_categories: config.allowed_categories,
            allowed_priorities: config.allowed_priorities,
            reply_style: { tone, max_words: maxWords },
        },
        tickets: tickets.map((t) => ({
            ticket_id: t.ticket_id,
            channel: t.channel,
            text: t.text_for_model,
        })),
    };
    return [
        `Classify the following support tickets.`,
        `Reply tone: ${tone}. Reply max_words: ${maxWords}.`,
        `Input:`,
        '```json',
        JSON.stringify(payload, null, 2),
        '```',
        `Respond using the predictions schema.`,
    ].join('\n');
}
//# sourceMappingURL=prediction.prompt.js.map