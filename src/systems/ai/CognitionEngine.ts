import { StructuredDecision, CitizenIdentity } from '../../types/citizenAgent';
import { MemoryManager } from './MemoryManager';
import { AgentSession } from './AgentSession';
import { NeedSystem } from './NeedSystem';

import { BeliefSystem } from './BeliefSystem';
import { MemorySystem } from './MemorySystem';
import { GoalSystem } from './GoalSystem';
import { RelationshipSystem } from './RelationshipSystem';
import { PerceptionEngine } from './PerceptionEngine';
import { AgentLoopGuard } from './AgentLoopGuard';
import { ReflectionSystem } from './ReflectionSystem';
import { toolRegistry } from './ToolRegistry';
import { ActionExecutor } from './ActionExecutor';
import { OllamaService } from './OllamaService';
import { CitizenId } from '../../types/citizen';
import { BEN_CONFIG, JULIE_CONFIG } from '../../config/citizens';
import { farmingWorldState } from './FarmingWorldState';
import { simulationEngine } from '../simulation/SimulationEngine';
import { navigationSystem } from './NavigationSystem';
import { activityDurationManager } from '../simulation/ActivityDurationManager';

import { CITIZEN_INTERACTION_RANGE, PHYSICAL_INTIMATE_RANGE } from './InteractionConstants';
import { eventEngine } from './EventEngine';
import { attentionEngine } from './AttentionEngine';
import { taskInterruptManager } from './TaskInterruptManager';

import { TargetResolver } from './TargetResolver';

import { EmotionSystem } from './EmotionSystem';
import { speechSystem } from '../speech/SpeechSystem';
import { socialInteractionSystem } from './SocialInteractionSystem';

import { economySystem } from './EconomySystem';


export class CognitionEngine {
  private identity: CitizenIdentity;
  private needSystem: NeedSystem;
  private emotionSystem?: EmotionSystem;
  private beliefSystem: BeliefSystem;
  private memorySystem: MemorySystem;
  private goalSystem: GoalSystem;
  private relationshipSystem: RelationshipSystem;
  private perceptionEngine: PerceptionEngine;
  private loopGuard: AgentLoopGuard;
  private reflectionSystem: ReflectionSystem;

  private _memoryManager?: MemoryManager;
  private _agentSession?: AgentSession;

  public get memoryManager(): MemoryManager {
    if (!this._memoryManager) {
      this._memoryManager = new MemoryManager(this.identity.id, this.identity);
    }
    return this._memoryManager;
  }

  public get agentSession(): AgentSession {
    if (!this._agentSession) {
      this._agentSession = new AgentSession(this.identity.id, this.memoryManager);
    }
    return this._agentSession;
  }

  private isThinking: boolean = false;
  private lastReasoningTime: number = 0;
  private minReasoningIntervalMs: number = 2000;
  private lastActionResultText: string | null = null;
  private currentDecision: StructuredDecision | null = null;
  private fallbackLocationIndex: number = 0;
  private lastSocialTalkTime: number = 0;
  private lastExecutedAction: { action: string; target: string; timestamp: number; success: boolean } | null = null;

  constructor(
    identity: CitizenIdentity,
    needSystem: NeedSystem,
    beliefSystem: BeliefSystem,
    memorySystem: MemorySystem,
    goalSystem: GoalSystem,
    relationshipSystem: RelationshipSystem,
    perceptionEngine: PerceptionEngine,
    loopGuard: AgentLoopGuard,
    reflectionSystem: ReflectionSystem,
    emotionSystem?: EmotionSystem
  ) {
    this.identity = identity;
    this.needSystem = needSystem;
    this.emotionSystem = emotionSystem;
    this.beliefSystem = beliefSystem;
    this.memorySystem = memorySystem;
    this.goalSystem = goalSystem;
    this.relationshipSystem = relationshipSystem;
    this.perceptionEngine = perceptionEngine;
    this.loopGuard = loopGuard;
    this.reflectionSystem = reflectionSystem;
  }



  public getIsThinking(): boolean {
    return this.isThinking;
  }

  public isActionInProgress(): boolean {
    const isNavigating = navigationSystem.getCurrentIntention(this.identity.id) !== null;
    const isActivityActive = activityDurationManager.isActivityActive(this.identity.id);
    return isNavigating || isActivityActive;
  }

  public getIsBusy(): boolean {
    return this.isThinking || this.isActionInProgress();
  }

  public getCurrentDecision(): StructuredDecision | null {
    return this.currentDecision;
  }

  /**
   * Main event-driven reasoning turn
   */
  public async think(
    currentPos: [number, number, number],
    allPositions: Record<CitizenId, [number, number, number]>,
    triggerReason: string = 'Routine turn'
  ) {
    const now = Date.now();
    if (this.isThinking) return;

    // Action Execution Guard: Prevent triggering a new LLM reasoning request
    // if the citizen is currently busy moving or performing an activity duration,
    // unless this trigger is an explicit action completion or urgent interrupt.
    const isActionActive = this.isActionInProgress();
    const isActionCompletionTrigger = 
      triggerReason.includes('Arrived') ||
      triggerReason.includes('completed') ||
      triggerReason.includes('failed') ||
      triggerReason.includes('No active goal') ||
      triggerReason.includes('Initial startup') ||
      triggerReason.includes('Urgent') ||
      triggerReason.includes('Interrupt');

    if (isActionActive && !isActionCompletionTrigger) {
      console.log(`[COGNITION_GUARD][${this.identity.name.toUpperCase()}] Suppressed LLM reasoning turn: Action currently in progress ("${triggerReason}").`);
      return;
    }

    if (now - this.lastReasoningTime < this.minReasoningIntervalMs && triggerReason.includes('Routine')) {
      return;
    }

    this.isThinking = true;
    this.lastReasoningTime = now;

    try {
      // 1. Perception Filtering
      const perception = this.perceptionEngine.perceive(currentPos, allPositions);
      this.loopGuard.recordLocation(perception.locationName);

      // 2. Reflection check
      if (this.reflectionSystem.shouldReflect(perception.recentEvents.length)) {
        this.reflectionSystem.reflect(
          this.identity,
          this.memorySystem,
          this.beliefSystem,
          this.goalSystem,
          triggerReason
        );
      }

      // 3. Build LLM Context & Attention Layer
      const otherId: CitizenId = this.identity.id === 'ben' ? 'julie' : 'ben';
      const activeGoal = this.goalSystem.getActiveGoal();
      const currentNeeds = this.needSystem.getNeeds();

      const attentionSnapshot = attentionEngine.computeAttention(
        this.identity,
        currentNeeds,
        activeGoal?.description,
        perception.locationName
      );
      const attentionSummary = attentionEngine.formatAttentionPrompt(attentionSnapshot);

      const topEvt = eventEngine.getHighestPriorityEvent(this.identity.id);
      let immediateEventSummary: string | null = null;
      const socialTurns = socialInteractionSystem.getConsecutiveTurns(this.identity.id, otherId);

      if (topEvt && topEvt.priority >= 80) {
        const sourceName = topEvt.source === 'ben' ? 'Ben' : topEvt.source === 'julie' ? 'Julie' : topEvt.source;
        const requiresResp = topEvt.requiresResponse !== false && socialTurns < 3;
        const reqStr = requiresResp ? 'YES' : 'NO (Conversation turn limit reached - say goodbye & return to work)';
        immediateEventSummary = `${sourceName} directly spoke to ${this.identity.name}: "${topEvt.message || ''}". (Requires Response: ${reqStr}, Exchange Turn: ${socialTurns})`;

        // Save current active lower-priority task before responding
        if (
          this.currentDecision &&
          this.currentDecision.tool &&
          !['talk', 'respond_to_citizen'].includes(this.currentDecision.tool.toLowerCase())
        ) {
          taskInterruptManager.saveInterruptedTask(this.identity.id, {
            tool: this.currentDecision.tool,
            arguments: this.currentDecision.arguments || {},
            goal: this.currentDecision.goal || 'Background work',
            intention: this.currentDecision.intention || 'Background activity',
            priority: 50,
            targetLocation: perception.locationName,
          });
        }
      }

      const needsSummary = this.needSystem.getMotivationalPressures(this.identity);
      needsSummary.push(economySystem.getEconomyPromptSummary(this.identity.id));
      const beliefsSummary = this.beliefSystem.getBeliefsPromptSummary(5);
      const memoriesSummary = this.memorySystem.getRelevantMemoriesPrompt(perception.locationName);
      const goalSummary = this.goalSystem.getGoalsPromptSummary();
      const relationshipSummary = this.relationshipSystem.getRelationshipPromptSummary(otherId);
      const toolsSummary = toolRegistry.getToolsPromptSummary();
      const loopWarning = this.loopGuard.checkForLoopWarnings();

      const nearbyCitizensSummary = perception.nearbyCitizens.length > 0
        ? perception.nearbyCitizens.map((c) => `- ${c.name} (${c.id}) at ${c.location}, distance: ${c.distance}m, status: ${c.apparentActivity}. ${c.recentInteraction || ''}`).join('\n')
        : '- No citizens nearby.';

      const nearbyObjectsSummary = perception.visibleObjects.length > 0
        ? perception.visibleObjects.map((o) => `- ${o}`).join('\n')
        : '- No special interactable objects nearby.';

      let config: typeof BEN_CONFIG;
      switch (this.identity.id) {
        case 'ben':
          config = BEN_CONFIG;
          break;
        case 'julie':
          config = JULIE_CONFIG;
          break;
        default:
          throw new Error(`Unknown citizen ID: ${this.identity.id}`);
      }

      // 3.5 Check for Interrupted / Queued Task Resume on Arrival
      let decision: StructuredDecision | null = null;
      if (triggerReason.includes('Arrived')) {
        const resumedTask = taskInterruptManager.resumeTaskIfValid(this.identity.id);
        if (resumedTask) {
          console.log(
            `[COGNITION][RESUME_ON_ARRIVAL][${this.identity.name.toUpperCase()}] Resuming saved interaction '${resumedTask.tool}' after arriving at target.`
          );
          decision = resumedTask;
          decision.decision_id = `DEC-RESUME-${Date.now()}`;
        }
      }

      // 4. LLM Reasoning Call via AgentSession (Dynamic Memory + Event-Driven)
      if (!decision) {
        decision = await this.agentSession.processEvent(
          triggerReason,
          perception.locationName,
          currentPos
        );
      }


      // 5. If Ollama decision failed or offline, log cognitive pause without hardcoded state machine steering
      if (!decision) {
        console.warn(`[COGNITION][${this.identity.name.toUpperCase()}] LLM decision unavailable or unparseable. Cognitive pause (no hardcoded state machine steering).`);
        return;
      }

      // 6. Post-process facing and target resolution (without silent tool overrides)
      decision = this.postProcessDecision(decision, perception.locationName, loopWarning);

      this.currentDecision = decision;

      console.log(`
================ AI DECISION ================
Citizen: ${this.identity.name}
Current Location: ${perception.locationName}
Needs: Hunger: ${Math.round(currentNeeds.hunger)}%, Energy: ${Math.round(currentNeeds.energy)}%, Thirst: ${Math.round(currentNeeds.thirst)}%
Current Goal: ${decision.goal}
Reasoning: ${decision.reason || decision.reasoning_summary || 'Evaluating village needs'}
Decision:
  Goal: ${decision.goal}
  Action: ${decision.action || decision.tool}
  Target: ${decision.target || decision.arguments?.location || 'none'}
  Next Action: ${decision.expected_next_action || 'none'}
Speech: "${decision.speech || decision.intention || 'Working in village'}"
==============================================
`);

      // 7. Record decision in Goal System if goal updated
      if (decision.goal && decision.goal !== 'Autonomous Intention') {
        const activeGoal = this.goalSystem.getActiveGoal();
        if (!activeGoal || activeGoal.description !== decision.goal) {
          this.goalSystem.createGoal(decision.goal, 6, decision.reason || decision.reasoning_summary);
        }
      }

      const activeToolName = decision.tool || decision.action || 'GO_TO';
      console.log(`[AI][ACTION_START] [${this.identity.name.toUpperCase()}] Action: "${activeToolName}" -> Target: "${decision.target || decision.arguments?.location}"`);
      const toolResult = ActionExecutor.executeDecision(this.identity.id, decision, currentPos);
      this.loopGuard.recordToolCall(activeToolName, decision.arguments || {}, toolResult.success);

      if (toolResult.success) {
        this.loopGuard.reset();
        if (['talk', 'respond_to_citizen', 'compliment', 'ask', 'invite', 'trade'].includes(activeToolName.toLowerCase())) {
          this.lastSocialTalkTime = Date.now();
        }
      }

      this.lastActionResultText = `Tool "${activeToolName}": ${toolResult.reason} (Success: ${toolResult.success})`;
      console.log(`[AI][ACTION_COMPLETE] [${this.identity.name.toUpperCase()}] Tool "${activeToolName}" completed: ${toolResult.reason}`);

      // 9. Store Memory & Update State
      if (toolResult.memoryDescription) {
        this.memorySystem.addEpisodicMemory(
          toolResult.memoryDescription,
          perception.locationName,
          toolResult.success ? 0.2 : -0.3
        );
      }

      if (!toolResult.success) {
        console.warn(`[COGNITION][${this.identity.name.toUpperCase()}] Tool execution failed: ${toolResult.reason}`);
        this.beliefSystem.addOrUpdateBelief(
          `Action "${activeToolName}" failed at ${perception.locationName}: ${toolResult.reason}`,
          0.9,
          'observation'
        );
      }

      this.lastExecutedAction = {
        action: decision.action || activeToolName,
        target: decision.target || decision.arguments?.location || decision.arguments?.target || 'none',
        timestamp: Date.now(),
        success: toolResult.success,
      };
      this.clearCurrentDecision();

      // Consume processed social interaction event
      if (topEvt) {
        eventEngine.consumeEvent(this.identity.id, topEvt.id);
      }
    } catch (err) {
      console.error(`[COGNITION_ERR][${this.identity.name.toUpperCase()}]:`, err);
    } finally {
      this.isThinking = false;
    }
  }

  public clearCurrentDecision() {
    this.currentDecision = null;
  }

  /**
   * Auto-routes locomotion to target locations / citizens and breaks tool stagnation
   */
  private postProcessDecision(
    decision: StructuredDecision,
    currentLocation: string,
    loopWarning: string | null
  ): StructuredDecision {
    const interactiveTargetTools = [
      'respond_to_citizen', 'talk', 'ask', 'help', 'invite', 'trade', 'follow',
      'compliment', 'insult', 'apologize', 'forgive', 'flirt', 'hug', 'kiss', 'reject', 'avoid',
      'confront', 'argue', 'fight', 'defend', 'threaten', 'steal', 'give'
    ];
    const currentToolName = (decision.tool || decision.action || '').toLowerCase();
    const isTargetInteractionTool = interactiveTargetTools.includes(currentToolName);
    const targetArg = decision.arguments?.target || decision.arguments?.victim || decision.arguments?.recipient;
    const targetCitizenId: CitizenId = (
      targetArg || (this.identity.id === 'ben' ? 'julie' : 'ben')
    ).toLowerCase() as CitizenId;

    // 0. Facing Adjustment: If active direct conversation event exists and performing social action, face the speaker
    const topEvt = eventEngine.getHighestPriorityEvent(this.identity.id);
    if (topEvt && topEvt.type === 'SOCIAL_INTERACTION' && isTargetInteractionTool) {
      const otherId = (topEvt.source || (this.identity.id === 'ben' ? 'julie' : 'ben')) as CitizenId;
      try {
        const state = simulationEngine.getState();
        const otherPos = state.citizens[otherId]?.position;
        if (otherPos) {
          navigationSystem.setLookAtTarget(this.identity.id, otherPos);
        }
      } catch {}
    }

    // 1. Target Facing: Rotate facing towards target citizen if performing social interaction
    if (isTargetInteractionTool && (targetCitizenId === 'ben' || targetCitizenId === 'julie')) {
      try {
        const state = simulationEngine.getState();
        const targetPos = state.citizens[targetCitizenId]?.position;
        if (targetPos) {
          navigationSystem.setLookAtTarget(this.identity.id, targetPos);
        }
      } catch (err) {
        console.warn(`[COGNITION][INTERACT_SEEK_ERR]:`, err);
      }
    }

    return decision;
  }

  /**
   * Dynamic varied fallback engine that rotates locations, explorations, social chats, and work actions
   */
  private generateFallbackDecision(locationName: string, hasNearbyCitizen: boolean = false): StructuredDecision {
    const needs = this.needSystem.getNeeds();
    const isBen = this.identity.id === 'ben';
    const otherName = isBen ? 'Julie' : 'Ben';
    const otherId: CitizenId = isBen ? 'julie' : 'ben';
    const homeLoc = isBen ? 'bens_house' : 'julies_bakery';

    // 1. Critical Survival Needs Priority Override
    if (needs.hunger > 80) {
      const homeLoc = isBen ? 'bens_house' : 'julies_farm';
      return {
        goal: 'Satisfy hunger and prepare meal',
        reason: `Hunger level is high (${Math.round(needs.hunger)}%). I need food to maintain strength.`,
        action: 'GO_TO',
        target: homeLoc,
        expected_next_action: 'EAT',
        speech: `I'm getting really hungry. I should head to ${isBen ? 'my house' : 'the bakery'} and get something to eat.`,
        tool: 'move_to',
        arguments: { location: homeLoc },
        reasoning_summary: 'Hunger level high. Returning home for meal.',
        intention: 'Head home to eat',
        expected_outcome: 'Replenished hunger',
        confidence: 0.95,
      };
    }

    if (needs.energy < 20) {
      const homeLoc = isBen ? 'bens_house' : 'julies_farm';
      return {
        goal: 'Rest and recover energy',
        reason: `Energy level is low (${Math.round(needs.energy)}%). I need to rest.`,
        action: 'GO_TO',
        target: homeLoc,
        expected_next_action: 'REST',
        speech: "I'm feeling exhausted. I need to head back home and get some sleep.",
        tool: 'move_to',
        arguments: { location: homeLoc },
        reasoning_summary: 'Energy low. Returning home for rest.',
        intention: 'Head home to rest',
        expected_outcome: 'Recovered energy',
        confidence: 0.95,
      };
    }

    // 1.5 Pending Direct Social Interaction Check
    const topEvt = eventEngine.getHighestPriorityEvent(this.identity.id);
    if (topEvt && topEvt.type === 'SOCIAL_INTERACTION' && topEvt.requiresResponse !== false && topEvt.priority >= 80) {
      const sourceId = (topEvt.source || otherId) as CitizenId;
      const sourceName = sourceId === 'ben' ? 'Ben' : 'Julie';

      // Check if recent conversation memory exists with source citizen
      const recentMemories = this.memorySystem.getRecentEpisodicMemories(5);
      const chattedRecently = recentMemories.some((m) => m.description.toLowerCase().includes(sourceName.toLowerCase()));

      if (chattedRecently) {
        const farewellMessage = `Nice chatting with you ${sourceName}! I need to get back to my work now.`;
        return {
          goal: `Resume routine work`,
          reason: `Concluded conversation with ${sourceName}.`,
          action: 'GO_TO',
          target: homeLoc,
          speech: farewellMessage,
          tool: 'move_to',
          arguments: { location: homeLoc },
          reasoning_summary: `Concluded chat with ${sourceName}. Heading to ${homeLoc}.`,
          intention: `Return to routine at ${homeLoc}`,
          expected_outcome: `Arrived at ${homeLoc}`,
          confidence: 0.9,
        };
      } else {
        const responseMessage = `Hi ${sourceName}! Good to see you. How are things going with you today?`;
        return {
          goal: `Respond to ${sourceName}`,
          reason: `${sourceName} directly initiated a conversation.`,
          action: 'RESPOND_TO_CITIZEN',
          target: sourceId,
          speech: responseMessage,
          tool: 'respond_to_citizen',
          arguments: { target: sourceId, message: responseMessage },
          reasoning_summary: `Direct response to ${sourceName}.`,
          intention: `Respond to ${sourceName}`,
          expected_outcome: 'Social dialogue delivered',
          confidence: 0.95,
        };
      }
    }

    // 2. Farming Work Needs Priority (Ben)
    const crop = farmingWorldState.wheatCrop;

    if (crop.isMature && isBen) {
      return {
        goal: 'Harvest mature wheat crops',
        reason: 'The wheat field is fully grown and mature for harvest.',
        action: locationName === 'bens_farm' || locationName === 'wheat' ? 'HARVEST_CROP' : 'GO_TO',
        target: 'bens_farm',
        expected_next_action: locationName === 'bens_farm' || locationName === 'wheat' ? undefined : 'HARVEST_CROP',
        speech: "The wheat is golden and mature! I'll harvest the crops now.",
        tool: locationName === 'bens_farm' || locationName === 'wheat' ? 'harvest_crops' : 'move_to',
        arguments: locationName === 'bens_farm' || locationName === 'wheat' ? {} : { location: 'bens_farm' },
        reasoning_summary: 'Wheat crops mature.',
        intention: 'Harvest wheat crops',
        expected_outcome: 'Harvested wheat stored',
        confidence: 0.9,
      };
    }

    if (crop.waterLevel < 35 && isBen) {
      const buckets = farmingWorldState.getNeeds('ben').waterBucket;
      if (buckets > 0) {
        return {
          goal: 'Irrigate wheat crops',
          reason: `Wheat water level is low (${crop.waterLevel}%). I have water buckets ready.`,
          action: locationName === 'bens_farm' || locationName === 'wheat' ? 'WATER_CROP' : 'GO_TO',
          target: 'bens_farm',
          expected_next_action: locationName === 'bens_farm' || locationName === 'wheat' ? undefined : 'WATER_CROP',
          speech: "The crops are dry and need water. I'll water the wheat field now.",
          tool: locationName === 'bens_farm' || locationName === 'wheat' ? 'water_crops' : 'move_to',
          arguments: locationName === 'bens_farm' || locationName === 'wheat' ? {} : { location: 'bens_farm' },
          reasoning_summary: 'Irrigating dry wheat field.',
          intention: 'Water wheat field',
          expected_outcome: 'Hydrated crops',
          confidence: 0.9,
        };
      } else {
        return {
          goal: 'Water the wheat crops',
          reason: `Wheat field water level is low (${crop.waterLevel}%). I need to refill water buckets at the river.`,
          action: locationName === 'river' ? 'COLLECT_WATER' : 'GO_TO',
          target: locationName === 'river' ? 'river' : 'river',
          expected_next_action: locationName === 'river' ? 'GO_TO' : 'COLLECT_WATER',
          speech: 'The wheat field is getting dry. I need to collect water from the river.',
          tool: locationName === 'river' ? 'collect_water' : 'move_to',
          arguments: locationName === 'river' ? {} : { location: 'river' },
          reasoning_summary: 'Heading to river to collect crop water.',
          intention: 'Collect water at river',
          expected_outcome: 'Refilled water buckets',
          confidence: 0.9,
        };
      }
    }

    // 3. Social Interaction Fallback
    const now = Date.now();
    const socialTurns = socialInteractionSystem.getConsecutiveTurns(this.identity.id, otherId);
    if (hasNearbyCitizen && now - this.lastSocialTalkTime > 60000 && socialTurns < 1) {
      return {
        goal: `Converse with ${otherName}`,
        reason: `Noticed nearby citizen ${otherName}. Exchanging community news.`,
        action: 'TALK',
        target: otherId,
        speech: `Hello ${otherName}, how are things going with you today?`,
        tool: 'talk',
        arguments: { target: otherId, message: `Hello ${otherName}, how are things with you today?` },
        reasoning_summary: `Social exchange with ${otherName}.`,
        intention: `Greet ${otherName}`,
        expected_outcome: 'Friendly exchange',
        confidence: 0.85,
      };
    }

    // 4. Dynamic Village Exploration & Work Patrol Loop
    const benLocations = ['bens_farm', 'river', 'village_center', 'bens_house', 'julies_farm'];
    const julieLocations = ['julies_farm', 'village_center', 'river', 'bens_house', 'bens_farm'];
    const locationList = isBen ? benLocations : julieLocations;

    this.fallbackLocationIndex = (this.fallbackLocationIndex + 1) % locationList.length;
    let nextTargetLoc = locationList[this.fallbackLocationIndex];

    const currentLocId = TargetResolver.resolveTarget(locationName)?.locationId;
    let targetLocId = TargetResolver.resolveTarget(nextTargetLoc)?.locationId;

    if (currentLocId === targetLocId) {
      this.fallbackLocationIndex = (this.fallbackLocationIndex + 1) % locationList.length;
      nextTargetLoc = locationList[this.fallbackLocationIndex];
      targetLocId = TargetResolver.resolveTarget(nextTargetLoc)?.locationId;
    }

    const locDisplayName = nextTargetLoc.replace('_', ' ');

    return {
      goal: `Patrol and inspect ${locDisplayName}`,
      reason: `Maintaining village community presence at ${locDisplayName}.`,
      action: 'GO_TO',
      target: nextTargetLoc,
      expected_next_action: 'INSPECT',
      speech: `I'm going to head over to ${locDisplayName} to check on things.`,
      tool: 'move_to',
      arguments: { location: nextTargetLoc },
      reasoning_summary: `Patrolling to ${nextTargetLoc}.`,
      intention: `Travel to ${nextTargetLoc}`,
      expected_outcome: `Arrived at ${nextTargetLoc}`,
      confidence: 0.85,
    };
  }
}
