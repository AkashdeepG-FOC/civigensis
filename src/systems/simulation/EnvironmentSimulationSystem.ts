import { WorldState, WorldEvent } from '../../types/world';
import { IEnvironmentRule } from './rules/EnvironmentRule';
import {
  TimeRule,
  SunlightRule,
  WeatherRule,
  RainRule,
  TemperatureRule,
  HumidityRule,
  WindRule,
  EvaporationRule,
  WaterCycleRule,
  RiverRule,
  SoilRule,
  CropRule,
  PlantRule,
  FloodRule,
  DroughtRule,
  FireRule,
  CitizenEffectsRule,
  NavigationEffectsRule,
} from './rules/AllRules';
import { environmentThresholdManager } from './EnvironmentThresholdManager';

export type EnvironmentEventListener = (event: WorldEvent) => void;

export class EnvironmentSimulationSystem {
  private rules: IEnvironmentRule[] = [];
  private eventListeners: Set<EnvironmentEventListener> = new Set();

  constructor() {
    this.rules = [
      new TimeRule(),
      new SunlightRule(),
      new WeatherRule(),
      new RainRule(),
      new TemperatureRule(),
      new HumidityRule(),
      new WindRule(),
      new EvaporationRule(),
      new WaterCycleRule(),
      new RiverRule(),
      new SoilRule(),
      new CropRule(),
      new PlantRule(),
      new FloodRule(),
      new DroughtRule(),
      new FireRule(),
      new CitizenEffectsRule(),
      new NavigationEffectsRule(),
    ].sort((a, b) => a.priority - b.priority);
  }

  public subscribeEvent(listener: EnvironmentEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Primary entry point called by WorldSimulationEngine every R3F tick
   */
  public update(state: WorldState, simDeltaMinutes: number): WorldEvent[] {
    if (simDeltaMinutes <= 0) return [];

    const frameEvents: WorldEvent[] = [];

    for (const rule of this.rules) {
      try {
        const result = rule.evaluate(state, simDeltaMinutes);
        if (result.emittedEvents && result.emittedEvents.length > 0) {
          for (const evt of result.emittedEvents) {
            frameEvents.push(evt);
            state.events.active = true;
            state.events.current = evt;
            state.events.history.unshift(evt);
            if (state.events.history.length > 50) state.events.history.pop();
            this.eventListeners.forEach((l) => l(evt));
          }
        }
      } catch (err: any) {
        console.error(`[ENVIRONMENT SYSTEM] Error executing rule ${rule.id} (${rule.name}):`, err?.message || err);
      }
    }

    // Evaluate Hysteresis & Anti-Spam Threshold Crossings
    const thresholdEvents = environmentThresholdManager.evaluate(state);
    for (const evt of thresholdEvents) {
      frameEvents.push(evt);
      state.events.active = true;
      state.events.current = evt;
      state.events.history.unshift(evt);
      if (state.events.history.length > 50) state.events.history.pop();
      this.eventListeners.forEach((l) => l(evt));
    }

    return frameEvents;
  }
}

export const environmentSimulationSystem = new EnvironmentSimulationSystem();
