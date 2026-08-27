import { WorldState, WorldEvent } from '../../types/world';
import { ENVIRONMENT_THRESHOLDS_CONFIG, ThresholdDefinition } from './EnvironmentThresholdConfig';

function createThresholdEvent(type: string, description: string, payload?: Record<string, any>): WorldEvent {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return {
    id: `TH-EVT-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    timestamp,
    description,
    payload,
  };
}

export class EnvironmentThresholdManager {
  private activeStateMap: Map<string, boolean> = new Map();
  private definitions: ThresholdDefinition[] = ENVIRONMENT_THRESHOLDS_CONFIG;

  /**
   * Evaluates all configured environmental thresholds against live world state.
   * Emits events ONLY ONCE per state transition (anti-spam protection) with hysteresis.
   */
  public evaluate(state: WorldState): WorldEvent[] {
    const emittedEvents: WorldEvent[] = [];

    for (const def of this.definitions) {
      const val = def.getValue(state);
      const isActive = this.activeStateMap.get(def.id) || false;

      if (def.direction === 'RISING') {
        // Transition: Inactive -> Active (Crossed Start Threshold upward)
        if (!isActive && val >= def.startThreshold) {
          this.activeStateMap.set(def.id, true);
          const evt = createThresholdEvent(
            def.startEvent,
            `[Threshold Event] ${def.name} crossed start threshold (${val.toFixed(2)} >= ${def.startThreshold})`,
            { thresholdId: def.id, value: val, startThreshold: def.startThreshold }
          );
          console.log(`[THRESHOLD MANAGER] ACTIVATED ${def.id} -> Emitted ${def.startEvent} (Val: ${val.toFixed(2)})`);
          emittedEvents.push(evt);
        }
        // Transition: Active -> Inactive (Crossed Stop Threshold downward with hysteresis)
        else if (isActive && def.stopThreshold !== undefined && val < def.stopThreshold) {
          this.activeStateMap.set(def.id, false);
          if (def.stopEvent) {
            const evt = createThresholdEvent(
              def.stopEvent,
              `[Threshold Event] ${def.name} recovered past stop threshold (${val.toFixed(2)} < ${def.stopThreshold})`,
              { thresholdId: def.id, value: val, stopThreshold: def.stopThreshold }
            );
            console.log(`[THRESHOLD MANAGER] CLEARED ${def.id} -> Emitted ${def.stopEvent} (Val: ${val.toFixed(2)})`);
            emittedEvents.push(evt);
          }
        }
      } else if (def.direction === 'FALLING') {
        // Transition: Inactive -> Active (Crossed Start Threshold downward)
        if (!isActive && val <= def.startThreshold) {
          this.activeStateMap.set(def.id, true);
          const evt = createThresholdEvent(
            def.startEvent,
            `[Threshold Event] ${def.name} dropped below start threshold (${val.toFixed(2)} <= ${def.startThreshold})`,
            { thresholdId: def.id, value: val, startThreshold: def.startThreshold }
          );
          console.log(`[THRESHOLD MANAGER] ACTIVATED ${def.id} -> Emitted ${def.startEvent} (Val: ${val.toFixed(2)})`);
          emittedEvents.push(evt);
        }
        // Transition: Active -> Inactive (Crossed Stop Threshold upward with hysteresis)
        else if (isActive && def.stopThreshold !== undefined && val > def.stopThreshold) {
          this.activeStateMap.set(def.id, false);
          if (def.stopEvent) {
            const evt = createThresholdEvent(
              def.stopEvent,
              `[Threshold Event] ${def.name} recovered above stop threshold (${val.toFixed(2)} > ${def.stopThreshold})`,
              { thresholdId: def.id, value: val, stopThreshold: def.stopThreshold }
            );
            console.log(`[THRESHOLD MANAGER] CLEARED ${def.id} -> Emitted ${def.stopEvent} (Val: ${val.toFixed(2)})`);
            emittedEvents.push(evt);
          }
        }
      }
    }

    return emittedEvents;
  }

  public isThresholdActive(thresholdId: string): boolean {
    return this.activeStateMap.get(thresholdId) || false;
  }

  public getActiveThresholdIds(): string[] {
    const active: string[] = [];
    this.activeStateMap.forEach((isAct, id) => {
      if (isAct) active.push(id);
    });
    return active;
  }
}

export const environmentThresholdManager = new EnvironmentThresholdManager();
