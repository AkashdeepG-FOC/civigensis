import { CitizenId } from '../../types/citizen';
import { ToolResult } from '../../types/citizenAgent';
import { benAIBrain, julieAIBrain } from './CitizenAIBrain';
import { farmingWorldState } from './FarmingWorldState';
import { simulationEngine } from '../simulation/SimulationEngine';
import { worldEventBus } from '../simulation/WorldEventBus';
import { CITIZEN_INTERACTION_RANGE, PHYSICAL_INTIMATE_RANGE } from './InteractionConstants';

export class ConflictSystem {
  private static instance: ConflictSystem;

  public static getInstance(): ConflictSystem {
    if (!ConflictSystem.instance) {
      ConflictSystem.instance = new ConflictSystem();
    }
    return ConflictSystem.instance;
  }

  private getAgent(id: CitizenId) {
    return id === 'ben' ? benAIBrain.agent : julieAIBrain.agent;
  }

  private getTargetId(actorId: CitizenId, args: Record<string, any>): CitizenId {
    const rawTarget = args?.target || args?.opponent || (actorId === 'ben' ? 'julie' : 'ben');
    return String(rawTarget).toLowerCase().includes('julie') ? 'julie' : 'ben';
  }

  private getDistance(posA: [number, number, number], posB: [number, number, number]): number {
    const dx = posA[0] - posB[0];
    const dy = posA[1] - posB[1];
    const dz = posA[2] - posB[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public validateConflict(
    actorId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): { valid: boolean; reason: string } {
    const actLower = action.toLowerCase();
    if (actLower === 'flee') {
      return { valid: true, reason: 'Can attempt to flee at any time.' };
    }

    const targetId = this.getTargetId(actorId, args);
    if (targetId === actorId) {
      return { valid: false, reason: 'Cannot engage in conflict with yourself.' };
    }

    let targetPos: [number, number, number] = [0, 0, 0];
    try {
      targetPos = simulationEngine.getState().citizens[targetId].position;
    } catch {
      return { valid: false, reason: `Target citizen ${targetId} position not found.` };
    }

    const dist = this.getDistance(currentPos, targetPos);
    const maxDist = actLower === 'fight' ? PHYSICAL_INTIMATE_RANGE : CITIZEN_INTERACTION_RANGE;

    if (dist > maxDist) {
      const targetName = targetId === 'ben' ? 'Ben' : 'Julie';
      return {
        valid: false,
        reason: `${targetName} is out of conflict range (${dist.toFixed(1)}m away, max ${maxDist}m).`,
      };
    }

    return { valid: true, reason: 'Conflict target valid and in physical range.' };
  }

  public executeConflict(
    actorId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): ToolResult {
    const actLower = action.toLowerCase();
    const targetId = this.getTargetId(actorId, args);
    const actorAgent = this.getAgent(actorId);
    const targetAgent = this.getAgent(targetId);

    const actorName = actorAgent.identity.name;
    const targetName = targetAgent.identity.name;

    const location = actorAgent.perceptionEngine.perceive(currentPos, {
      ben: simulationEngine.getState().citizens.ben.position,
      julie: simulationEngine.getState().citizens.julie.position,
      ravi: simulationEngine.getState().citizens.ravi.position,
    }).locationName;

    let eventType = 'CITIZEN_CONFLICT';
    let summaryText = '';
    let actorMemText = '';
    let targetMemText = '';

    const targetRelDeltas: Record<string, number> = {};
    const actorRelDeltas: Record<string, number> = {};

    switch (actLower) {
      case 'confront': {
        eventType = 'CITIZEN_CONFRONTED';
        const issue = args.reason || args.issue || 'recent actions';
        summaryText = `${actorName} confronted ${targetName} regarding ${issue}`;
        actorMemText = `I confronted ${targetName} regarding ${issue}`;
        targetMemText = `${actorName} confronted me regarding ${issue}`;
        targetRelDeltas.frustration = 20;
        targetRelDeltas.anger = 15;
        targetRelDeltas.trust = -10;
        break;
      }
      case 'argue': {
        eventType = 'CITIZEN_ARGUED';
        const topic = args.topic || 'disagreement';
        summaryText = `${actorName} got into a heated argument with ${targetName}`;
        actorMemText = `I argued with ${targetName} about ${topic}`;
        targetMemText = `${actorName} argued heatedly with me`;
        actorRelDeltas.frustration = 25;
        actorRelDeltas.anger = 20;
        targetRelDeltas.frustration = 30;
        targetRelDeltas.anger = 25;
        targetRelDeltas.friendship = -15;
        break;
      }
      case 'fight': {
        eventType = 'FIGHT_STARTED';
        summaryText = `A physical fight broke out between ${actorName} and ${targetName}!`;
        actorMemText = `I got into a physical fight with ${targetName}`;
        targetMemText = `${actorName} attacked me in a physical fight!`;

        // Physical impact on energy and needs
        const actorNeeds = farmingWorldState.getNeeds(actorId);
        const targetNeeds = farmingWorldState.getNeeds(targetId);
        actorNeeds.energy = Math.max(0, actorNeeds.energy - 20);
        targetNeeds.energy = Math.max(0, targetNeeds.energy - 25);

        targetRelDeltas.trust = -45;
        targetRelDeltas.friendship = -35;
        targetRelDeltas.anger = 50;
        targetRelDeltas.fear = 35;
        targetRelDeltas.resentment = 40;

        actorRelDeltas.anger = 30;
        actorRelDeltas.frustration = 25;
        break;
      }
      case 'threaten': {
        eventType = 'CITIZEN_THREATENED';
        summaryText = `${actorName} threatened ${targetName}`;
        actorMemText = `I threatened ${targetName}`;
        targetMemText = `${actorName} threatened me`;

        targetRelDeltas.fear = 45;
        targetRelDeltas.anger = 30;
        targetRelDeltas.trust = -30;
        targetRelDeltas.friendship = -25;
        break;
      }
      case 'defend': {
        eventType = 'CITIZEN_DEFENDED';
        summaryText = `${actorName} stood ground and defended against ${targetName}`;
        actorMemText = `I defended myself against ${targetName}`;
        targetMemText = `${actorName} defended against my actions`;

        actorRelDeltas.respect = 10;
        targetRelDeltas.respect = 10;
        targetRelDeltas.anger = -10;
        break;
      }
      case 'flee': {
        eventType = 'CITIZEN_FLED';
        summaryText = `${actorName} panicked and fled from the scene!`;
        actorMemText = `I fled in fear from ${targetName}`;
        targetMemText = `${actorName} fled away from me`;

        actorRelDeltas.fear = 20;
        break;
      }
    }

    // 1. Emit Event
    worldEventBus.emit(eventType, summaryText, { actorId, targetId, action: actLower, location });

    // 2. Modify Relationships
    actorAgent.relationshipSystem.modifyRelationship(targetId, actorRelDeltas, actLower);
    targetAgent.relationshipSystem.modifyRelationship(actorId, targetRelDeltas, actLower);

    // 3. Store Perspective-Aware Memories
    actorAgent.memorySystem.addEpisodicMemory(actorMemText, location, -0.4);
    targetAgent.memorySystem.addEpisodicMemory(targetMemText, location, -0.6);

    // 4. Trigger Target Reaction
    this.triggerTargetReaction(targetId, summaryText);

    return {
      success: true,
      reason: summaryText,
      memoryDescription: actorMemText,
      eventType,
      targetId,
      consequences: {
        actorDeltas: actorRelDeltas,
        targetDeltas: targetRelDeltas,
      },
    };
  }

  private triggerTargetReaction(targetId: CitizenId, eventSummary: string) {
    setTimeout(() => {
      const targetAgent = this.getAgent(targetId);
      if (targetAgent.getControlMode() === 'AI' && !targetAgent.cognitionEngine.getIsThinking()) {
        const dummyPos = {
          ben: simulationEngine.getState().citizens.ben.position,
          julie: simulationEngine.getState().citizens.julie.position,
          ravi: simulationEngine.getState().citizens.ravi.position,
        };
        targetAgent.cognitionEngine.think(dummyPos[targetId], dummyPos, `Autonomous Reaction: ${eventSummary}`);
      }
    }, 400);
  }
}

export const conflictSystem = ConflictSystem.getInstance();
