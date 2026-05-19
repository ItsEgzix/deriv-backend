import { EscalationService } from '../services/escalation.service';
import { ReviewPromptService } from '../services/review-prompt.service';
import { StageLoggerService } from '../services/stage-logger.service';
import { TriageGraphFactory } from '../langgraph/triage-graph.factory';
export declare class TriageCommand {
    private readonly graphFactory;
    private readonly stageLogger;
    private readonly reviewPrompt;
    private readonly escalation;
    private readonly logger;
    constructor(graphFactory: TriageGraphFactory, stageLogger: StageLoggerService, reviewPrompt: ReviewPromptService, escalation: EscalationService);
    run(cwd: string): Promise<void>;
    private requireInputs;
    private logOverridesSubmitted;
}
