"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ReviewPromptService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPromptService = void 0;
const common_1 = require("@nestjs/common");
const readline = __importStar(require("readline"));
let ReviewPromptService = ReviewPromptService_1 = class ReviewPromptService {
    logger = new common_1.Logger(ReviewPromptService_1.name);
    printPredictionsTable(predictions) {
        const headers = ['ticket_id', 'category', 'priority', 'route_to'];
        const rows = predictions.map((p) => [
            p.ticket_id,
            p.category,
            p.priority,
            p.route_to,
        ]);
        const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)));
        const fmt = (cells) => cells.map((c, i) => c.padEnd(widths[i], ' ')).join(' | ');
        const divider = widths.map((w) => '-'.repeat(w)).join('-+-');
        process.stdout.write('\n=== Triage Predictions ===\n');
        process.stdout.write(`${fmt(headers)}\n`);
        process.stdout.write(`${divider}\n`);
        for (const r of rows)
            process.stdout.write(`${fmt(r)}\n`);
        process.stdout.write('\n');
    }
    async collectOverrideLines(config) {
        const banner = 'Enter any overrides as: ticket_id,category,priority\nPress Enter on an empty line when done.';
        process.stdout.write(`${banner}\n`);
        const lines = await this.readLines(config);
        return lines;
    }
    async readLines(config) {
        const auto = process.env.TRIAGE_AUTO_REVIEW === '1';
        const reviewInput = process.env.TRIAGE_REVIEW_INPUT;
        if (auto && !reviewInput) {
            process.stdout.write('(TRIAGE_AUTO_REVIEW=1 - no overrides)\n');
            return [];
        }
        if (reviewInput !== undefined) {
            const parsed = [];
            for (const raw of reviewInput.split(/\r?\n/)) {
                const line = raw.trim();
                if (!line)
                    continue;
                const result = this.parseLine(line, config);
                if (result)
                    parsed.push(result);
            }
            process.stdout.write(`(TRIAGE_REVIEW_INPUT supplied ${parsed.length} override(s))\n`);
            return parsed;
        }
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: false,
            });
            const collected = [];
            rl.on('line', (raw) => {
                const line = raw.trim();
                if (!line) {
                    rl.close();
                    return;
                }
                const result = this.parseLine(line, config);
                if (result)
                    collected.push(result);
            });
            rl.on('close', () => resolve(collected));
        });
    }
    parseLine(line, config) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length !== 3) {
            this.logger.warn(`Ignoring override "${line}": expected 3 comma-separated values.`);
            return null;
        }
        const [ticket_id, new_category, new_priority] = parts;
        if (!config.allowed_categories.includes(new_category)) {
            this.logger.warn(`Ignoring override for ${ticket_id}: category "${new_category}" not in allowed_categories.`);
            return null;
        }
        if (!config.allowed_priorities.includes(new_priority)) {
            this.logger.warn(`Ignoring override for ${ticket_id}: priority "${new_priority}" not in allowed_priorities.`);
            return null;
        }
        return { ticket_id, new_category, new_priority };
    }
};
exports.ReviewPromptService = ReviewPromptService;
exports.ReviewPromptService = ReviewPromptService = ReviewPromptService_1 = __decorate([
    (0, common_1.Injectable)()
], ReviewPromptService);
//# sourceMappingURL=review-prompt.service.js.map