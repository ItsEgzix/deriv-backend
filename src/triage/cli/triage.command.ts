import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from '@langchain/langgraph';
import { EscalationService } from '../services/escalation.service';
import {
  ParsedOverrideLine,
  ReviewPromptService,
} from '../services/review-prompt.service';
import { StageLoggerService } from '../services/stage-logger.service';
import { PipelineStage } from '../stage.enum';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { TriageGraphFactory } from '../langgraph/triage-graph.factory';
import { TriageConfig, TriagePrediction } from '../types';

interface InvokeResult {
  config?: TriageConfig;
  predictions?: TriagePrediction[];
  __interrupt__?: Array<{ value: { predictions: TriagePrediction[] } }>;
}

@Injectable()
export class TriageCommand {
  private readonly logger = new Logger(TriageCommand.name);

  constructor(
    private readonly graphFactory: TriageGraphFactory,
    private readonly stageLogger: StageLoggerService,
    private readonly reviewPrompt: ReviewPromptService,
    private readonly escalation: EscalationService,
  ) {}

  async run(cwd: string): Promise<void> {
    this.requireInputs(cwd);

    this.stageLogger.reset(cwd);
    const graph = this.graphFactory.build();
    const threadId = computeThreadId(cwd);
    const invokeConfig = { configurable: { thread_id: threadId } };

    this.logger.log(`Starting triage run (thread_id=${threadId}, cwd=${cwd})`);

    const initial = (await graph.invoke({ cwd }, invokeConfig)) as InvokeResult;

    const interrupts = initial.__interrupt__;
    if (!interrupts || interrupts.length === 0) {
      throw new Error(
        'Expected pipeline to interrupt at humanReview but it did not.',
      );
    }

    const config = initial.config ?? loadConfigFromDisk(cwd);
    const predictions = interrupts[0].value.predictions;

    this.reviewPrompt.printPredictionsTable(predictions);
    const overrides = await this.reviewPrompt.collectOverrideLines(config);
    this.logOverridesSubmitted(overrides);

    const final = (await graph.invoke(
      new Command({ resume: overrides }),
      invokeConfig,
    )) as InvokeResult;

    if (final.predictions) {
      this.escalation.writeEscalations(cwd, final.predictions);
    }

    this.stageLogger.advanceTo(PipelineStage.VALIDATION_COMPLETE);
    this.stageLogger.advanceTo(PipelineStage.RESULTS_FINALISED);

    this.logger.log('Triage run finished. Artifacts:');
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
      const p = artifactPath(cwd, name);
      if (fs.existsSync(p)) this.logger.log(`  - ${name}`);
    }
  }

  private requireInputs(cwd: string): void {
    for (const name of [ARTIFACT_NAMES.tickets, ARTIFACT_NAMES.config]) {
      const p = artifactPath(cwd, name);
      if (!fs.existsSync(p)) {
        throw new Error(`Missing required input file: ${p}`);
      }
    }
  }

  private logOverridesSubmitted(overrides: ParsedOverrideLine[]): void {
    if (overrides.length === 0) {
      this.logger.log('No overrides submitted.');
    } else {
      this.logger.log(`Submitted ${overrides.length} override(s).`);
    }
  }
}

function computeThreadId(cwd: string): string {
  const ticketsPath = path.join(cwd, ARTIFACT_NAMES.tickets);
  const configPath = path.join(cwd, ARTIFACT_NAMES.config);
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(ticketsPath));
  hash.update(fs.readFileSync(configPath));
  return `triage:${hash.digest('hex').slice(0, 16)}`;
}

function loadConfigFromDisk(cwd: string): TriageConfig {
  const filePath = path.join(cwd, ARTIFACT_NAMES.config);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TriageConfig;
}
