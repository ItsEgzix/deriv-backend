"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigValidatorService = void 0;
const common_1 = require("@nestjs/common");
let ConfigValidatorService = class ConfigValidatorService {
    validate(config) {
        if (!Array.isArray(config.allowed_categories) || config.allowed_categories.length === 0) {
            throw new Error('triage_config.json: allowed_categories must be a non-empty array');
        }
        if (!Array.isArray(config.allowed_priorities) || config.allowed_priorities.length === 0) {
            throw new Error('triage_config.json: allowed_priorities must be a non-empty array');
        }
        if (!config.routing_rules || typeof config.routing_rules !== 'object') {
            throw new Error('triage_config.json: routing_rules must be an object');
        }
        for (const category of config.allowed_categories) {
            if (!config.routing_rules[category]) {
                throw new Error(`triage_config.json: routing_rules missing entry for category "${category}"`);
            }
        }
        if (!config.reply_style || !config.reply_style.max_words || config.reply_style.max_words < 1) {
            throw new Error('triage_config.json: reply_style.max_words must be a positive integer');
        }
    }
    isAllowedCategory(config, category) {
        return config.allowed_categories.includes(category);
    }
    isAllowedPriority(config, priority) {
        return config.allowed_priorities.includes(priority);
    }
    computeRoute(config, category) {
        return config.routing_rules[category];
    }
};
exports.ConfigValidatorService = ConfigValidatorService;
exports.ConfigValidatorService = ConfigValidatorService = __decorate([
    (0, common_1.Injectable)()
], ConfigValidatorService);
//# sourceMappingURL=config-validator.service.js.map