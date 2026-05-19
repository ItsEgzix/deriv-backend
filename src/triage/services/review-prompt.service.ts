import { Injectable, Logger } from '@nestjs/common';
import * as readline from 'readline';
import { TriageConfig, TriagePrediction } from '../types';

export interface ParsedOverrideLine {
  ticket_id: string;
  new_category: string;
  new_priority: string;
}

@Injectable()
export class ReviewPromptService {
  private readonly logger = new Logger(ReviewPromptService.name);

  printPredictionsTable(predictions: TriagePrediction[]): void {
    const headers = ['ticket_id', 'category', 'priority', 'route_to'];
    const rows = predictions.map((p) => [
      p.ticket_id,
      p.category,
      p.priority,
      p.route_to,
    ]);
    const widths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)),
    );
    const fmt = (cells: string[]) =>
      cells.map((c, i) => c.padEnd(widths[i], ' ')).join(' | ');
    const divider = widths.map((w) => '-'.repeat(w)).join('-+-');

    process.stdout.write('\n=== Triage Predictions ===\n');
    process.stdout.write(`${fmt(headers)}\n`);
    process.stdout.write(`${divider}\n`);
    for (const r of rows) process.stdout.write(`${fmt(r)}\n`);
    process.stdout.write('\n');
  }

  async collectOverrideLines(config: TriageConfig): Promise<ParsedOverrideLine[]> {
    const banner =
      'Enter any overrides as: ticket_id,category,priority\nPress Enter on an empty line when done.';
    process.stdout.write(`${banner}\n`);

    const lines = await this.readLines(config);
    return lines;
  }

  private async readLines(
    config: TriageConfig,
  ): Promise<ParsedOverrideLine[]> {
    const auto = process.env.TRIAGE_AUTO_REVIEW === '1';
    const reviewInput = process.env.TRIAGE_REVIEW_INPUT;

    if (auto && !reviewInput) {
      process.stdout.write('(TRIAGE_AUTO_REVIEW=1 - no overrides)\n');
      return [];
    }

    if (reviewInput !== undefined) {
      const parsed: ParsedOverrideLine[] = [];
      for (const raw of reviewInput.split(/\r?\n/)) {
        const line = raw.trim();
        if (!line) continue;
        const result = this.parseLine(line, config);
        if (result) parsed.push(result);
      }
      process.stdout.write(`(TRIAGE_REVIEW_INPUT supplied ${parsed.length} override(s))\n`);
      return parsed;
    }

    return new Promise<ParsedOverrideLine[]>((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });
      const collected: ParsedOverrideLine[] = [];
      rl.on('line', (raw) => {
        const line = raw.trim();
        if (!line) {
          rl.close();
          return;
        }
        const result = this.parseLine(line, config);
        if (result) collected.push(result);
      });
      rl.on('close', () => resolve(collected));
    });
  }

  private parseLine(
    line: string,
    config: TriageConfig,
  ): ParsedOverrideLine | null {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length !== 3) {
      this.logger.warn(`Ignoring override "${line}": expected 3 comma-separated values.`);
      return null;
    }
    const [ticket_id, new_category, new_priority] = parts;
    if (!config.allowed_categories.includes(new_category)) {
      this.logger.warn(
        `Ignoring override for ${ticket_id}: category "${new_category}" not in allowed_categories.`,
      );
      return null;
    }
    if (!config.allowed_priorities.includes(new_priority)) {
      this.logger.warn(
        `Ignoring override for ${ticket_id}: priority "${new_priority}" not in allowed_priorities.`,
      );
      return null;
    }
    return { ticket_id, new_category, new_priority };
  }
}
