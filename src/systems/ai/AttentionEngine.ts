import { CitizenId } from '../../types/citizen';
import { CitizenIdentity, AttentionSnapshot, AttentionItem, CitizenNeeds } from '../../types/citizenAgent';
import { eventEngine } from './EventEngine';

export class AttentionEngine {
  private static instance: AttentionEngine;

  public static getInstance(): AttentionEngine {
    if (!AttentionEngine.instance) {
      AttentionEngine.instance = new AttentionEngine();
    }
    return AttentionEngine.instance;
  }

  public computeAttention(
    identity: CitizenIdentity,
    needs: CitizenNeeds,
    activeGoalDescription?: string,
    locationName: string = 'village'
  ): AttentionSnapshot {
    const items: AttentionItem[] = [];
    const citizenId = identity.id;

    // 1. Pending Immediate Events (Danger, etc.)
    const pendingEvents = eventEngine.getPendingEvents(citizenId);
    let hasPendingSocialInteraction = false;

    for (const evt of pendingEvents) {
      items.push({
        type: 'EMERGENCY',
        priority: evt.priority,
        source: evt.source,
        message: evt.message,
        requiresResponse: evt.requiresResponse,
        details: `EVENT [${evt.type}]: ${evt.message || 'Important event occurred'} (Priority ${evt.priority})`,
      });
    }

    // 3. Urgent Needs (Hunger > 70, Energy < 25, Thirst > 70)
    if (needs.hunger > 70) {
      items.push({
        type: 'NEED',
        priority: 75,
        details: `CRITICAL NEED: High Hunger (${Math.round(needs.hunger)}%). Must seek food soon. (Priority 75)`,
      });
    }
    if (needs.energy < 25) {
      items.push({
        type: 'NEED',
        priority: 75,
        details: `CRITICAL NEED: Low Energy (${Math.round(needs.energy)}%). Must rest soon. (Priority 75)`,
      });
    }
    if (needs.thirst > 70) {
      items.push({
        type: 'NEED',
        priority: 75,
        details: `CRITICAL NEED: High Thirst (${Math.round(needs.thirst)}%). Must get water. (Priority 75)`,
      });
    }

    // 4. Current Long-Term Goal
    if (activeGoalDescription) {
      items.push({
        type: 'GOAL',
        priority: 50,
        details: `BACKGROUND GOAL: "${activeGoalDescription}". (Priority 50)`,
      });
    }

    // 5. Environmental & World Observation Baseline
    items.push({
      type: 'WORLD',
      priority: 20,
      details: `WORLD PERCEPTION: Currently at ${locationName}. (Priority 20)`,
    });

    // Sort items by priority descending
    items.sort((a, b) => b.priority - a.priority);

    const topPriority = items.length > 0 ? items[0].priority : 10;
    const primaryFocus = items.length > 0 ? items[0] : null;

    return {
      topPriority,
      primaryFocus,
      attentionList: items,
      hasPendingSocialInteraction,
    };
  }

  public formatAttentionPrompt(snapshot: AttentionSnapshot): string {
    if (snapshot.attentionList.length === 0) {
      return '- Attention: No high-priority items. Standard idle state.';
    }

    return snapshot.attentionList
      .map((item) => `- [PRIORITY ${item.priority}] ${item.details}`)
      .join('\n');
  }
}

export const attentionEngine = AttentionEngine.getInstance();
