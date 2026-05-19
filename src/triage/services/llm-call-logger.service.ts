import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { LlmCallLogEntry } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';

export interface LogLlmCallParams {
  cwd: string;
  stage: string;
  provider: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  inputArtifacts: string[];
  outputArtifact: string;
}

@Injectable()
export class LlmCallLoggerService {
  constructor(private readonly writer: ArtifactWriterService) {}

  log(params: LogLlmCallParams): void {
    const entry: LlmCallLogEntry = {
      stage: params.stage,
      timestamp: new Date().toISOString(),
      provider: params.provider,
      model: params.model,
      prompt_hash: hashPrompt(params.systemPrompt, params.userPrompt),
      input_artifacts: params.inputArtifacts,
      output_artifact: params.outputArtifact,
    };
    this.writer.appendJsonl(
      artifactPath(params.cwd, ARTIFACT_NAMES.llmCalls),
      entry,
    );
  }
}

function hashPrompt(systemPrompt: string, userPrompt: string): string {
  return crypto
    .createHash('sha256')
    .update(systemPrompt)
    .update('\n---\n')
    .update(userPrompt)
    .digest('hex');
}
