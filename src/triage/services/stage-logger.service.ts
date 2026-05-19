import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { PipelineStage, STAGE_ORDER } from '../stage.enum';
import { RunManifest } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';

@Injectable()
export class StageLoggerService {
  private cwd = process.cwd();
  private currentStage: PipelineStage = PipelineStage.INIT;
  private manifest: RunManifest = {
    input_hashes: { tickets: '', config: '' },
    stages: [],
  };

  constructor(private readonly writer: ArtifactWriterService) {}

  setCwd(cwd: string): void {
    this.cwd = cwd;
  }

  getCwd(): string {
    return this.cwd;
  }

  reset(cwd?: string): void {
    if (cwd) this.cwd = cwd;
    this.currentStage = PipelineStage.INIT;
    this.manifest = {
      input_hashes: { tickets: '', config: '' },
      stages: [
        { stage: PipelineStage.INIT, timestamp: new Date().toISOString() },
      ],
    };
    this.persist();
  }

  getCurrentStage(): PipelineStage {
    return this.currentStage;
  }

  getManifest(): RunManifest {
    return this.manifest;
  }

  setInputHashes(ticketsPath: string, configPath: string): void {
    this.manifest.input_hashes = {
      tickets: hashFile(ticketsPath),
      config: hashFile(configPath),
    };
    this.persist();
  }

  advanceTo(next: PipelineStage): void {
    const currentIdx = STAGE_ORDER.indexOf(this.currentStage);
    const nextIdx = STAGE_ORDER.indexOf(next);
    if (nextIdx !== currentIdx + 1) {
      throw new Error(
        `Invalid stage transition: ${this.currentStage} -> ${next} (expected ${STAGE_ORDER[currentIdx + 1]})`,
      );
    }
    this.currentStage = next;
    this.manifest.stages.push({
      stage: next,
      timestamp: new Date().toISOString(),
    });
    this.persist();
  }

  requireStage(expected: PipelineStage): void {
    if (this.currentStage !== expected) {
      throw new Error(
        `Stage gate failed: expected ${expected}, current ${this.currentStage}`,
      );
    }
  }

  private persist(): void {
    this.writer.writeJson(
      artifactPath(this.cwd, ARTIFACT_NAMES.manifest),
      this.manifest,
    );
  }
}

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}
