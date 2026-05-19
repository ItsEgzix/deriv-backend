"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueBuilderService = void 0;
const common_1 = require("@nestjs/common");
const stage_enum_1 = require("../stage.enum");
const triage_constants_1 = require("../triage.constants");
const artifact_writer_service_1 = require("./artifact-writer.service");
const stage_logger_service_1 = require("./stage-logger.service");
let QueueBuilderService = class QueueBuilderService {
    writer;
    stageLogger;
    constructor(writer, stageLogger) {
        this.writer = writer;
        this.stageLogger = stageLogger;
    }
    writeFinalQueue(cwd, finalQueue, overrides) {
        this.stageLogger.requireStage(stage_enum_1.PipelineStage.HUMAN_REVIEW_COMPLETE);
        this.writer.writeJson((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.finalQueue), finalQueue);
        this.writer.writeText((0, triage_constants_1.artifactPath)(cwd, triage_constants_1.ARTIFACT_NAMES.summary), buildSummaryMarkdown(finalQueue, overrides));
        this.stageLogger.advanceTo(stage_enum_1.PipelineStage.FINAL_QUEUE_GENERATED);
    }
};
exports.QueueBuilderService = QueueBuilderService;
exports.QueueBuilderService = QueueBuilderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [artifact_writer_service_1.ArtifactWriterService,
        stage_logger_service_1.StageLoggerService])
], QueueBuilderService);
function buildSummaryMarkdown(finalQueue, overrides) {
    const total = finalQueue.length;
    const byCategory = bucket(finalQueue.map((f) => f.final_category));
    const byPriority = bucket(finalQueue.map((f) => f.final_priority));
    const byRoute = bucket(finalQueue.map((f) => f.final_route_to));
    const overridesList = overrides.length
        ? overrides
            .map((o) => `- ${o.ticket_id}: category ${o.old_category} -> ${o.new_category}, priority ${o.old_priority} -> ${o.new_priority}`)
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
function bucket(values) {
    const map = new Map();
    for (const v of values)
        map.set(v, (map.get(v) ?? 0) + 1);
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}
function renderCounts(counts) {
    if (counts.size === 0)
        return '_no entries_';
    return [...counts.entries()].map(([k, v]) => `- ${k}: ${v}`).join('\n');
}
//# sourceMappingURL=queue-builder.service.js.map