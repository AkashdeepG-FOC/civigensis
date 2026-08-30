import { CitizenId } from '../../types/citizen';
import { StructuredDecision } from '../../types/citizenAgent';
import { MemoryManager } from './MemoryManager';
import { BehaviorResolver } from './BehaviorResolver';
import { ActionExecutor } from './ActionExecutor';
import { OllamaService } from './OllamaService';
import { agentEventLogger } from '../logging/AgentEventLogger';

export class AgentSession {
  private citizenId: CitizenId;
  private memoryManager: MemoryManager;

  constructor(citizenId: CitizenId, memoryManager?: MemoryManager) {
    this.citizenId = citizenId;
    this.memoryManager = memoryManager || new MemoryManager(citizenId);
  }

  public getCitizenId(): CitizenId {
    return this.citizenId;
  }

  public getMemoryManager(): MemoryManager {
    return this.memoryManager;
  }

  /**
   * Main Event-Driven Decision Trigger
   *
   * Example input from event system:
   *   eventText = "Heavy rain has started."
   *
   * The context context construction, retrieval, decision reasoning, behavior resolution,
   * execution, and memory updates happen automatically inside this agent session context.
   */
  public async processEvent(
    eventText: string,
    currentLocation: string = 'village_center',
    currentPos: [number, number, number] = [0, 0, 0]
  ): Promise<StructuredDecision | null> {
    const decisionId = `DEC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // STAGE 1: EVENT_RECEIVED
    console.log(`[EVENT_RECEIVED][${this.citizenId.toUpperCase()}] Event: "${eventText}"`);
    agentEventLogger.logEventReceived({
      agentId: this.citizenId,
      decisionId,
      eventText,
      location: currentLocation,
    });
    this.memoryManager.recordRecentEvent(eventText);

    // STAGE 2: MEMORY_RETRIEVED
    const coreMemory = this.memoryManager.getCoreMemory();
    const workingMemory = this.memoryManager.getWorkingMemory();
    const relevantMemories = this.memoryManager.retrieveRelevantMemories(eventText);
    const worldFacts = this.memoryManager.getAllWorldFacts();
    const recentEvents = this.memoryManager.getRecentEvents();

    console.log(`[MEMORY_RETRIEVED][${this.citizenId.toUpperCase()}] Context retrieved for event: "${eventText}"`);
    agentEventLogger.logMemoryRetrieved({
      agentId: this.citizenId,
      decisionId,
      summary: `Retrieved ${relevantMemories.split('\n').length} relevant memory entries`,
      retrievedCount: relevantMemories.split('\n').length,
    });

    // STAGE 3 & 4: LLM_REQUEST & LLM_RESPONSE
    let decision = await OllamaService.generateAutonomousDecisionWithContext(
      coreMemory,
      workingMemory,
      worldFacts,
      relevantMemories,
      recentEvents,
      eventText,
      currentLocation,
      decisionId
    );

    // Fallback if LLM offline / failed
    if (!decision) {
      console.warn(`[AGENT_SESSION][${this.citizenId.toUpperCase()}] LLM unavailable. Using adaptive dynamic fallback.`);
      decision = this.generateAdaptiveFallbackDecision(eventText, workingMemory, currentLocation);
    }

    decision.decision_id = decisionId;

    // STAGE 5: DECISION_CREATED
    console.log(`[DECISION_CREATED][${this.citizenId.toUpperCase()}] Goal: "${decision.goal}", Behavior: "${decision.immediate_behavior}"`);
    agentEventLogger.logDecisionCreated({
      agentId: this.citizenId,
      decisionId,
      decision: decision as any,
    });

    // STAGE 6: BEHAVIOR_RESOLVED
    const resolved = BehaviorResolver.resolve(decision, currentLocation);
    decision.resolvedTool = resolved.tool;
    decision.resolvedArguments = resolved.arguments;
    decision.action = resolved.tool.toUpperCase();
    decision.tool = resolved.tool;
    decision.arguments = resolved.arguments;

    console.log(`[BEHAVIOR_RESOLVED][${this.citizenId.toUpperCase()}] Resolved tool: "${resolved.tool}" target: "${resolved.target}"`);
    agentEventLogger.logBehaviorResolved({
      agentId: this.citizenId,
      decisionId,
      behaviorText: decision.immediate_behavior || decision.intention || decision.goal,
      resolvedTool: resolved.tool,
      resolvedArgs: resolved.arguments,
    });

    // STAGE 7: ACTION_EXECUTED
    const execResult = ActionExecutor.executeDecision(this.citizenId, decision, currentPos);
    agentEventLogger.logActionExecuted({
      agentId: this.citizenId,
      decisionId,
      toolName: resolved.tool,
      success: execResult.success,
      reason: execResult.reason,
    });

    // STAGE 8 & 9: WORLD_STATE_UPDATED & MEMORY_UPDATED
    this.memoryManager.updateWorkingMemory(decision, currentLocation);
    this.memoryManager.addEpisodicMemory(
      `Event "${eventText}" led to behavior: "${decision.immediate_behavior}" (${execResult.reason})`,
      currentLocation,
      execResult.success ? 0.2 : -0.3
    );

    return decision;
  }

  private generateAdaptiveFallbackDecision(
    eventText: string,
    wm: any,
    currentLocation: string
  ): StructuredDecision {
    const isRain = eventText.toLowerCase().includes('rain');
    const isClosed = eventText.toLowerCase().includes('closed');

    if (isRain) {
      return {
        goal: 'Protect fresh baked goods and stay dry',
        reason: 'Heavy rain will damage items outdoors.',
        intention: 'Keep safe from rain',
        immediate_behavior: 'Return to bakery and stay indoors',
        target: 'julies_farm',
        next: 'Wait inside until rain stops',
        speech: "The rain is getting heavy! I'm taking the bread inside.",
      };
    }

    if (isClosed) {
      return {
        goal: 'Find alternative selling location or ask Ben for help',
        reason: 'The village market center is closed.',
        intention: 'Adapt bread selling strategy',
        immediate_behavior: "Go to Ben's farm to ask Ben about selling bread",
        target: 'bens_farm',
        next: 'Talk to Ben about using farm as alternative market',
        speech: "The market is closed. I'll head to Ben's farm to see if he can help.",
      };
    }

    return {
      goal: wm.goal || 'Continue autonomous routine',
      reason: `Adapting to event: ${eventText}`,
      intention: wm.intention || 'Pursue daily goals',
      immediate_behavior: `Inspect ${currentLocation}`,
      target: currentLocation,
      next: 'Re-evaluate next steps',
      speech: `Evaluating new situation after event: ${eventText}`,
    };
  }
}
