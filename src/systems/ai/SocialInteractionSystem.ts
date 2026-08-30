import { CitizenId } from '../../types/citizen';
import { ToolResult } from '../../types/citizenAgent';
import { simulationEngine } from '../simulation/SimulationEngine';
import { worldEventBus } from '../simulation/WorldEventBus';
import { CITIZEN_INTERACTION_RANGE, PHYSICAL_INTIMATE_RANGE } from './InteractionConstants';
import { eventEngine } from './EventEngine';
import { navigationSystem } from './NavigationSystem';
import { activityDurationManager } from '../simulation/ActivityDurationManager';
import { speechSystem } from '../speech/SpeechSystem';
import { TextSimilarity } from './TextSimilarity';

interface ConversationSession {
  consecutiveTurns: number;
  lastInteractionTime: number;
}

export class SocialInteractionSystem {
  private static instance: SocialInteractionSystem;
  private conversationSessions: Map<string, ConversationSession> = new Map();

  constructor() { }

  public static getInstance(): SocialInteractionSystem {
    if (!SocialInteractionSystem.instance) {
      SocialInteractionSystem.instance = new SocialInteractionSystem();
    }
    return SocialInteractionSystem.instance;
  }

  private getPairKey(actorId: CitizenId, targetId: CitizenId): string {
    return [actorId, targetId].sort().join(':');
  }

  public getConsecutiveTurns(actorId: CitizenId, targetId: CitizenId): number {
    const key = this.getPairKey(actorId, targetId);
    const session = this.conversationSessions.get(key);
    if (!session) return 0;
    if (Date.now() - session.lastInteractionTime > 45000) {
      session.consecutiveTurns = 0;
      return 0;
    }
    return session.consecutiveTurns;
  }

  public resetConversationSession(actorId: CitizenId, targetId: CitizenId) {
    const key = this.getPairKey(actorId, targetId);
    this.conversationSessions.delete(key);
  }

  private getAgent(id: CitizenId) {
    try {
      const { benAIBrain, julieAIBrain } = require('./CitizenAIBrain');
      return id === 'ben' ? benAIBrain?.agent : julieAIBrain?.agent;
    } catch {
      return null;
    }
  }


  private getTargetId(actorId: CitizenId, args: Record<string, any>): CitizenId {
    const rawTarget = String(args?.target || args?.citizenId || args?.recipient || args?.victim || (actorId === 'ben' ? 'julie' : 'ben')).toLowerCase();
    if (rawTarget.includes('ravi')) return 'ravi';
    if (rawTarget.includes('julie')) return 'julie';
    if (rawTarget.includes('ben')) return 'ben';
    return actorId === 'ben' ? 'julie' : 'ben';
  }

  private getDistance(posA: [number, number, number], posB: [number, number, number]): number {
    const dx = posA[0] - posB[0];
    const dy = posA[1] - posB[1];
    const dz = posA[2] - posB[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public validateSocialInteraction(
    citizenId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): { valid: boolean; reason: string } {
    const targetId = this.getTargetId(citizenId, args);

    if (targetId === citizenId) {
      return { valid: false, reason: 'Cannot interact socially with yourself.' };
    }

    let targetPos: [number, number, number] = [0, 0, 0];
    try {
      targetPos = simulationEngine.getState().citizens[targetId].position;
    } catch {
      return { valid: false, reason: `Target citizen ${targetId} position not found.` };
    }

    const dist = this.getDistance(currentPos, targetPos);
    const isPhysicalIntimate = ['hug', 'kiss'].includes(action.toLowerCase());
    const maxDistance = isPhysicalIntimate ? PHYSICAL_INTIMATE_RANGE : CITIZEN_INTERACTION_RANGE;

    if (dist > maxDistance) {
      const targetName = targetId === 'ben' ? 'Ben' : targetId === 'julie' ? 'Julie' : targetId === 'ravi' ? 'Ravi' : String(targetId);
      return {
        valid: false,
        reason: `${targetName} is out of interaction range (${dist.toFixed(1)}m away, max ${maxDistance}m).`,
      };
    }

    return { valid: true, reason: 'Target citizen is available and in range.' };
  }

  public executeSocialInteraction(
    actorId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): ToolResult {
    const targetId = this.getTargetId(actorId, args);
    const actorAgent = this.getAgent(actorId);
    const targetAgent = this.getAgent(targetId);

    const actorName = actorAgent.identity.name;
    const targetName = targetAgent.identity.name;
    const actLower = action.toLowerCase();

    const location = actorAgent.perceptionEngine.perceive(currentPos, {
      ben: simulationEngine.getState().citizens.ben.position,
      julie: simulationEngine.getState().citizens.julie.position,
      ravi: simulationEngine.getState().citizens.ravi.position,
    }).locationName;

    // 1. Consent / Willingness evaluation for intimate actions (hug, kiss, flirt)
    if (['hug', 'kiss', 'flirt'].includes(actLower)) {
      const targetRelToActor = targetAgent.relationshipSystem.getRelationship(actorId);
      const affectionScore = targetRelToActor.friendship + (targetRelToActor.romance || 0) + targetRelToActor.trust;
      const hostilityScore = targetRelToActor.frustration + (targetRelToActor.anger || 0) + (targetRelToActor.resentment || 0);

      const threshold = actLower === 'kiss' ? 120 : actLower === 'hug' ? 70 : 50;

      if (affectionScore - hostilityScore < threshold) {
        // Target rejects intimate interaction!
        const rejectEvent = `CITIZEN_${actLower.toUpperCase()}_REJECTED`;
        const rejectReason = `${targetName} rejected ${actorName}'s attempt to ${actLower} (Affection too low / Hostility high).`;

        worldEventBus.emit(rejectEvent, rejectReason, { actorId, targetId, action: actLower });

        // Relationship impact of rejection
        actorAgent.relationshipSystem.modifyRelationship(targetId, { frustration: 10, resentment: 5 }, `${actLower}_rejected`);
        targetAgent.relationshipSystem.modifyRelationship(actorId, { frustration: 15, anger: 10 }, `rejected_${actLower}`);

        // Perspective-aware memories
        actorAgent.memorySystem.addEpisodicMemory(`I tried to ${actLower} ${targetName}, but ${targetName} rejected me.`, location, -0.4);
        targetAgent.memorySystem.addEpisodicMemory(`${actorName} tried to ${actLower} me, but I rejected them.`, location, -0.2);

        // Immediate wake-up for target citizen to react autonomously
        this.triggerTargetReaction(targetId, actorId, `${actorName} tried to ${actLower} you, but you rejected them.`);

        return {
          success: false,
          reason: rejectReason,
          memoryDescription: `Attempted to ${actLower} ${targetName}, but was rejected`,
          eventType: rejectEvent,
          targetId,
        };
      }
    }

    // 2. Handle specific social action execution
    let eventType = 'CITIZEN_INTERACTED';
    let summaryText = '';
    let actorMemoryText = '';
    let targetMemoryText = '';

    const actorRelDeltas: Record<string, number> = {};
    const targetRelDeltas: Record<string, number> = {};

    switch (actLower) {
      case 'respond_to_citizen':
      case 'talk': {
        eventType = 'CITIZEN_TALKED';
        const msg = args.message || args.topic || `Hello ${targetName}`;
        summaryText = `${actorName} interacted with ${targetName}`;
        actorMemoryText = `I interacted with ${targetName}`;
        targetMemoryText = `${actorName} interacted with me`;
        actorRelDeltas.familiarity = 3;
        targetRelDeltas.familiarity = 3;
        targetRelDeltas.friendship = 2;
        break;
      }
      case 'ask': {
        eventType = 'CITIZEN_ASKED';
        const q = args.question || args.message || `Asking ${targetName}`;
        summaryText = `${actorName} asked ${targetName}: "${q}"`;
        actorMemoryText = `I asked ${targetName}: "${q}"`;
        targetMemoryText = `${actorName} asked me: "${q}"`;
        actorRelDeltas.familiarity = 4;
        targetRelDeltas.familiarity = 4;
        targetRelDeltas.trust = 2;
        break;
      }
      case 'greet': {
        eventType = 'CITIZEN_GREETED';
        summaryText = `${actorName} warmly greeted ${targetName}`;
        actorMemoryText = `I warmly greeted ${targetName}`;
        targetMemoryText = `${actorName} warmly greeted me`;
        actorRelDeltas.friendship = 2;
        targetRelDeltas.friendship = 3;
        break;
      }
      case 'help': {
        eventType = 'CITIZEN_HELPED';
        const task = args.task || 'tasks';
        summaryText = `${actorName} helped ${targetName} with ${task}`;
        actorMemoryText = `I helped ${targetName} with ${task}`;
        targetMemoryText = `${actorName} helped me with ${task}`;
        targetRelDeltas.gratitude = 15;
        targetRelDeltas.trust = 10;
        targetRelDeltas.friendship = 10;
        targetRelDeltas.frustration = -10;
        targetRelDeltas.anger = -10;
        break;
      }
      case 'compliment': {
        eventType = 'CITIZEN_COMPLIMENTED';
        summaryText = `${actorName} complimented ${targetName}`;
        actorMemoryText = `I complimented ${targetName}`;
        targetMemoryText = `${actorName} complimented me`;
        targetRelDeltas.friendship = 8;
        targetRelDeltas.gratitude = 5;
        targetRelDeltas.respect = 5;
        break;
      }
      case 'insult': {
        eventType = 'CITIZEN_INSULTED';
        summaryText = `${actorName} insulted ${targetName}`;
        actorMemoryText = `I insulted ${targetName}`;
        targetMemoryText = `${actorName} insulted me`;
        targetRelDeltas.friendship = -15;
        targetRelDeltas.trust = -10;
        targetRelDeltas.anger = 25;
        targetRelDeltas.resentment = 20;
        targetRelDeltas.respect = -10;
        break;
      }
      case 'apologize': {
        eventType = 'CITIZEN_APOLOGIZED';
        summaryText = `${actorName} apologized to ${targetName}`;
        actorMemoryText = `I apologized to ${targetName}`;
        targetMemoryText = `${actorName} apologized to me`;
        targetRelDeltas.resentment = -15;
        targetRelDeltas.anger = -15;
        targetRelDeltas.trust = 8;
        targetRelDeltas.respect = 5;
        break;
      }
      case 'forgive': {
        eventType = 'CITIZEN_FORGAVE';
        summaryText = `${actorName} forgave ${targetName}`;
        actorMemoryText = `I forgave ${targetName}`;
        targetMemoryText = `${actorName} forgave me`;
        targetRelDeltas.gratitude = 15;
        targetRelDeltas.trust = 10;
        actorRelDeltas.resentment = -20;
        actorRelDeltas.anger = -20;
        break;
      }
      case 'flirt': {
        eventType = 'CITIZEN_FLIRTED';
        summaryText = `${actorName} flirted with ${targetName}`;
        actorMemoryText = `I flirted with ${targetName}`;
        targetMemoryText = `${actorName} flirted with me`;
        targetRelDeltas.romance = 10;
        targetRelDeltas.friendship = 5;
        break;
      }
      case 'hug': {
        eventType = 'HUG_ACCEPTED';
        summaryText = `${actorName} hugged ${targetName}`;
        actorMemoryText = `I gave ${targetName} a warm hug`;
        targetMemoryText = `${actorName} gave me a warm hug`;
        actorRelDeltas.friendship = 10;
        actorRelDeltas.romance = 5;
        targetRelDeltas.friendship = 12;
        targetRelDeltas.romance = 8;
        targetRelDeltas.trust = 10;
        break;
      }
      case 'kiss': {
        eventType = 'KISS_ACCEPTED';
        summaryText = `${actorName} kissed ${targetName}`;
        actorMemoryText = `I kissed ${targetName}`;
        targetMemoryText = `${actorName} kissed me`;
        actorRelDeltas.romance = 20;
        actorRelDeltas.friendship = 10;
        targetRelDeltas.romance = 25;
        targetRelDeltas.friendship = 12;
        targetRelDeltas.trust = 15;
        break;
      }
      default: {
        eventType = `CITIZEN_${actLower.toUpperCase()}`;
        summaryText = `${actorName} performed ${action} towards ${targetName}`;
        actorMemoryText = `I performed ${action} towards ${targetName}`;
        targetMemoryText = `${actorName} performed ${action} towards me`;
        targetRelDeltas.familiarity = 3;
        break;
      }
    }

    // 3. Emit World Event & Register in EventEngine for priority reaction
    worldEventBus.emit(eventType, summaryText, {
      actorId,
      targetId,
      action: actLower,
      location,
      arguments: args,
    });

    const dialogueText = args.message || args.speech || args.question || summaryText;

    if (dialogueText && typeof window !== 'undefined') {
      speechSystem.speak(actorId, dialogueText);
    }

    // Update conversation session turn tracker
    const pairKey = this.getPairKey(actorId, targetId);
    let session = this.conversationSessions.get(pairKey);
    const now = Date.now();

    if (!session || now - session.lastInteractionTime > 45000) {
      session = { consecutiveTurns: 1, lastInteractionTime: now };
    } else {
      session.consecutiveTurns++;
      session.lastInteractionTime = now;
    }
    this.conversationSessions.set(pairKey, session);

    const isParting = /goodbye|bye|see you|later|gotta go|have to go|back to work|catch you|take care|have a good day/i.test(dialogueText);
    const isQuestion = actLower === 'ask' || dialogueText.includes('?');

    // Check repetition against actor's recent conversation memories
    const recentActorMemories = actorAgent.memorySystem.getRecentEpisodicMemories(6).map((m: any) => m.description);
    const repCheck = TextSimilarity.isRepetitiveMessage(dialogueText, recentActorMemories);

    // Break ping-pong reaction loop if conversation reached turn limit (>= 3), contains parting, or is repetitive
    let requiresResponse = true;
    let eventPriority = 80;

    if (session.consecutiveTurns >= 3 || isParting || repCheck.isRepetitive) {
      requiresResponse = false;
      eventPriority = 30;
      console.log(
        `[CONVERSATION_GUARD] Ending dialogue ping-pong loop between ${actorName} & ${targetName} (Turns: ${session.consecutiveTurns}, Parting: ${isParting}, Repetitive: ${repCheck.isRepetitive}).`
      );
      // Consume pending social events to prevent leftover triggers
      eventEngine.consumeAllSocialEvents(actorId);
      eventEngine.consumeAllSocialEvents(targetId);
    } else {
      requiresResponse = true;
      eventPriority = isQuestion ? 90 : 80;
    }

    eventEngine.pushEvent({
      type: 'SOCIAL_INTERACTION',
      target: targetId,
      source: actorId,
      message: dialogueText,
      requiresResponse,
      priority: eventPriority,
    });

    // 4. Modify Relationships & Fulfill Social Needs
    actorAgent.relationshipSystem.modifyRelationship(targetId, actorRelDeltas, actLower);
    targetAgent.relationshipSystem.modifyRelationship(actorId, targetRelDeltas, actLower);

    actorAgent.needSystem.modifyNeed('socialConnection', 30);
    actorAgent.needSystem.modifyNeed('belonging', 15);
    targetAgent.needSystem.modifyNeed('socialConnection', 30);
    targetAgent.needSystem.modifyNeed('belonging', 15);

    // 5. Store Perspective-Aware Memories
    actorAgent.memorySystem.addEpisodicMemory(actorMemoryText, location, 0.3);
    targetAgent.memorySystem.addEpisodicMemory(targetMemoryText, location, 0.3);

    // 6. Update Target Citizen's Perception & Trigger Autonomous LLM Reaction
    this.triggerTargetReaction(targetId, actorId, summaryText, requiresResponse);

    return {
      success: true,
      reason: summaryText,
      memoryDescription: actorMemoryText,
      eventType,
      targetId,
      consequences: {
        actorDeltas: actorRelDeltas,
        targetDeltas: targetRelDeltas,
      },
    };
  }

  private triggerTargetReaction(targetId: CitizenId, actorId: CitizenId, eventSummary: string, requiresResponse: boolean = true) {
    if (!requiresResponse) return;

    setTimeout(() => {
      const targetAgent = this.getAgent(targetId);
      if (targetAgent && targetAgent.getControlMode() === 'AI') {
        // Interrupt current navigation or activity duration so citizen stops and responds
        navigationSystem.clearIntention(targetId);
        activityDurationManager.clearActivity(targetId);

        try {
          const state = simulationEngine.getState();
          const speakerPos = state.citizens[actorId]?.position;
          if (speakerPos) {
            navigationSystem.setLookAtTarget(targetId, speakerPos);
          }
        } catch {}

        const dummyPos = {
          ben: simulationEngine.getState().citizens.ben?.position || [0, 0, 0],
          julie: simulationEngine.getState().citizens.julie?.position || [0, 0, 0],
          ravi: simulationEngine.getState().citizens.ravi?.position || [0, 0, 0],
        };
        targetAgent.cognitionEngine.think(dummyPos[targetId] || [0, 0, 0], dummyPos, `Autonomous Reaction: ${eventSummary}`);
      }
    }, 300);
  }
}

export const socialInteractionSystem = SocialInteractionSystem.getInstance();
