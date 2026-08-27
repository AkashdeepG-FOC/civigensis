import { StructuredDecision, CitizenIdentity } from '../../types/citizenAgent';
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

import { CITIZEN_INTERACTION_RANGE, PHYSICAL_INTIMATE_RANGE } from './InteractionConstants';
import { eventEngine } from './EventEngine';
import { attentionEngine } from './AttentionEngine';
import { taskInterruptManager } from './TaskInterruptManager';

import { TargetResolver } from './TargetResolver';

import { EmotionSystem } from './EmotionSystem';

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

  private isThinking: boolean = false;
  private lastReasoningTime: number = 0;
  private minReasoningIntervalMs: number = 2000;
  private lastActionResultText: string | null = null;
  private currentDecision: StructuredDecision | null = null;
  private fallbackLocationIndex: number = 0;
  private lastSocialTalkTime: number = 0;

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

      if (topEvt && topEvt.priority >= 80) {
        const sourceName = topEvt.source === 'ben' ? 'Ben' : topEvt.source === 'julie' ? 'Julie' : topEvt.source;
        immediateEventSummary = `${sourceName} directly spoke to ${this.identity.name}: "${topEvt.message || ''}". (Requires Response: YES, Event Priority: ${topEvt.priority})`;

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

      // 4. LLM Reasoning Call
      let decision = await OllamaService.generateAutonomousDecision(
        this.identity,
        perception.locationName,
        needsSummary,
        beliefsSummary,
        memoriesSummary,
        goalSummary,
        relationshipSummary,
        toolsSummary,
        perception.recentEvents,
        loopWarning,
        this.lastActionResultText,
        nearbyCitizensSummary,
        nearbyObjectsSummary,
        config.llm,
        attentionSummary,
        immediateEventSummary
      );

      // 5. Fallback heuristic decision if Ollama is offline or unparseable
      if (!decision) {
        decision = this.generateFallbackDecision(perception.locationName, perception.nearbyCitizens.length > 0);
      }

      // 6. Anti-Stagnation Override & Target Location / Citizen Locomotion Auto-Routing
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

    // 0. Priority Override: If active direct conversation event exists and LLM returned 'observe', override to 'respond_to_citizen'!
    const topEvt = eventEngine.getHighestPriorityEvent(this.identity.id);
    if (topEvt && topEvt.type === 'SOCIAL_INTERACTION' && (decision.tool === 'observe' || decision.tool === 'wait')) {
      const otherId = (topEvt.source || (this.identity.id === 'ben' ? 'julie' : 'ben')) as CitizenId;
      const otherName = otherId === 'ben' ? 'Ben' : 'Julie';
      console.log(`[COGNITION][PRIORITY_OVERRIDE] Overriding '${decision.tool}' to 'respond_to_citizen' due to active SOCIAL_INTERACTION from ${otherName}`);
      return {
        reasoning_summary: `${otherName} spoke to me directly. Prioritizing direct response over observation.`,
        goal: `Respond to ${otherName}`,
        intention: `Respond to ${otherName}`,
        tool: 'respond_to_citizen',
        arguments: { target: otherId, message: `I'm doing pretty well, ${otherName}. How are things with you?` },
        expected_outcome: 'Social dialogue delivered',
        confidence: 0.95,
      };
    }

    // 1. Generic Proximity Check for Citizens: If wanting to interact with a citizen out of range, walk to them first!
    if (isTargetInteractionTool && (targetCitizenId === 'ben' || targetCitizenId === 'julie')) {
      try {
        const state = simulationEngine.getState();
        const myPos = state.citizens[this.identity.id].position;
        const targetPos = state.citizens[targetCitizenId].position;

        const dx = targetPos[0] - myPos[0];
        const dy = targetPos[1] - myPos[1];
        const dz = targetPos[2] - myPos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        const currentToolLower = (decision.tool || decision.action || '').toLowerCase();
        const requiredRange = ['hug', 'kiss', 'fight'].includes(currentToolLower) ? PHYSICAL_INTIMATE_RANGE : CITIZEN_INTERACTION_RANGE;

        if (dist > requiredRange) {
          const targetName = targetCitizenId === 'ben' ? 'Ben' : 'Julie';
          console.log(
            `[AI][APPROACH] [${this.identity.name.toUpperCase()}] ${targetName} is ${dist.toFixed(
              1
            )}m away (> ${requiredRange}m). Overriding '${decision.tool}' to 'move_to(${targetCitizenId})'`
          );

          // Rotate facing towards target citizen
          navigationSystem.setLookAtTarget(this.identity.id, targetPos);

          return {
            ...decision,
            tool: 'move_to',
            arguments: { location: targetCitizenId, target: targetCitizenId },
            intention: `Approach ${targetName} to ${decision.tool}`,
            reasoning_summary: `${targetName} is ${dist.toFixed(1)}m away. Approaching target before executing ${decision.tool}.`,
          };
        } else {
          // In range! Rotate directly to face target citizen
          navigationSystem.setLookAtTarget(this.identity.id, targetPos);
        }
      } catch (err) {
        console.warn(`[COGNITION][INTERACT_SEEK_ERR]:`, err);
      }
    }

    // 2. Semantic Location Auto-Routing & Redundant Location Movement Prevention
    const textToCheck = `${decision.goal} ${decision.intention} ${decision.reasoning_summary}`.toLowerCase();
    let targetLoc: string | null = null;
    if (textToCheck.includes('village center') || textToCheck.includes('market') || textToCheck.includes('well')) targetLoc = 'village_center';
    else if (textToCheck.includes('bakery')) targetLoc = 'julies_bakery';
    else if (textToCheck.includes('farm') || textToCheck.includes('wheat field') || textToCheck.includes('crop field')) targetLoc = 'bens_farm';
    else if (textToCheck.includes('river') || textToCheck.includes('water basin')) targetLoc = 'river';
    else if (textToCheck.includes('house') || textToCheck.includes('cottage')) targetLoc = 'bens_house';

    const requestedMoveLoc = decision.tool === 'move_to' ? (decision.arguments?.location || targetLoc) : null;
    const canonicalCurrent = TargetResolver.resolveTarget(currentLocation).locationId;
    const canonicalRequested = requestedMoveLoc ? TargetResolver.resolveTarget(requestedMoveLoc).locationId : null;

    // Prevent redundant move_to if already at destination location
    if (canonicalRequested && canonicalRequested === canonicalCurrent) {
      const isCitizenTarget = ['ben', 'julie', 'ravi'].includes(canonicalRequested);
      if (!isCitizenTarget) {
        const isBen = this.identity.id === 'ben';
        const alternateLocs = isBen
          ? ['bens_farm', 'river', 'bens_house', 'julies_bakery']
          : ['julies_bakery', 'river', 'bens_house', 'bens_farm'];
        this.fallbackLocationIndex = (this.fallbackLocationIndex + 1) % alternateLocs.length;
        const nextLoc = alternateLocs[this.fallbackLocationIndex];

        console.log(`[COGNITION][ARRIVED_ROUTE] [${this.identity.name.toUpperCase()}] Already at ${currentLocation} (${canonicalCurrent}). Routing to next village destination '${nextLoc}'.`);
        return {
          ...decision,
          tool: 'move_to',
          arguments: { location: nextLoc },
          intention: `Travel to ${nextLoc} to continue village routine`,
        };
      }
    }

    if (targetLoc && TargetResolver.resolveTarget(targetLoc).locationId !== canonicalCurrent && decision.tool !== 'move_to') {
      console.log(
        `[COGNITION][AUTO_ROUTE][${this.identity.name.toUpperCase()}] Overriding '${decision.tool}' to 'move_to(${targetLoc})' because character is currently at '${currentLocation}'`
      );
      return {
        ...decision,
        tool: 'move_to',
        arguments: { location: targetLoc },
        intention: `Travel to ${targetLoc} to pursue goal`,
      };
    }

    // 3. Break Tool Stagnation if Loop Guard Alert Active
    if (loopWarning && (decision.tool === 'observe' || decision.tool === 'wait')) {
      const isBen = this.identity.id === 'ben';
      const alternateLocs = isBen
        ? ['bens_farm', 'river', 'bens_house', 'village_center']
        : ['julies_bakery', 'river', 'village_center', 'bens_house'];
      const defaultLoc = isBen ? 'bens_farm' : 'julies_bakery';
      const nextLoc = alternateLocs.find((l) => l !== currentLocation) || defaultLoc;

      console.warn(
        `[COGNITION][ANTI_STAGNATION][${this.identity.name.toUpperCase()}] Breaking '${decision.tool}' stagnation loop -> Navigating to '${nextLoc}'`
      );
      return {
        reasoning_summary: `Breaking stagnation loop. Navigating to ${nextLoc} to explore and engage in work activities.`,
        goal: `Explore ${nextLoc}`,
        intention: `Move to ${nextLoc}`,
        tool: 'move_to',
        arguments: { location: nextLoc },
        expected_outcome: 'Arrival at new location with fresh work opportunities',
        confidence: 0.85,
      };
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
    if (hasNearbyCitizen && now - this.lastSocialTalkTime > 25000) {
      this.lastSocialTalkTime = now;
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

    const currentLocId = TargetResolver.resolveTarget(locationName).locationId;
    let targetLocId = TargetResolver.resolveTarget(nextTargetLoc).locationId;

    if (currentLocId === targetLocId) {
      this.fallbackLocationIndex = (this.fallbackLocationIndex + 1) % locationList.length;
      nextTargetLoc = locationList[this.fallbackLocationIndex];
      targetLocId = TargetResolver.resolveTarget(nextTargetLoc).locationId;
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
