import { CitizenId, NearbyCitizen } from '../../types/citizen';
import { getSemanticLocationAtPosition } from '../../types/locations';
import { navigationSystem } from './NavigationSystem';
import { activityDurationManager } from '../simulation/ActivityDurationManager';

export class SocialPerceptionSystem {
  /**
   * Calculates nearby perceived citizens for a given citizen ID.
   * Updates continuously without auto-triggering LLM calls or forced dialogue.
   */
  public static getNearbyCitizens(
    observerId: CitizenId,
    allPositions: Record<CitizenId, [number, number, number]>,
    perceptionRadius: number = 35.0
  ): NearbyCitizen[] {
    const observerPos = allPositions[observerId];
    if (!observerPos) return [];

    const result: NearbyCitizen[] = [];

    for (const [id, pos] of Object.entries(allPositions)) {
      if (id === observerId) continue;
      const citizenId = id as CitizenId;

      const dx = pos[0] - observerPos[0];
      const dz = pos[2] - observerPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= perceptionRadius) {
        const locationName = getSemanticLocationAtPosition(pos);
        const activeActivity = activityDurationManager.getActiveActivity(citizenId);
        const currentIntention = navigationSystem.getCurrentIntention(citizenId);

        let activityStr = activeActivity ? activeActivity.action : 'IDLE / WALKING';
        if (currentIntention?.intent) {
          activityStr = `${activityStr} (${currentIntention.intent})`;
        }

        result.push({
          id: citizenId,
          name: citizenId === 'ben' ? 'Ben' : 'Julie',
          distance: Math.round(dist * 10) / 10,
          location: locationName,
          activity: activityStr,
          intention: currentIntention?.intent,
          position: [...pos],
        });
      }
    }

    return result;
  }
}
