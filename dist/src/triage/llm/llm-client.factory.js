"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LlmClientFactory_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LlmClientFactory = void 0;
const common_1 = require("@nestjs/common");
const openai_1 = require("@langchain/openai");
const prediction_schema_1 = require("./prediction.schema");
const prediction_prompt_1 = require("./prediction.prompt");
let LlmClientFactory = LlmClientFactory_1 = class LlmClientFactory {
    logger = new common_1.Logger(LlmClientFactory_1.name);
    isMockMode() {
        return process.env.TRIAGE_MOCK_LLM === '1';
    }
    async invokeBatchTriage(tickets, config) {
        const userPrompt = (0, prediction_prompt_1.buildUserPrompt)({ config, tickets });
        const provider = 'openai';
        const model = process.env.TRIAGE_MODEL ?? 'gpt-4.1-mini';
        if (this.isMockMode()) {
            this.logger.warn('TRIAGE_MOCK_LLM=1 - using deterministic mock predictions');
            const data = buildMockPredictions(tickets, config);
            return {
                data,
                invocation: {
                    provider: 'mock',
                    model: 'rule-based-keyword-mock',
                    systemPrompt: prediction_prompt_1.SYSTEM_PROMPT,
                    userPrompt,
                },
            };
        }
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set. Set it in .env or run with TRIAGE_MOCK_LLM=1.');
        }
        const llm = new openai_1.ChatOpenAI({
            model,
            temperature: 0,
            apiKey: process.env.OPENAI_API_KEY,
        });
        const structured = llm.withStructuredOutput(prediction_schema_1.BatchPredictionSchema, { name: 'batch_triage_predictions' });
        const result = await structured.invoke([
            { role: 'system', content: prediction_prompt_1.SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ]);
        return {
            data: result,
            invocation: { provider, model, systemPrompt: prediction_prompt_1.SYSTEM_PROMPT, userPrompt },
        };
    }
};
exports.LlmClientFactory = LlmClientFactory;
exports.LlmClientFactory = LlmClientFactory = LlmClientFactory_1 = __decorate([
    (0, common_1.Injectable)()
], LlmClientFactory);
function buildMockPredictions(tickets, config) {
    const cats = config.allowed_categories;
    const prios = config.allowed_priorities;
    const pick = (allowed, candidates, fallback) => {
        for (const c of candidates)
            if (allowed.includes(c))
                return c;
        return allowed.includes(fallback) ? fallback : allowed[0];
    };
    const predictions = tickets.map((t) => {
        const text = `${t.subject} ${t.message}`.toLowerCase();
        let category;
        let priority;
        let confidence;
        if (/(charge|deposit|withdraw|refund|payment|invoice|bill)/.test(text)) {
            category = pick(cats, ['billing_issue'], 'other');
            priority = pick(prios, ['high', 'urgent'], 'normal');
            confidence = 0.88;
        }
        else if (/(login|password|locked out|access|2fa|verification)/.test(text)) {
            category = pick(cats, ['account_access'], 'other');
            priority = pick(prios, ['urgent', 'high'], 'normal');
            confidence = 0.9;
        }
        else if (/(crash|bug|error|broken|freeze)/.test(text)) {
            category = pick(cats, ['bug_report'], 'other');
            priority = pick(prios, ['high', 'normal'], 'normal');
            confidence = 0.82;
        }
        else if (/(how do i|export|download|where can i|guide|tutorial)/.test(text)) {
            category = pick(cats, ['product_how_to'], 'other');
            priority = pick(prios, ['normal', 'low'], 'normal');
            confidence = 0.78;
        }
        else {
            category = pick(cats, ['other'], 'other');
            priority = pick(prios, ['normal'], 'normal');
            confidence = 0.4;
        }
        const reply = buildMockReply(category, config.reply_style.max_words);
        return {
            ticket_id: t.ticket_id,
            category,
            priority,
            reason: `Heuristic match against ${category} keywords.`,
            suggested_reply: reply,
            confidence,
        };
    });
    return { predictions };
}
function buildMockReply(category, maxWords) {
    const templates = {
        billing_issue: 'Hi, thanks for flagging this billing concern. We have noted the duplicate charge and our payments team will investigate and follow up shortly with a resolution.',
        account_access: 'Hi, sorry for the trouble logging in. We have escalated this to our access team and they will reach out shortly to help you regain access.',
        product_how_to: 'Hi, you can export your transaction history from your account settings under reports. We will send you a step-by-step guide for the format you need.',
        bug_report: 'Hi, thanks for reporting the crash. We have logged the issue with our engineering team and will share an update once a fix is rolled out.',
        other: 'Hi, thanks for reaching out. We have received your message and a support agent will follow up shortly with next steps.',
    };
    const base = templates[category] ?? templates.other;
    const words = base.split(/\s+/);
    if (words.length <= maxWords)
        return base;
    return `${words.slice(0, maxWords).join(' ')}...`;
}
//# sourceMappingURL=llm-client.factory.js.map