import { MultiStepPlan, PlanStep } from '../../types/benAI';
import { CitizenId } from '../../types/citizen';
import { farmingWorldState } from './FarmingWorldState';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { PlanManager } from './PlanManager';

export interface EventCheckResult {
  isValid: boolean;
  eventReason?: string;
  invalidatedAction?: string;
}

export class PlanEventMonitor {
  /**
   * Evaluates whether an active plan is impacted by environmental events or physical reality checks.
   * Invalidates ONLY specific affected pending steps without clearing completed progress!
   */
  public static validatePlan(
    planManager: PlanManager,
    citizenId: CitizenId = 'ben'
  ): EventCheckResult {
    const plan = planManager.getCurrentPlan();
    const currentStep = planManager.getCurrentStep();

    if (!plan || plan.status !== 'ACTIVE' || !currentStep) {
      return { isValid: false, eventReason: 'No active plan or step available' };
    }

    const needs = farmingWorldState.getNeeds(citizenId);
    const worldState = worldSimulationEngine.getState();
    const crop = worldState.crops;
    const hydro = worldState.hydro;
    const hazards = worldState.hazards;
    const weather = worldState.weather;

    const pendingSteps = planManager.getPendingSteps();

    // 1. URGENT NEED MONITORING: High Hunger (>= 65) when plan has no EAT step
    if (needs.hunger >= 65) {
      const planHasEat = pendingSteps.some((s) => s.action === 'EAT');
      if (!planHasEat && needs.foodStock > 0) {
        return {
          isValid: false,
          eventReason: `Urgent event: Starvation threat (Hunger ${Math.round(needs.hunger)}%). Replanning to eat food.`,
        };
      }
    }

    // 2. URGENT NEED MONITORING: Exhaustion (Energy < 25) when plan has no REST step
    if (needs.energy < 25) {
      const planHasRest = pendingSteps.some((s) => s.action === 'REST');
      if (!planHasRest) {
        return {
          isValid: false,
          eventReason: `Urgent event: Critical exhaustion (Energy ${Math.round(needs.energy)}%). Replanning to rest.`,
        };
      }
    }

    // 3. THRESHOLD EVENT INTERACTION: Meaningful Rain (RAIN_STARTED) vs. WATER_CROP
    if (weather.rainRate >= 0.5) {
      const hasWatering = pendingSteps.some((s) => s.action === 'WATER_CROP');
      if (hasWatering) {
        // Invalidate ONLY WATER_CROP pending steps while keeping COMPLETED steps intact!
        planManager.invalidateStepByAction('WATER_CROP', 'Meaningful rainfall active (RAIN_STARTED); manual watering unnecessary');
        console.log(`[AI][INTENTION_INVALIDATED] Event RAIN_STARTED (Rain rate ${weather.rainRate}mm/min) invalidated WATER_CROP intention.`);
        return {
          isValid: false,
          eventReason: 'Event RAIN_STARTED invalidated manual watering intention',
          invalidatedAction: 'WATER_CROP',
        };
      }
    }

    // 4. THRESHOLD EVENT INTERACTION: Crop Hydration Low (CROP_HYDRATION_LOW)
    if (crop.waterLevel <= 30) {
      const hasWatering = pendingSteps.some((s) => s.action === 'WATER_CROP');
      // ANTI-INTERRUPTION RULE: If WATER_CROP is already scheduled in pending steps, DO NOT REPLAN!
      if (!hasWatering && needs.waterBucket > 0) {
        return {
          isValid: false,
          eventReason: `Threshold event: Crop hydration dropped to ${Math.round(crop.waterLevel)}% (CROP_HYDRATION_LOW); replanning to irrigate.`,
        };
      }
    }

    // 5. THRESHOLD EVENT INTERACTION: Flood Road Inundation (ROAD_BLOCKED_BY_FLOOD)
    if (hazards.floodLevel >= 0.8) {
      const touchesRiver = pendingSteps.some((s) => s.target === 'river' || s.action === 'COLLECT_WATER');
      if (touchesRiver) {
        planManager.invalidateStepByAction('COLLECT_WATER', 'Road to river blocked by flood inundation (Flood level >= 0.8m)');
        return {
          isValid: false,
          eventReason: 'Threshold event: Road to river is blocked by flood inundation (Flood level >= 0.8m).',
        };
      }
    }

    // 6. THRESHOLD EVENT INTERACTION: River Water Unavailable (RIVER_WATER_UNAVAILABLE)
    if (!hydro.riverWaterAvailable) {
      const triesCollectWater = pendingSteps.some((s) => s.action === 'COLLECT_WATER' || s.target === 'river');
      if (triesCollectWater) {
        planManager.invalidateStepByAction('COLLECT_WATER', 'River water unavailable for collection');
        return {
          isValid: false,
          eventReason: 'Threshold event: River water is currently unavailable for collection.',
        };
      }
    }

    // 7. CURRENT ACTIVE STEP PRECONDITION VALIDATION
    const action = currentStep.action;

    // Collect water precondition check
    if (action === 'COLLECT_WATER') {
      if (!hydro.riverWaterAvailable) {
        planManager.invalidateStepByAction('COLLECT_WATER', 'River water unavailable');
        return { isValid: true };
      }
      if (needs.waterBucket >= 5) {
        planManager.invalidateStepByAction('COLLECT_WATER', 'Water buckets already at max capacity (5/5)');
        return { isValid: true };
      }
    }

    // Water crop precondition check
    if (action === 'WATER_CROP') {
      if (needs.waterBucket <= 0) {
        planManager.invalidateStepByAction('WATER_CROP', 'Ben has no water buckets');
        return { isValid: true };
      }
      if (crop.waterLevel >= 95 || weather.rainRate >= 0.5) {
        planManager.invalidateStepByAction('WATER_CROP', 'Crop already hydrated or natural rain active');
        return { isValid: true };
      }
    }

    // Harvest crop precondition check
    if (action === 'HARVEST_CROP') {
      if (!crop.isMature) {
        planManager.invalidateStepByAction('HARVEST_CROP', 'Crop not mature yet');
        return { isValid: true };
      }
    }

    // Eat precondition check
    if (action === 'EAT') {
      if (needs.hunger < 30 || needs.foodStock <= 0) {
        planManager.invalidateStepByAction('EAT', 'Hunger < 30 or foodStock <= 0');
        return { isValid: true };
      }
    }

    return { isValid: true };
  }
}
