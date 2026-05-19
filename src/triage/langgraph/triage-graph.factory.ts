import { Injectable } from '@nestjs/common';
import {
  END,
  MemorySaver,
  START,
  StateGraph,
  interrupt,
} from '@langchain/langgraph';
import { PipelineStage } from '../stage.enum';
import { ARTIFACT_NAMES } from '../triage.constants';
import {
  TriageState,
  TriageStateAnnotation,
  TriageStateUpdate,
} from './triage.state';
import { ConfigValidatorService } from '../services/config-validator.service';
import { InputLoaderService } from '../services/input-loader.service';
import { NormalizerService } from '../services/normalizer.service';
import { PredictionService } from '../services/prediction.service';
import { QueueBuilderService } from '../services/queue-builder.service';
import { ReviewService } from '../services/review.service';
import { StageLoggerService } from '../services/stage-logger.service';
import { ParsedOverrideLine } from '../services/review-prompt.service';
import * as path from 'path';

export interface ReviewInterruptPayload {
  predictions: TriageState['predictions'];
}

@Injectable()
export class TriageGraphFactory {
  constructor(
    private readonly stageLogger: StageLoggerService,
    private readonly inputLoader: InputLoaderService,
    private readonly configValidator: ConfigValidatorService,
    private readonly normalizer: NormalizerService,
    private readonly prediction: PredictionService,
    private readonly review: ReviewService,
    private readonly queueBuilder: QueueBuilderService,
  ) {}

  build() {
    const stageLogger = this.stageLogger;
    const inputLoader = this.inputLoader;
    const configValidator = this.configValidator;
    const normalizer = this.normalizer;
    const prediction = this.prediction;
    const review = this.review;
    const queueBuilder = this.queueBuilder;

    const loadInputs = async (state: TriageState): Promise<TriageStateUpdate> => {
      const cwd = state.cwd;
      const tickets = inputLoader.loadTickets(cwd);
      const config = inputLoader.loadConfig(cwd);
      configValidator.validate(config);
      stageLogger.setInputHashes(
        path.join(cwd, ARTIFACT_NAMES.tickets),
        path.join(cwd, ARTIFACT_NAMES.config),
      );
      stageLogger.advanceTo(PipelineStage.INPUTS_LOADED);
      return { tickets, config };
    };

    const normalize = async (state: TriageState): Promise<TriageStateUpdate> => {
      const normalized = normalizer.normalize(state.cwd, state.tickets);
      return { normalized };
    };

    const predictBatch = async (
      state: TriageState,
    ): Promise<TriageStateUpdate> => {
      const predictions = await prediction.predict(
        state.cwd,
        state.normalized,
        state.config,
      );
      return { predictions };
    };

    const humanReview = async (
      state: TriageState,
    ): Promise<TriageStateUpdate> => {
      const overrideLines = interrupt<
        ReviewInterruptPayload,
        ParsedOverrideLine[]
      >({ predictions: state.predictions });

      const { overrides, postReview } = review.applyOverrides(
        state.cwd,
        state.predictions,
        overrideLines,
        state.config,
      );
      return { overrides, postReview };
    };

    const buildFinalQueue = async (
      state: TriageState,
    ): Promise<TriageStateUpdate> => {
      const finalQueue = review.buildFinalQueue(state.postReview, state.overrides);
      queueBuilder.writeFinalQueue(state.cwd, finalQueue, state.overrides);
      return { finalQueue };
    };

    const checkpointer = new MemorySaver();

    const graph = new StateGraph(TriageStateAnnotation)
      .addNode('loadInputs', loadInputs)
      .addNode('normalize', normalize)
      .addNode('predictBatch', predictBatch)
      .addNode('humanReview', humanReview)
      .addNode('buildFinalQueue', buildFinalQueue)
      .addEdge(START, 'loadInputs')
      .addEdge('loadInputs', 'normalize')
      .addEdge('normalize', 'predictBatch')
      .addEdge('predictBatch', 'humanReview')
      .addEdge('humanReview', 'buildFinalQueue')
      .addEdge('buildFinalQueue', END)
      .compile({ checkpointer });

    return graph;
  }
}
