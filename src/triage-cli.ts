import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { TriageCommand } from './triage/cli/triage.command';
import { TriageModule } from './triage/triage.module';

async function main(): Promise<void> {
  dotenv.config();

  const logger = new Logger('TriageCLI');
  const app = await NestFactory.createApplicationContext(TriageModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    const command = app.get(TriageCommand);
    await command.run(process.cwd());
  } catch (err) {
    logger.error(err instanceof Error ? err.stack ?? err.message : String(err));
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

void main();
