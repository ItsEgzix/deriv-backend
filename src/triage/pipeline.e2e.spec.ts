import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Test } from '@nestjs/testing';
import { TriageModule } from './triage.module';
import { TriageCommand } from './cli/triage.command';
import { ARTIFACT_NAMES } from './triage.constants';
import { validateArtifacts } from './validation/validate';
import { FinalQueueItem, ReviewOverride, RunManifest } from './types';

const fixtureTickets = [
  {
    ticket_id: 'T-1001',
    customer_id: 'C-001',
    subject: 'Charged twice for my deposit',
    message:
      'Hi, I made one deposit this morning but I can see two charges on my bank card. Please help reverse the extra charge.',
    channel: 'email',
    created_at: '2026-05-10T09:15:00Z',
  },
  {
    ticket_id: 'T-1002',
    customer_id: 'C-002',
    subject: "Can't log in after resetting password",
    message:
      'I reset my password and now the app keeps saying invalid credentials. I need access urgently before market open.',
    channel: 'chat',
    created_at: '2026-05-10T09:18:00Z',
  },
  {
    ticket_id: 'T-1003',
    customer_id: 'C-003',
    subject: 'How do I export my transaction history?',
    message:
      'I need a CSV of my transaction history for accounting. Where can I download it from?',
    channel: 'email',
    created_at: '2026-05-10T09:22:00Z',
  },
];

const fixtureConfig = {
  allowed_categories: [
    'billing_issue',
    'account_access',
    'product_how_to',
    'bug_report',
    'other',
  ],
  allowed_priorities: ['urgent', 'high', 'normal', 'low'],
  reply_style: { tone: 'clear, polite, concise', max_words: 80 },
  routing_rules: {
    billing_issue: 'payments_queue',
    account_access: 'trust_and_access_queue',
    product_how_to: 'general_support_queue',
    bug_report: 'technical_queue',
    other: 'manual_review_queue',
  },
};

describe('Triage pipeline (e2e, mock LLM)', () => {
  let cwd: string;
  let priorEnv: Record<string, string | undefined>;

  beforeEach(() => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-e2e-'));
    fs.writeFileSync(
      path.join(cwd, ARTIFACT_NAMES.tickets),
      JSON.stringify(fixtureTickets, null, 2),
    );
    fs.writeFileSync(
      path.join(cwd, ARTIFACT_NAMES.config),
      JSON.stringify(fixtureConfig, null, 2),
    );
    priorEnv = {
      TRIAGE_MOCK_LLM: process.env.TRIAGE_MOCK_LLM,
      TRIAGE_AUTO_REVIEW: process.env.TRIAGE_AUTO_REVIEW,
      TRIAGE_REVIEW_INPUT: process.env.TRIAGE_REVIEW_INPUT,
    };
    process.env.TRIAGE_MOCK_LLM = '1';
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(priorEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  async function runPipeline(): Promise<void> {
    const moduleRef = await Test.createTestingModule({
      imports: [TriageModule],
    }).compile();
    try {
      const cmd = moduleRef.get(TriageCommand);
      await cmd.run(cwd);
    } finally {
      await moduleRef.close();
    }
  }

  it('produces all required artifacts and passes validation (no overrides)', async () => {
    process.env.TRIAGE_AUTO_REVIEW = '1';
    delete process.env.TRIAGE_REVIEW_INPUT;

    await runPipeline();

    for (const name of [
      ARTIFACT_NAMES.normalized,
      ARTIFACT_NAMES.predictions,
      ARTIFACT_NAMES.overrides,
      ARTIFACT_NAMES.finalQueue,
      ARTIFACT_NAMES.summary,
      ARTIFACT_NAMES.escalations,
      ARTIFACT_NAMES.manifest,
      ARTIFACT_NAMES.llmCalls,
    ]) {
      expect(fs.existsSync(path.join(cwd, name))).toBe(true);
    }

    const overrides = JSON.parse(
      fs.readFileSync(path.join(cwd, ARTIFACT_NAMES.overrides), 'utf-8'),
    ) as ReviewOverride[];
    expect(overrides).toEqual([]);

    const report = validateArtifacts(cwd);
    if (!report.passed) console.error(report.errors);
    expect(report.passed).toBe(true);
  });

  it('applies overrides, recomputes routing, and reflects in final_queue', async () => {
    delete process.env.TRIAGE_AUTO_REVIEW;
    process.env.TRIAGE_REVIEW_INPUT = 'T-1003,billing_issue,urgent';

    await runPipeline();

    const overrides = JSON.parse(
      fs.readFileSync(path.join(cwd, ARTIFACT_NAMES.overrides), 'utf-8'),
    ) as ReviewOverride[];
    expect(overrides).toHaveLength(1);
    expect(overrides[0].ticket_id).toBe('T-1003');
    expect(overrides[0].new_category).toBe('billing_issue');

    const finalQueue = JSON.parse(
      fs.readFileSync(path.join(cwd, ARTIFACT_NAMES.finalQueue), 'utf-8'),
    ) as FinalQueueItem[];
    const overridden = finalQueue.find((f) => f.ticket_id === 'T-1003')!;
    expect(overridden.final_category).toBe('billing_issue');
    expect(overridden.final_priority).toBe('urgent');
    expect(overridden.final_route_to).toBe('payments_queue');
    expect(overridden.was_overridden).toBe(true);

    const others = finalQueue.filter((f) => f.ticket_id !== 'T-1003');
    for (const o of others) expect(o.was_overridden).toBe(false);

    const report = validateArtifacts(cwd);
    if (!report.passed) console.error(report.errors);
    expect(report.passed).toBe(true);
  });

  it('enforces stage ordering: normalization timestamp before LLM call', async () => {
    process.env.TRIAGE_AUTO_REVIEW = '1';
    await runPipeline();
    const manifest = JSON.parse(
      fs.readFileSync(path.join(cwd, ARTIFACT_NAMES.manifest), 'utf-8'),
    ) as RunManifest;
    const norm = manifest.stages.find((s) => s.stage === 'TICKETS_NORMALIZED');
    const pred = manifest.stages.find((s) => s.stage === 'TRIAGE_PREDICTED');
    expect(norm && pred).toBeTruthy();
    expect(new Date(norm!.timestamp).getTime()).toBeLessThanOrEqual(
      new Date(pred!.timestamp).getTime(),
    );
  });
});
