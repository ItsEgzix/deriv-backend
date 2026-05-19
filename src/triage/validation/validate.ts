import * as fs from 'fs';
import * as path from 'path';
import { ARTIFACT_NAMES } from '../triage.constants';
import { PipelineStage } from '../stage.enum';
import { wordCount } from '../text.util';
import {
  FinalQueueItem,
  NormalizedTicket,
  RawTicket,
  ReviewOverride,
  RunManifest,
  TriageConfig,
  TriagePrediction,
} from '../types';

export interface ValidationReport {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

interface LoadedArtifacts {
  tickets: RawTicket[];
  config: TriageConfig;
  normalized: NormalizedTicket[];
  predictions: TriagePrediction[];
  overrides: ReviewOverride[];
  finalQueue: FinalQueueItem[];
  summary: string;
  manifest: RunManifest;
}

export function validateArtifacts(cwd: string): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const required = [
    ARTIFACT_NAMES.tickets,
    ARTIFACT_NAMES.config,
    ARTIFACT_NAMES.normalized,
    ARTIFACT_NAMES.predictions,
    ARTIFACT_NAMES.overrides,
    ARTIFACT_NAMES.finalQueue,
    ARTIFACT_NAMES.summary,
  ];
  for (const name of required) {
    if (!fs.existsSync(path.join(cwd, name))) {
      errors.push(`missing required artifact: ${name}`);
    }
  }
  if (errors.length > 0) return { passed: false, errors, warnings };

  let loaded: LoadedArtifacts;
  try {
    loaded = loadArtifacts(cwd);
  } catch (err) {
    errors.push(
      `failed to load/parse artifacts: ${(err as Error).message}`,
    );
    return { passed: false, errors, warnings };
  }

  checkInputsRead(cwd, errors, warnings);
  checkManifestOrdering(loaded.manifest, errors);
  checkNormalizationShape(loaded.tickets, loaded.normalized, errors);
  checkOnePredictionPerTicket(loaded.tickets, loaded.predictions, errors);
  checkAllowedValues(loaded.config, loaded.predictions, errors);
  checkRouting(loaded.config, loaded.predictions, errors);
  checkOverrides(loaded.config, loaded.predictions, loaded.overrides, loaded.finalQueue, errors);
  checkReplyWordCounts(loaded.config, loaded.finalQueue, errors);
  checkFinalQueueShape(loaded.tickets, loaded.finalQueue, errors);

  return { passed: errors.length === 0, errors, warnings };
}

function loadArtifacts(cwd: string): LoadedArtifacts {
  const readJson = <T>(name: string): T =>
    JSON.parse(fs.readFileSync(path.join(cwd, name), 'utf-8')) as T;
  return {
    tickets: readJson<RawTicket[]>(ARTIFACT_NAMES.tickets),
    config: readJson<TriageConfig>(ARTIFACT_NAMES.config),
    normalized: readJson<NormalizedTicket[]>(ARTIFACT_NAMES.normalized),
    predictions: readJson<TriagePrediction[]>(ARTIFACT_NAMES.predictions),
    overrides: readJson<ReviewOverride[]>(ARTIFACT_NAMES.overrides),
    finalQueue: readJson<FinalQueueItem[]>(ARTIFACT_NAMES.finalQueue),
    summary: fs.readFileSync(path.join(cwd, ARTIFACT_NAMES.summary), 'utf-8'),
    manifest: readJson<RunManifest>(ARTIFACT_NAMES.manifest),
  };
}

function checkInputsRead(
  cwd: string,
  errors: string[],
  warnings: string[],
): void {
  for (const name of [ARTIFACT_NAMES.tickets, ARTIFACT_NAMES.config]) {
    const p = path.join(cwd, name);
    if (!fs.existsSync(p)) {
      errors.push(`input file ${name} not found on disk`);
      continue;
    }
    try {
      JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (err) {
      errors.push(`input file ${name} is not valid JSON: ${(err as Error).message}`);
    }
  }
  void warnings;
}

function checkManifestOrdering(manifest: RunManifest, errors: string[]): void {
  if (!manifest.stages || manifest.stages.length === 0) {
    errors.push('run_manifest.json has no stage entries');
    return;
  }
  const required = [
    PipelineStage.INPUTS_LOADED,
    PipelineStage.TICKETS_NORMALIZED,
    PipelineStage.TRIAGE_PREDICTED,
    PipelineStage.HUMAN_REVIEW_COMPLETE,
    PipelineStage.FINAL_QUEUE_GENERATED,
  ];
  const indices = new Map<string, number>();
  manifest.stages.forEach((entry, idx) => {
    if (!indices.has(entry.stage)) indices.set(entry.stage, idx);
  });
  for (const stage of required) {
    if (!indices.has(stage)) {
      errors.push(`run_manifest.json missing stage ${stage}`);
    }
  }
  if (errors.length === 0) {
    for (let i = 1; i < required.length; i++) {
      const prev = indices.get(required[i - 1]);
      const cur = indices.get(required[i]);
      if (prev !== undefined && cur !== undefined && cur <= prev) {
        errors.push(
          `stage ordering violation: ${required[i]} must come after ${required[i - 1]}`,
        );
      }
    }
  }
  const normIdx = indices.get(PipelineStage.TICKETS_NORMALIZED);
  const predIdx = indices.get(PipelineStage.TRIAGE_PREDICTED);
  if (normIdx !== undefined && predIdx !== undefined) {
    const normTs = manifest.stages[normIdx].timestamp;
    const predTs = manifest.stages[predIdx].timestamp;
    if (new Date(normTs).getTime() > new Date(predTs).getTime()) {
      errors.push(
        `TICKETS_NORMALIZED timestamp (${normTs}) must be <= TRIAGE_PREDICTED (${predTs})`,
      );
    }
  }
  const reviewIdx = indices.get(PipelineStage.HUMAN_REVIEW_COMPLETE);
  const finalIdx = indices.get(PipelineStage.FINAL_QUEUE_GENERATED);
  if (reviewIdx !== undefined && finalIdx !== undefined && finalIdx <= reviewIdx) {
    errors.push(
      'FINAL_QUEUE_GENERATED must come after HUMAN_REVIEW_COMPLETE',
    );
  }
}

function checkNormalizationShape(
  tickets: RawTicket[],
  normalized: NormalizedTicket[],
  errors: string[],
): void {
  if (tickets.length !== normalized.length) {
    errors.push(
      `normalized_tickets count (${normalized.length}) != tickets count (${tickets.length})`,
    );
  }
  for (const n of normalized) {
    if (
      typeof n.ticket_id !== 'string' ||
      typeof n.text_for_model !== 'string' ||
      typeof n.char_count !== 'number'
    ) {
      errors.push(`normalized ticket missing required fields: ${JSON.stringify(n)}`);
      continue;
    }
    if (n.char_count !== n.text_for_model.length) {
      errors.push(
        `ticket ${n.ticket_id}: char_count=${n.char_count} != text_for_model.length=${n.text_for_model.length}`,
      );
    }
  }
}

function checkOnePredictionPerTicket(
  tickets: RawTicket[],
  predictions: TriagePrediction[],
  errors: string[],
): void {
  const ticketIds = new Set(tickets.map((t) => t.ticket_id));
  const predIds = predictions.map((p) => p.ticket_id);
  const dupes = predIds.filter(
    (id, idx, arr) => arr.indexOf(id) !== idx,
  );
  if (dupes.length > 0) {
    errors.push(`duplicate predictions for ticket_ids: ${[...new Set(dupes)].join(', ')}`);
  }
  for (const id of ticketIds) {
    if (!predIds.includes(id)) {
      errors.push(`missing prediction for ticket_id ${id}`);
    }
  }
  for (const id of predIds) {
    if (!ticketIds.has(id)) {
      errors.push(`prediction for unknown ticket_id ${id}`);
    }
  }
}

function checkAllowedValues(
  config: TriageConfig,
  predictions: TriagePrediction[],
  errors: string[],
): void {
  for (const p of predictions) {
    if (!config.allowed_categories.includes(p.category)) {
      errors.push(
        `prediction ${p.ticket_id}: category "${p.category}" not in allowed_categories`,
      );
    }
    if (!config.allowed_priorities.includes(p.priority)) {
      errors.push(
        `prediction ${p.ticket_id}: priority "${p.priority}" not in allowed_priorities`,
      );
    }
  }
}

function checkRouting(
  config: TriageConfig,
  predictions: TriagePrediction[],
  errors: string[],
): void {
  for (const p of predictions) {
    const expected = config.routing_rules[p.category];
    if (!expected) {
      errors.push(
        `prediction ${p.ticket_id}: no routing rule for category "${p.category}"`,
      );
      continue;
    }
    if (p.route_to !== expected) {
      errors.push(
        `prediction ${p.ticket_id}: route_to="${p.route_to}" does not match routing_rules["${p.category}"]="${expected}"`,
      );
    }
  }
}

function checkOverrides(
  config: TriageConfig,
  predictions: TriagePrediction[],
  overrides: ReviewOverride[],
  finalQueue: FinalQueueItem[],
  errors: string[],
): void {
  const predById = new Map(predictions.map((p) => [p.ticket_id, p]));
  const finalById = new Map(finalQueue.map((f) => [f.ticket_id, f]));
  const overrideIds = new Set<string>();

  for (const o of overrides) {
    overrideIds.add(o.ticket_id);
    const original = predById.get(o.ticket_id);
    if (!original) {
      errors.push(`override targets unknown ticket_id ${o.ticket_id}`);
      continue;
    }
    if (!config.allowed_categories.includes(o.new_category)) {
      errors.push(
        `override ${o.ticket_id}: new_category "${o.new_category}" not allowed`,
      );
    }
    if (!config.allowed_priorities.includes(o.new_priority)) {
      errors.push(
        `override ${o.ticket_id}: new_priority "${o.new_priority}" not allowed`,
      );
    }
    if (o.old_category !== original.category) {
      errors.push(
        `override ${o.ticket_id}: old_category "${o.old_category}" does not match prediction "${original.category}"`,
      );
    }
    if (o.old_priority !== original.priority) {
      errors.push(
        `override ${o.ticket_id}: old_priority "${o.old_priority}" does not match prediction "${original.priority}"`,
      );
    }
    const finalItem = finalById.get(o.ticket_id);
    if (!finalItem) {
      errors.push(`override ${o.ticket_id}: missing in final_queue`);
      continue;
    }
    if (finalItem.final_category !== o.new_category) {
      errors.push(
        `final_queue ${o.ticket_id}: final_category "${finalItem.final_category}" != override new_category "${o.new_category}"`,
      );
    }
    if (finalItem.final_priority !== o.new_priority) {
      errors.push(
        `final_queue ${o.ticket_id}: final_priority "${finalItem.final_priority}" != override new_priority "${o.new_priority}"`,
      );
    }
    if (!finalItem.was_overridden) {
      errors.push(
        `final_queue ${o.ticket_id}: was_overridden must be true (was overridden in review_overrides.json)`,
      );
    }
    const expectedRoute = config.routing_rules[o.new_category];
    if (finalItem.final_route_to !== expectedRoute) {
      errors.push(
        `final_queue ${o.ticket_id}: final_route_to "${finalItem.final_route_to}" must equal routing_rules["${o.new_category}"]="${expectedRoute}"`,
      );
    }
  }

  for (const f of finalQueue) {
    if (f.was_overridden && !overrideIds.has(f.ticket_id)) {
      errors.push(
        `final_queue ${f.ticket_id}: was_overridden=true but ticket not in review_overrides.json`,
      );
    }
  }
}

function checkReplyWordCounts(
  config: TriageConfig,
  finalQueue: FinalQueueItem[],
  errors: string[],
): void {
  const max = config.reply_style.max_words;
  for (const f of finalQueue) {
    const wc = wordCount(f.suggested_reply);
    if (wc > max) {
      errors.push(
        `final_queue ${f.ticket_id}: reply word_count=${wc} exceeds max_words=${max}`,
      );
    }
  }
}

function checkFinalQueueShape(
  tickets: RawTicket[],
  finalQueue: FinalQueueItem[],
  errors: string[],
): void {
  if (finalQueue.length !== tickets.length) {
    errors.push(
      `final_queue count (${finalQueue.length}) != tickets count (${tickets.length})`,
    );
  }
  for (const f of finalQueue) {
    for (const field of [
      'ticket_id',
      'final_category',
      'final_priority',
      'final_route_to',
      'suggested_reply',
    ] as const) {
      if (typeof f[field] !== 'string' || !f[field]) {
        errors.push(`final_queue item missing field "${field}": ${JSON.stringify(f)}`);
      }
    }
    if (typeof f.was_overridden !== 'boolean') {
      errors.push(`final_queue ${f.ticket_id}: was_overridden must be boolean`);
    }
  }
}
