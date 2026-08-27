import { RelationshipState } from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';
import { agentEventLogger } from '../logging/AgentEventLogger';

export class RelationshipSystem {
  private selfId: CitizenId;
  private relationships: Map<CitizenId, RelationshipState> = new Map();

  constructor(selfId: CitizenId) {
    this.selfId = selfId;
    const otherId: CitizenId = selfId === 'ben' ? 'julie' : 'ben';
    this.relationships.set(otherId, {
      targetCitizenId: otherId,
      trust: 50,
      friendship: 50,
      respect: 50,
      familiarity: 60,
      gratitude: 40,
      frustration: 10,
      anger: 0,
      resentment: 0,
      fear: 0,
      romance: 10,
      lastInteractionTime: 'Never',
    });
  }

  public getRelationship(targetCitizenId: CitizenId): RelationshipState {
    let rel = this.relationships.get(targetCitizenId);
    if (!rel) {
      rel = {
        targetCitizenId,
        trust: 50,
        friendship: 50,
        respect: 50,
        familiarity: 10,
        gratitude: 0,
        frustration: 0,
        anger: 0,
        resentment: 0,
        fear: 0,
        romance: 0,
        lastInteractionTime: 'Never',
      };
      this.relationships.set(targetCitizenId, rel);
    }
    return rel;
  }

  public modifyRelationship(
    targetCitizenId: CitizenId,
    deltas: Partial<Omit<RelationshipState, 'targetCitizenId' | 'lastInteractionTime' | 'lastTopic'>>,
    topic?: string
  ) {
    const rel = this.getRelationship(targetCitizenId);
    const previousValues = { ...rel };
    const clamp = (val: number) => Math.max(0, Math.min(100, val));

    if (deltas.trust !== undefined) rel.trust = clamp(rel.trust + deltas.trust);
    if (deltas.friendship !== undefined) rel.friendship = clamp(rel.friendship + deltas.friendship);
    if (deltas.respect !== undefined) rel.respect = clamp(rel.respect + deltas.respect);
    if (deltas.familiarity !== undefined) rel.familiarity = clamp(rel.familiarity + deltas.familiarity);
    if (deltas.gratitude !== undefined) rel.gratitude = clamp(rel.gratitude + deltas.gratitude);
    if (deltas.frustration !== undefined) rel.frustration = clamp(rel.frustration + deltas.frustration);
    if (deltas.anger !== undefined) rel.anger = clamp((rel.anger || 0) + deltas.anger);
    if (deltas.resentment !== undefined) rel.resentment = clamp((rel.resentment || 0) + deltas.resentment);
    if (deltas.fear !== undefined) rel.fear = clamp((rel.fear || 0) + deltas.fear);
    if (deltas.romance !== undefined) rel.romance = clamp((rel.romance || 0) + deltas.romance);

    rel.lastInteractionTime = new Date().toLocaleTimeString('en-US', { hour12: false });
    if (topic) rel.lastTopic = topic;

    agentEventLogger.logRelationshipUpdate({
      agentId: this.selfId,
      targetAgent: targetCitizenId,
      previousValues,
      newValues: { ...rel },
      reason: topic ? `Topic: ${topic}` : 'Relationship modification',
    });
  }

  public getRelationshipPromptSummary(targetCitizenId: CitizenId): string {
    const rel = this.getRelationship(targetCitizenId);
    const targetName = targetCitizenId === 'ben' ? 'Ben' : 'Julie';
    return `Relationship with ${targetName}: Trust ${Math.round(rel.trust)}/100, Friendship ${Math.round(rel.friendship)}/100, Respect ${Math.round(rel.respect)}/100, Gratitude ${Math.round(rel.gratitude)}/100, Frustration ${Math.round(rel.frustration)}/100, Anger ${Math.round(rel.anger || 0)}/100, Resentment ${Math.round(rel.resentment || 0)}/100, Fear ${Math.round(rel.fear || 0)}/100, Romance ${Math.round(rel.romance || 0)}/100. Last interaction: ${rel.lastInteractionTime}${rel.lastTopic ? ` (${rel.lastTopic})` : ''}.`;
  }
}
