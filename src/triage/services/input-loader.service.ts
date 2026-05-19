import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { RawTicket, TriageConfig } from '../types';

@Injectable()
export class InputLoaderService {
  loadTickets(cwd: string): RawTicket[] {
    const filePath = artifactPath(cwd, ARTIFACT_NAMES.tickets);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing input file: ${filePath}`);
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as unknown;
    if (!Array.isArray(raw)) {
      throw new Error('tickets.json must be a JSON array');
    }
    return raw as RawTicket[];
  }

  loadConfig(cwd: string): TriageConfig {
    const filePath = artifactPath(cwd, ARTIFACT_NAMES.config);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing input file: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TriageConfig;
  }
}
