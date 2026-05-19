/* eslint-disable */
const fs = require('fs');
const path = require('path');

const artifacts = [
  'normalized_tickets.json',
  'triage_predictions.json',
  'review_overrides.json',
  'final_queue.json',
  'queue_summary.md',
  'escalations.json',
  'llm_calls.jsonl',
  'run_manifest.json',
  'pipeline.log',
];

const cwd = process.cwd();
let removed = 0;
for (const name of artifacts) {
  const p = path.join(cwd, name);
  try {
    fs.unlinkSync(p);
    removed++;
    console.log(`removed ${name}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`failed to remove ${name}: ${err.message}`);
    }
  }
}
console.log(`Cleaned ${removed} artifact(s).`);
