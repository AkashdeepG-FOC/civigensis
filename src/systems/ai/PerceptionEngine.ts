import { PerceptionSnapshot, PerceivableCitizen, PerceivableObject } from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { getSemanticLocationAtPosition } from '../../types/locations';
import { worldEventBus } from '../simulation/WorldEventBus';
import { worldObjectRegistry } from './WorldObjectRegistry';
import { benAIBrain, julieAIBrain } from './CitizenAIBrain';
import { agentEventLogger } from '../logging/AgentEventLogger';

export class PerceptionEngine {
  private citizenId: CitizenId;

  constructor(citizenId: CitizenId) {
    this.citizenId = citizenId;
  }

  /**
   * Captures the citizen's strictly local perception snapshot including nearby citizens & objects
   */
  public perceive(
    currentPos: [number, number, number],
    allPositions: Record<CitizenId, [number, number, number]>
  ): PerceptionSnapshot {
    const locationName = getSemanticLocationAtPosition(currentPos);
    const worldState = worldSimulationEngine.getState();
    const selfAgent = this.citizenId === 'ben' ? benAIBrain.agent : julieAIBrain.agent;

    // 1. Filter nearby citizens within vision/hearing range (35.0 units)
    const nearbyCitizens: PerceivableCitizen[] = [];
    Object.entries(allPositions).forEach(([otherIdStr, pos]) => {
      const otherId = otherIdStr as CitizenId;
      if (otherId === this.citizenId) return;

      const dx = pos[0] - currentPos[0];
      const dy = pos[1] - currentPos[1];
      const dz = pos[2] - currentPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist <= 35.0) {
        const otherName = otherId === 'ben' ? 'Ben' : 'Julie';
        const otherLoc = getSemanticLocationAtPosition(pos);
        const rel = selfAgent.relationshipSystem.getRelationship(otherId);

        nearbyCitizens.push({
          id: otherId,
          name: otherName,
          distance: Math.round(dist * 10) / 10,
          location: otherLoc,
          apparentActivity: dist <= 5.0 ? 'in immediate proximity' : dist <= 12.0 ? 'standing nearby' : 'in the distance',
          position: pos,
          relationshipValues: {
            trust: Math.round(rel.trust),
            friendship: Math.round(rel.friendship),
            respect: Math.round(rel.respect),
            gratitude: Math.round(rel.gratitude),
            frustration: Math.round(rel.frustration),
            anger: Math.round(rel.anger || 0),
            resentment: Math.round(rel.resentment || 0),
          },
          recentInteraction: rel.lastInteractionTime !== 'Never' ? `Last topic: ${rel.lastTopic || 'general interaction'}` : 'No recent interaction',
        });
      }
    });

    // 2. Filter nearby interactable objects from WorldObjectRegistry
    const nearbyObjs = worldObjectRegistry.getObjectsNear(currentPos, 35.0);
    const perceivableObjects: PerceivableObject[] = nearbyObjs.map((obj) => {
      const dx = obj.position[0] - currentPos[0];
      const dy = obj.position[1] - currentPos[1];
      const dz = obj.position[2] - currentPos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      return {
        id: obj.id,
        name: obj.name,
        type: obj.type,
        owner: obj.owner,
        location: obj.location,
        distance: Math.round(dist * 10) / 10,
        quantity: obj.quantity,
      };
    });

    // Visible objects summary strings
    const visibleObjects: string[] = perceivableObjects.map(
      (o) => `${o.name} (owner: ${o.owner}, qty: ${o.quantity}, dist: ${o.distance}m)`
    );

    // Default landmark objects if list is short
    if (locationName === 'wheat' || locationName === 'bens_farm') {
      visibleObjects.push('wheat crops', 'irrigation channel', 'wooden fence', 'soil patch');
    } else if (locationName === 'bens_house') {
      visibleObjects.push('wooden cottage', 'bed', 'dining table', 'food stock chest');
    } else if (locationName === 'julies_bakery') {
      visibleObjects.push('bakery oven', 'bread display counter');
    } else if (locationName === 'village_center') {
      visibleObjects.push('market stalls', 'wooden benches', 'lantern posts');
    } else if (locationName === 'river') {
      visibleObjects.push('river water basin', 'pebbles', 'reeds');
    }

    // 3. Filter recent local world events
    const recentEvents = worldEventBus
      .getRecentEvents(6)
      .map((e) => `${e.type}: ${e.description}`);

    const snapshot: PerceptionSnapshot = {
      locationName,
      position: currentPos,
      visibleObjects,
      perceivableObjects,
      nearbyCitizens,
      localWeather: {
        type: worldState.weather.type,
        temperature: worldState.weather.temperature,
        rainRate: worldState.weather.rainRate,
      },
      localTime: {
        formatted: worldSimulationEngine.getFormattedTime(false),
        period: worldState.environment.period,
      },
      ambientSound: worldState.weather.rainRate > 0 ? 'Sound of falling rain' : 'Gentle ambient breeze',
      recentEvents,
    };

    agentEventLogger.logPerception({
      agentId: this.citizenId,
      location: locationName,
      position: currentPos,
      nearbyAgents: nearbyCitizens.map((c) => ({ agent_id: c.id, distance: c.distance })),
      weather: worldState.weather.type,
      temperature: worldState.weather.temperature,
      simulationTime: {
        day: worldState.time.day,
        hour: worldState.time.hour,
        minute: worldState.time.minute,
        total_minutes: worldSimulationEngine.getTotalSimulationMinutes(),
      },
    });

    return snapshot;
  }
}
