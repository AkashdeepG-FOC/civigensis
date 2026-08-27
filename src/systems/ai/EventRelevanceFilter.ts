import { CitizenId } from '../../types/citizen';
import { PlanStep } from '../../types/benAI';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';

export interface EventRelevanceResult {
  isRelevant: boolean;
  reason: string;
}

export class EventRelevanceFilter {
  /**
   * Checks whether a world event or threshold change is directly relevant to a specific citizen's current action/step.
   * Only returns isRelevant = true if the citizen's current physical step is invalidated by the event.
   */
  public static isEventRelevantToCitizen(
    citizenId: CitizenId,
    currentStep: PlanStep | null,
    eventReason: string
  ): EventRelevanceResult {
    if (!currentStep) {
      return { isRelevant: false, reason: 'No active plan step' };
    }

    const worldState = worldSimulationEngine.getState();
    const action = currentStep.action;

    // Rule 1: Rain started or crops hydrated while citizen is attempting WATER_CROP
    if (action === 'WATER_CROP') {
      if (worldState.weather.rainRate >= 0.5) {
        return {
          isRelevant: true,
          reason: `Rain started (${worldState.weather.rainRate}mm/min), rendering watering unnecessary.`,
        };
      }
      if (worldState.crops.waterLevel >= 90) {
        return {
          isRelevant: true,
          reason: `Crop hydration reached ${Math.round(worldState.crops.waterLevel)}%, rendering watering obsolete.`,
        };
      }
    }

    // Rule 2: Crop harvested or state reset while citizen is attempting HARVEST_CROP
    if (action === 'HARVEST_CROP' && !worldState.crops.isMature) {
      return {
        isRelevant: true,
        reason: 'Crop is no longer mature or was already harvested.',
      };
    }

    // Rule 3: Extreme flood event blocks river access for COLLECT_WATER
    if (action === 'COLLECT_WATER' && worldState.hazards.floodLevel > 0.8) {
      return {
        isRelevant: true,
        reason: 'Riverbank flooded and inaccessible.',
      };
    }

    // Otherwise, the world event (e.g. rain while harvesting, cloudy weather while resting) does NOT invalidate the current step.
    return {
      isRelevant: false,
      reason: `Event "${eventReason}" does not affect current action ${action}.`,
    };
  }
}
