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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateArtifacts = validateArtifacts;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const triage_constants_1 = require("../triage.constants");
const stage_enum_1 = require("../stage.enum");
const text_util_1 = require("../text.util");
function validateArtifacts(cwd) {
    const errors = [];
    const warnings = [];
    const required = [
        triage_constants_1.ARTIFACT_NAMES.tickets,
        triage_constants_1.ARTIFACT_NAMES.config,
        triage_constants_1.ARTIFACT_NAMES.normalized,
        triage_constants_1.ARTIFACT_NAMES.predictions,
        triage_constants_1.ARTIFACT_NAMES.overrides,
        triage_constants_1.ARTIFACT_NAMES.finalQueue,
        triage_constants_1.ARTIFACT_NAMES.summary,
    ];
    for (const name of required) {
        if (!fs.existsSync(path.join(cwd, name))) {
            errors.push(`missing required artifact: ${name}`);
        }
    }
    if (errors.length > 0)
        return { passed: false, errors, warnings };
    let loaded;
    try {
        loaded = loadArtifacts(cwd);
    }
    catch (err) {
        errors.push(`failed to load/parse artifacts: ${err.message}`);
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
function loadArtifacts(cwd) {
    const readJson = (name) => JSON.parse(fs.readFileSync(path.join(cwd, name), 'utf-8'));
    return {
        tickets: readJson(triage_constants_1.ARTIFACT_NAMES.tickets),
        config: readJson(triage_constants_1.ARTIFACT_NAMES.config),
        normalized: readJson(triage_constants_1.ARTIFACT_NAMES.normalized),
        predictions: readJson(triage_constants_1.ARTIFACT_NAMES.predictions),
        overrides: readJson(triage_constants_1.ARTIFACT_NAMES.overrides),
        finalQueue: readJson(triage_constants_1.ARTIFACT_NAMES.finalQueue),
        summary: fs.readFileSync(path.join(cwd, triage_constants_1.ARTIFACT_NAMES.summary), 'utf-8'),
        manifest: readJson(triage_constants_1.ARTIFACT_NAMES.manifest),
    };
}
function checkInputsRead(cwd, errors, warnings) {
    for (const name of [triage_constants_1.ARTIFACT_NAMES.tickets, triage_constants_1.ARTIFACT_NAMES.config]) {
        const p = path.join(cwd, name);
        if (!fs.existsSync(p)) {
            errors.push(`input file ${name} not found on disk`);
            continue;
        }
        try {
            JSON.parse(fs.readFileSync(p, 'utf-8'));
        }
        catch (err) {
            errors.push(`input file ${name} is not valid JSON: ${err.message}`);
        }
    }
    void warnings;
}
function checkManifestOrdering(manifest, errors) {
    if (!manifest.stages || manifest.stages.length === 0) {
        errors.push('run_manifest.json has no stage entries');
        return;
    }
    const required = [
        stage_enum_1.PipelineStage.INPUTS_LOADED,
        stage_enum_1.PipelineStage.TICKETS_NORMALIZED,
        stage_enum_1.PipelineStage.TRIAGE_PREDICTED,
        stage_enum_1.PipelineStage.HUMAN_REVIEW_COMPLETE,
        stage_enum_1.PipelineStage.FINAL_QUEUE_GENERATED,
    ];
    const indices = new Map();
    manifest.stages.forEach((entry, idx) => {
        if (!indices.has(entry.stage))
            indices.set(entry.stage, idx);
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
                errors.push(`stage ordering violation: ${required[i]} must come after ${required[i - 1]}`);
            }
        }
    }
    const normIdx = indices.get(stage_enum_1.PipelineStage.TICKETS_NORMALIZED);
    const predIdx = indices.get(stage_enum_1.PipelineStage.TRIAGE_PREDICTED);
    if (normIdx !== undefined && predIdx !== undefined) {
        const normTs = manifest.stages[normIdx].timestamp;
        const predTs = manifest.stages[predIdx].timestamp;
        if (new Date(normTs).getTime() > new Date(predTs).getTime()) {
            errors.push(`TICKETS_NORMALIZED timestamp (${normTs}) must be <= TRIAGE_PREDICTED (${predTs})`);
        }
    }
    const reviewIdx = indices.get(stage_enum_1.PipelineStage.HUMAN_REVIEW_COMPLETE);
    const finalIdx = indices.get(stage_enum_1.PipelineStage.FINAL_QUEUE_GENERATED);
    if (reviewIdx !== undefined && finalIdx !== undefined && finalIdx <= reviewIdx) {
        errors.push('FINAL_QUEUE_GENERATED must come after HUMAN_REVIEW_COMPLETE');
    }
}
function checkNormalizationShape(tickets, normalized, errors) {
    if (tickets.length !== normalized.length) {
        errors.push(`normalized_tickets count (${normalized.length}) != tickets count (${tickets.length})`);
    }
    for (const n of normalized) {
        if (typeof n.ticket_id !== 'string' ||
            typeof n.text_for_model !== 'string' ||
            typeof n.char_count !== 'number') {
            errors.push(`normalized ticket missing required fields: ${JSON.stringify(n)}`);
            continue;
        }
        if (n.char_count !== n.text_for_model.length) {
            errors.push(`ticket ${n.ticket_id}: char_count=${n.char_count} != text_for_model.length=${n.text_for_model.length}`);
        }
    }
}
function checkOnePredictionPerTicket(tickets, predictions, errors) {
    const ticketIds = new Set(tickets.map((t) => t.ticket_id));
    const predIds = predictions.map((p) => p.ticket_id);
    const dupes = predIds.filter((id, idx, arr) => arr.indexOf(id) !== idx);
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
function checkAllowedValues(config, predictions, errors) {
    for (const p of predictions) {
        if (!config.allowed_categories.includes(p.category)) {
            errors.push(`prediction ${p.ticket_id}: category "${p.category}" not in allowed_categories`);
        }
        if (!config.allowed_priorities.includes(p.priority)) {
            errors.push(`prediction ${p.ticket_id}: priority "${p.priority}" not in allowed_priorities`);
        }
    }
}
function checkRouting(config, predictions, errors) {
    for (const p of predictions) {
        const expected = config.routing_rules[p.category];
        if (!expected) {
            errors.push(`prediction ${p.ticket_id}: no routing rule for category "${p.category}"`);
            continue;
        }
        if (p.route_to !== expected) {
            errors.push(`prediction ${p.ticket_id}: route_to="${p.route_to}" does not match routing_rules["${p.category}"]="${expected}"`);
        }
    }
}
function checkOverrides(config, predictions, overrides, finalQueue, errors) {
    const predById = new Map(predictions.map((p) => [p.ticket_id, p]));
    const finalById = new Map(finalQueue.map((f) => [f.ticket_id, f]));
    const overrideIds = new Set();
    for (const o of overrides) {
        overrideIds.add(o.ticket_id);
        const original = predById.get(o.ticket_id);
        if (!original) {
            errors.push(`override targets unknown ticket_id ${o.ticket_id}`);
            continue;
        }
        if (!config.allowed_categories.includes(o.new_category)) {
            errors.push(`override ${o.ticket_id}: new_category "${o.new_category}" not allowed`);
        }
        if (!config.allowed_priorities.includes(o.new_priority)) {
            errors.push(`override ${o.ticket_id}: new_priority "${o.new_priority}" not allowed`);
        }
        if (o.old_category !== original.category) {
            errors.push(`override ${o.ticket_id}: old_category "${o.old_category}" does not match prediction "${original.category}"`);
        }
        if (o.old_priority !== original.priority) {
            errors.push(`override ${o.ticket_id}: old_priority "${o.old_priority}" does not match prediction "${original.priority}"`);
        }
        const finalItem = finalById.get(o.ticket_id);
        if (!finalItem) {
            errors.push(`override ${o.ticket_id}: missing in final_queue`);
            continue;
        }
        if (finalItem.final_category !== o.new_category) {
            errors.push(`final_queue ${o.ticket_id}: final_category "${finalItem.final_category}" != override new_category "${o.new_category}"`);
        }
        if (finalItem.final_priority !== o.new_priority) {
            errors.push(`final_queue ${o.ticket_id}: final_priority "${finalItem.final_priority}" != override new_priority "${o.new_priority}"`);
        }
        if (!finalItem.was_overridden) {
            errors.push(`final_queue ${o.ticket_id}: was_overridden must be true (was overridden in review_overrides.json)`);
        }
        const expectedRoute = config.routing_rules[o.new_category];
        if (finalItem.final_route_to !== expectedRoute) {
            errors.push(`final_queue ${o.ticket_id}: final_route_to "${finalItem.final_route_to}" must equal routing_rules["${o.new_category}"]="${expectedRoute}"`);
        }
    }
    for (const f of finalQueue) {
        if (f.was_overridden && !overrideIds.has(f.ticket_id)) {
            errors.push(`final_queue ${f.ticket_id}: was_overridden=true but ticket not in review_overrides.json`);
        }
    }
}
function checkReplyWordCounts(config, finalQueue, errors) {
    const max = config.reply_style.max_words;
    for (const f of finalQueue) {
        const wc = (0, text_util_1.wordCount)(f.suggested_reply);
        if (wc > max) {
            errors.push(`final_queue ${f.ticket_id}: reply word_count=${wc} exceeds max_words=${max}`);
        }
    }
}
function checkFinalQueueShape(tickets, finalQueue, errors) {
    if (finalQueue.length !== tickets.length) {
        errors.push(`final_queue count (${finalQueue.length}) != tickets count (${tickets.length})`);
    }
    for (const f of finalQueue) {
        for (const field of [
            'ticket_id',
            'final_category',
            'final_priority',
            'final_route_to',
            'suggested_reply',
        ]) {
            if (typeof f[field] !== 'string' || !f[field]) {
                errors.push(`final_queue item missing field "${field}": ${JSON.stringify(f)}`);
            }
        }
        if (typeof f.was_overridden !== 'boolean') {
            errors.push(`final_queue ${f.ticket_id}: was_overridden must be boolean`);
        }
    }
}
//# sourceMappingURL=validate.js.map