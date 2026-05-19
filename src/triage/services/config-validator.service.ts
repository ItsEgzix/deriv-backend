import { Injectable } from '@nestjs/common';
import { TriageConfig } from '../types';

@Injectable()
export class ConfigValidatorService {
  validate(config: TriageConfig): void {
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
        throw new Error(
          `triage_config.json: routing_rules missing entry for category "${category}"`,
        );
      }
    }
    if (!config.reply_style || !config.reply_style.max_words || config.reply_style.max_words < 1) {
      throw new Error(
        'triage_config.json: reply_style.max_words must be a positive integer',
      );
    }
  }

  isAllowedCategory(config: TriageConfig, category: string): boolean {
    return config.allowed_categories.includes(category);
  }

  isAllowedPriority(config: TriageConfig, priority: string): boolean {
    return config.allowed_priorities.includes(priority);
  }

  computeRoute(config: TriageConfig, category: string): string {
    return config.routing_rules[category];
  }
}
