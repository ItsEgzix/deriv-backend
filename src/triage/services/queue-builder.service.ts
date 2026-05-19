import { Injectable } from '@nestjs/common';
import { PipelineStage } from '../stage.enum';
import { ARTIFACT_NAMES, artifactPath } from '../triage.constants';
import { FinalQueueItem, ReviewOverride } from '../types';
import { ArtifactWriterService } from './artifact-writer.service';
import { StageLoggerService } from './stage-logger.service';

@Injectable()
export class QueueBuilderService {
  constructor(
    private readonly writer: ArtifactWriterService,
    private readonly stageLogger: StageLoggerService,
  ) {}

  writeFinalQueue(
    cwd: string,
    finalQueue: FinalQueueItem[],
    overrides: ReviewOverride[],
  ): void {
    this.stageLogger.requireStage(PipelineStage.HUMAN_REVIEW_COMPLETE);

    this.writer.writeJson(
      artifactPath(cwd, ARTIFACT_NAMES.finalQueue),
      finalQueue,
    );
    this.writer.writeText(
      artifactPath(cwd, ARTIFACT_NAMES.summary),
      buildSummaryMarkdown(finalQueue, overrides),
    );
    this.stageLogger.advanceTo(PipelineStage.FINAL_QUEUE_GENERATED);
  }
}

function buildSummaryMarkdown(
  finalQueue: FinalQueueItem[],
  overrides: ReviewOverride[],
): string {
  const total = finalQueue.length;
  const byCategory = bucket(finalQueue.map((f) => f.final_category));
  const byPriority = bucket(finalQueue.map((f) => f.final_priority));
  const byRoute = bucket(finalQueue.map((f) => f.final_route_to));

  const overridesList = overrides.length
    ? overrides
        .map(
          (o) =>
            `- ${o.ticket_id}: category ${o.old_category} -> ${o.new_category}, priority ${o.old_priority} -> ${o.new_priority}`,
        )
        .join('\n')
    : '- (none)';

  return [
    '# Queue Summary',
    '',
    `Total tickets: **${total}**`,
    '',
    '## Count by final category',
    '',
    renderCounts(byCategory),
    '',
    '## Count by final priority',
    '',
    renderCounts(byPriority),
    '',
    '## Queue breakdown by destination',
    '',
    renderCounts(byRoute),
    '',
    '## Overridden tickets',
    '',
    overridesList,
    '',
    `_Generated at ${new Date().toISOString()}_`,
    '',
  ].join('\n');
}

function bucket(values: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

function renderCounts(counts: Map<string, number>): string {
  if (counts.size === 0) return '_no entries_';
  return [...counts.entries()].map(([k, v]) => `- ${k}: ${v}`).join('\n');
}
