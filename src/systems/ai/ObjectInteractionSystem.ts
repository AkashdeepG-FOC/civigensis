import { CitizenId } from '../../types/citizen';
import { ToolResult, WorldObjectState } from '../../types/citizenAgent';
import { worldObjectRegistry } from './WorldObjectRegistry';
import { benAIBrain, julieAIBrain } from './CitizenAIBrain';
import { farmingWorldState } from './FarmingWorldState';
import { simulationEngine } from '../simulation/SimulationEngine';
import { worldEventBus } from '../simulation/WorldEventBus';
import { CITIZEN_INTERACTION_RANGE } from './InteractionConstants';

export class ObjectInteractionSystem {
  private static instance: ObjectInteractionSystem;

  public static getInstance(): ObjectInteractionSystem {
    if (!ObjectInteractionSystem.instance) {
      ObjectInteractionSystem.instance = new ObjectInteractionSystem();
    }
    return ObjectInteractionSystem.instance;
  }

  private getAgent(id: CitizenId) {
    return id === 'ben' ? benAIBrain.agent : julieAIBrain.agent;
  }

  private getTargetCitizenId(actorId: CitizenId, args: Record<string, any>): CitizenId {
    const rawTarget = args?.target || args?.victim || args?.recipient || (actorId === 'ben' ? 'julie' : 'ben');
    return String(rawTarget).toLowerCase().includes('julie') ? 'julie' : 'ben';
  }

  private getDistance(posA: [number, number, number], posB: [number, number, number]): number {
    const dx = posA[0] - posB[0];
    const dy = posA[1] - posB[1];
    const dz = posA[2] - posB[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  public validateObjectInteraction(
    actorId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): { valid: boolean; reason: string } {
    const actLower = action.toLowerCase();
    const targetCitizenId = this.getTargetCitizenId(actorId, args);
    const itemQuery = args?.item || args?.object || args?.target || 'bread';

    if (actLower === 'steal') {
      if (targetCitizenId === actorId) {
        return { valid: false, reason: 'Cannot steal from yourself.' };
      }

      let targetPos: [number, number, number] = [0, 0, 0];
      try {
        targetPos = simulationEngine.getState().citizens[targetCitizenId].position;
      } catch {
        return { valid: false, reason: `Target citizen ${targetCitizenId} position not found.` };
      }

      const distToCitizen = this.getDistance(currentPos, targetPos);
      const targetObjects = worldObjectRegistry.getObjectsByOwner(targetCitizenId);
      const obj = worldObjectRegistry.getObject(String(itemQuery)) || targetObjects[0];

      // Item check or target foodStock check
      const targetNeeds = farmingWorldState.getNeeds(targetCitizenId);
      if (!obj && targetNeeds.foodStock <= 0 && targetNeeds.harvestedWheat <= 0) {
        worldEventBus.emit('ITEM_STEAL_FAILED', `${actorId} attempted to steal from ${targetCitizenId}, but target has no items or food stock.`, {
          actorId,
          targetId: targetCitizenId,
          reason: 'No food stock or items available',
        });
        return { valid: false, reason: `${targetCitizenId} has no items or food stock to steal.` };
      }

      let itemPos: [number, number, number] = targetPos;
      if (obj) itemPos = obj.position;
      const distToItem = Math.min(distToCitizen, this.getDistance(currentPos, itemPos));

      if (distToItem > CITIZEN_INTERACTION_RANGE) {
        const targetName = targetCitizenId === 'ben' ? 'Ben' : 'Julie';
        worldEventBus.emit('ITEM_STEAL_FAILED', `${actorId} attempted to steal from ${targetName}, but was out of range.`, {
          actorId,
          targetId: targetCitizenId,
          reason: 'Out of physical range',
        });
        return { valid: false, reason: `Too far from ${targetName}'s items to steal (${distToItem.toFixed(1)}m away).` };
      }

      return { valid: true, reason: 'Valid theft conditions met.' };
    }

    if (actLower === 'give') {
      const actorNeeds = farmingWorldState.getNeeds(actorId);
      const actorObjects = worldObjectRegistry.getObjectsByOwner(actorId);
      if (actorNeeds.foodStock <= 0 && actorNeeds.harvestedWheat <= 0 && actorObjects.length === 0) {
        return { valid: false, reason: 'You have no items or food stock in your inventory to give.' };
      }

      let targetPos: [number, number, number] = [0, 0, 0];
      try {
        targetPos = simulationEngine.getState().citizens[targetCitizenId].position;
      } catch {
        return { valid: false, reason: `Recipient citizen ${targetCitizenId} not found.` };
      }

      const dist = this.getDistance(currentPos, targetPos);
      if (dist > CITIZEN_INTERACTION_RANGE) {
        return { valid: false, reason: `Recipient ${targetCitizenId} is out of range (${dist.toFixed(1)}m away).` };
      }

      return { valid: true, reason: 'Valid gift conditions.' };
    }

    return { valid: true, reason: 'Object interaction valid.' };
  }

  public executeObjectInteraction(
    actorId: CitizenId,
    action: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): ToolResult {
    const actLower = action.toLowerCase();
    const targetCitizenId = this.getTargetCitizenId(actorId, args);
    const actorAgent = this.getAgent(actorId);
    const targetAgent = this.getAgent(targetCitizenId);

    const actorName = actorAgent.identity.name;
    const targetName = targetAgent.identity.name;
    const itemQuery = args?.item || args?.object || args?.target || 'bread';

    const location = actorAgent.perceptionEngine.perceive(currentPos, {
      ben: simulationEngine.getState().citizens.ben.position,
      julie: simulationEngine.getState().citizens.julie.position,
      ravi: simulationEngine.getState().citizens.ravi.position,
    }).locationName;

    // 1. STEAL Execution
    if (actLower === 'steal') {
      let stolenItemName = 'bread';
      const obj = worldObjectRegistry.getObject(String(itemQuery));

      if (obj) {
        stolenItemName = obj.name;
        worldObjectRegistry.transferOwnership(obj.id, actorId, `${actorId}_inventory`);
      } else {
        // Fallback to farming world stock transfer
        const targetNeeds = farmingWorldState.getNeeds(targetCitizenId);
        if (targetNeeds.foodStock > 0) {
          targetNeeds.foodStock -= 1;
          farmingWorldState.getNeeds(actorId).foodStock += 1;
          stolenItemName = 'fresh bread';
        } else if (targetNeeds.harvestedWheat > 0) {
          targetNeeds.harvestedWheat -= 1;
          farmingWorldState.getNeeds(actorId).harvestedWheat += 1;
          stolenItemName = 'wheat bundle';
        }
      }

      const summaryText = `${actorName} stole ${stolenItemName} from ${targetName}!`;
      const actorMem = `I stole ${stolenItemName} from ${targetName}.`;
      const targetMem = `${actorName} stole my ${stolenItemName}!`;

      // Emit Event
      worldEventBus.emit('ITEM_STOLEN', summaryText, {
        actorId,
        targetId: targetCitizenId,
        item: stolenItemName,
        location,
      });

      // Relationship Impact
      targetAgent.relationshipSystem.modifyRelationship(actorId, {
        trust: -35,
        friendship: -25,
        anger: 40,
        resentment: 35,
        respect: -20,
      }, 'item_stolen');

      // Perspective Memories
      actorAgent.memorySystem.addEpisodicMemory(actorMem, location, -0.2);
      targetAgent.memorySystem.addEpisodicMemory(targetMem, location, -0.8);

      // Trigger Target Reaction
      this.triggerTargetReaction(targetCitizenId, `${actorName} stole your ${stolenItemName}!`);

      return {
        success: true,
        reason: summaryText,
        memoryDescription: actorMem,
        eventType: 'ITEM_STOLEN',
        targetId: targetCitizenId,
        consequences: { stolenItem: stolenItemName },
      };
    }

    // 2. GIVE Execution
    if (actLower === 'give') {
      let givenItemName = 'bread';
      const actorObjects = worldObjectRegistry.getObjectsByOwner(actorId);
      const obj = worldObjectRegistry.getObject(String(itemQuery)) || actorObjects[0];

      if (obj) {
        givenItemName = obj.name;
        worldObjectRegistry.transferOwnership(obj.id, targetCitizenId, `${targetCitizenId}_inventory`);
      } else {
        const actorNeeds = farmingWorldState.getNeeds(actorId);
        if (actorNeeds.foodStock > 0) {
          actorNeeds.foodStock -= 1;
          farmingWorldState.getNeeds(targetCitizenId).foodStock += 1;
          givenItemName = 'fresh bread';
        }
      }

      const summaryText = `${actorName} gave ${givenItemName} to ${targetName}.`;
      const actorMem = `I gave ${givenItemName} to ${targetName}.`;
      const targetMem = `${actorName} gave me ${givenItemName}.`;

      worldEventBus.emit('ITEM_GIVEN', summaryText, {
        actorId,
        targetId: targetCitizenId,
        item: givenItemName,
        location,
      });

      targetAgent.relationshipSystem.modifyRelationship(actorId, {
        gratitude: 25,
        trust: 15,
        friendship: 15,
        anger: -15,
        resentment: -15,
      }, 'item_given');

      actorAgent.memorySystem.addEpisodicMemory(actorMem, location, 0.4);
      targetAgent.memorySystem.addEpisodicMemory(targetMem, location, 0.6);

      this.triggerTargetReaction(targetCitizenId, `${actorName} gave you ${givenItemName}.`);

      return {
        success: true,
        reason: summaryText,
        memoryDescription: actorMem,
        eventType: 'ITEM_GIVEN',
        targetId: targetCitizenId,
      };
    }

    // 3. TAKE / PICK UP / DROP / USE / OPEN / CLOSE
    let eventType = `ITEM_${actLower.toUpperCase()}`;
    let summary = `${actorName} performed ${action} on ${itemQuery}`;
    let memDesc = `I performed ${action} on ${itemQuery}`;

    if (actLower === 'pick_up' || actLower === 'take') {
      const obj = worldObjectRegistry.getObject(String(itemQuery));
      if (obj) {
        worldObjectRegistry.transferOwnership(obj.id, actorId, `${actorId}_inventory`);
        summary = `${actorName} picked up ${obj.name}`;
        memDesc = `I picked up ${obj.name}`;
      }
    } else if (actLower === 'drop') {
      const obj = worldObjectRegistry.getObject(String(itemQuery));
      if (obj) {
        worldObjectRegistry.transferOwnership(obj.id, 'environment', location);
        summary = `${actorName} dropped ${obj.name} at ${location}`;
        memDesc = `I dropped ${obj.name} at ${location}`;
      }
    } else if (actLower === 'use') {
      // Eat or use food item
      const eatRes = farmingWorldState.eatFood(actorId);
      summary = eatRes.success ? `${actorName} consumed food to satisfy hunger.` : `${actorName} tried to use ${itemQuery}.`;
      memDesc = summary;
    }

    worldEventBus.emit(eventType, summary, { actorId, action: actLower, location });
    actorAgent.memorySystem.addEpisodicMemory(memDesc, location, 0.1);

    return {
      success: true,
      reason: summary,
      memoryDescription: memDesc,
      eventType,
    };
  }

  private triggerTargetReaction(targetId: CitizenId, eventSummary: string) {
    setTimeout(() => {
      const targetAgent = this.getAgent(targetId);
      if (targetAgent.getControlMode() === 'AI' && !targetAgent.cognitionEngine.getIsBusy()) {
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

export const objectInteractionSystem = ObjectInteractionSystem.getInstance();
