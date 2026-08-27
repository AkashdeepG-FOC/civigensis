import { BenAction } from '../ai/IntentParser';
import { TimePeriod } from '../../types/world';

export interface ActivityDurationDef {
  action: BenAction;
  name: string;
  minSimMinutes: number;
  maxSimMinutes: number;
  isNightSensitive?: boolean;
  nightMinSimMinutes?: number;
  nightMaxSimMinutes?: number;
  description: string;
}

export const ACTIVITY_DURATION_CONFIG: Record<BenAction, ActivityDurationDef> = {
  OBSERVE: {
    action: 'OBSERVE',
    name: 'Surroundings Observation',
    minSimMinutes: 0.05, // ~3 real seconds
    maxSimMinutes: 0.1,  // ~6 real seconds
    description: 'Observing surrounding area and weather conditions',
  },
  INSPECT: {
    action: 'INSPECT',
    name: 'Site Inspection',
    minSimMinutes: 0.08, // ~5 real seconds
    maxSimMinutes: 0.15, // ~9 real seconds
    description: 'Inspecting crop fields, structures, or village market locations',
  },
  TALK: {
    action: 'TALK',
    name: 'Social Interaction',
    minSimMinutes: 0.05,
    maxSimMinutes: 0.1,
    description: 'Brief interaction with nearby citizen',
  },
  RESPOND_TO_CITIZEN: {
    action: 'RESPOND_TO_CITIZEN',
    name: 'Respond to Citizen',
    minSimMinutes: 0.05,
    maxSimMinutes: 0.1,
    description: 'Acknowledging nearby citizen',
  },
  TALK_TO: {
    action: 'TALK_TO',
    name: 'Approach Citizen',
    minSimMinutes: 0.05,
    maxSimMinutes: 0.1,
    description: 'Approaching nearby citizen',
  },
  ASK: {
    action: 'ASK',
    name: 'Inquire',
    minSimMinutes: 0.05,
    maxSimMinutes: 0.1,
    description: 'Inquiring about area',
  },
  HELP: {
    action: 'HELP',
    name: 'Assisting Work',
    minSimMinutes: 0.1,  // ~6 real seconds
    maxSimMinutes: 0.2,  // ~12 real seconds
    description: 'Helping a fellow citizen with farm work or tasks',
  },
  EXPLORE: {
    action: 'EXPLORE',
    name: 'Area Exploration',
    minSimMinutes: 0.1,  // ~6 real seconds
    maxSimMinutes: 0.25, // ~15 real seconds
    description: 'Exploring surrounding territory or village market',
  },
  WAIT: {
    action: 'WAIT',
    name: 'Pause & Wait',
    minSimMinutes: 0.05, // ~3 real seconds
    maxSimMinutes: 0.1,  // ~6 real seconds
    description: 'Waiting briefly to observe environmental changes',
  },
  EAT: {
    action: 'EAT',
    name: 'Dining & Nourishment',
    minSimMinutes: 0.15, // ~9 real seconds
    maxSimMinutes: 0.25, // ~15 real seconds
    description: 'Consuming food to reduce hunger and restore stamina',
  },
  REST: {
    action: 'REST',
    name: 'Rest / Sleep',
    minSimMinutes: 0.2,  // ~12 real seconds daytime rest
    maxSimMinutes: 0.4,  // ~24 real seconds daytime rest
    isNightSensitive: true,
    nightMinSimMinutes: 360, // 6 sim hours for night sleep
    nightMaxSimMinutes: 420, // 7 sim hours for night sleep
    description: 'Daytime rest or Nighttime sleep',
  },
  COLLECT_WATER: {
    action: 'COLLECT_WATER',
    name: 'River Water Collection',
    minSimMinutes: 0.1,  // ~6 real seconds
    maxSimMinutes: 0.2,  // ~12 real seconds
    description: 'Filling water buckets at the river basin',
  },
  WATER_CROP: {
    action: 'WATER_CROP',
    name: 'Crop Irrigation',
    minSimMinutes: 0.1,  // ~6 real seconds
    maxSimMinutes: 0.2,  // ~12 real seconds
    description: 'Irrigating wheat crops with carried water buckets',
  },
  HARVEST_CROP: {
    action: 'HARVEST_CROP',
    name: 'Wheat Harvesting',
    minSimMinutes: 0.15, // ~9 real seconds
    maxSimMinutes: 0.3,  // ~18 real seconds
    description: 'Reaping mature wheat crops at the farm',
  },
  REPAIR: {
    action: 'REPAIR',
    name: 'Structure Repair',
    minSimMinutes: 0.15, // ~9 real seconds
    maxSimMinutes: 0.3,  // ~18 real seconds
    description: 'Repairing wooden fence or tools',
  },
  GO_TO: {
    action: 'GO_TO',
    name: 'Locomotion / Walking',
    minSimMinutes: 0,
    maxSimMinutes: 0,
    description: 'Travel duration determined by distance and walking speed',
  },
};

/**
 * Calculates a realistic duration in simulation minutes for a given action and time period.
 * Generated EXACTLY ONCE at activity start.
 */
import { worldSimulationEngine } from './WorldSimulationEngine';

export function calculateActivityDuration(
  action: BenAction,
  period: TimePeriod,
  hour: number
): number {
  const config = ACTIVITY_DURATION_CONFIG[action];
  if (!config) return 0.08; // Default fallback: ~5 real seconds

  if (action === 'GO_TO') return 0; // Locomotion duration is handled by NavigationSystem physics

  // Check if action is REST during nighttime (night sleep)
  const isNight = period === 'NIGHT' || period === 'TWILIGHT' || hour >= 21 || hour < 5;

  if (action === 'REST' && isNight) {
    try {
      const state = worldSimulationEngine.getState();
      // If running on real-time clock or 1x scale, cap night sleep to ~20-35 real seconds (0.35 - 0.6 sim mins)
      if (state.useRealTimeClock || state.timeScale <= 1) {
        return 0.35 + Math.random() * 0.25;
      }
    } catch {
      return 0.35 + Math.random() * 0.25;
    }
    const min = config.nightMinSimMinutes || 360;
    const max = config.nightMaxSimMinutes || 420;
    return min + Math.random() * (max - min);
  }

  const min = config.minSimMinutes;
  const max = config.maxSimMinutes;
  return min + Math.random() * (max - min);
}
