import { CitizenId } from '../../types/citizen';
import { BenAction } from '../ai/IntentParser';
import { TimePeriod } from '../../types/world';
import { calculateActivityDuration, ACTIVITY_DURATION_CONFIG } from './ActivityDurationConfig';

export interface ActiveActivityState {
  citizenId: CitizenId;
  action: BenAction;
  target: string | null;
  status: 'PENDING' | 'STARTING' | 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';
  startSimMinutes: number;
  durationSimMinutes: number;
  endsSimMinutes: number;
  decisionId: string;
}

export type ActivityDurationListener = () => void;

export class ActivityDurationManager {
  private activeActivities: Map<CitizenId, ActiveActivityState> = new Map();
  private listeners: Set<ActivityDurationListener> = new Set();

  public subscribe(listener: ActivityDurationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Starts a new duration-based activity.
   * Calculates duration in SIMULATION MINUTES exactly ONCE at activity start.
   */
  public startActivity(
    citizenId: CitizenId,
    action: BenAction,
    target: string | null,
    currentSimMinutes: number,
    period: TimePeriod,
    hour: number,
    decisionId: string
  ): ActiveActivityState {
    const existing = this.activeActivities.get(citizenId);
    if (existing && existing.decisionId === decisionId && existing.status === 'ACTIVE') {
      return existing;
    }

    const durationSimMinutes = calculateActivityDuration(action, period, hour);
    const endsSimMinutes = currentSimMinutes + durationSimMinutes;

    const activityState: ActiveActivityState = {
      citizenId,
      action,
      target,
      status: 'ACTIVE',
      startSimMinutes: currentSimMinutes,
      durationSimMinutes: Math.round(durationSimMinutes * 100) / 100,
      endsSimMinutes: Math.round(endsSimMinutes * 100) / 100,
      decisionId,
    };

    this.activeActivities.set(citizenId, activityState);

    const configName = ACTIVITY_DURATION_CONFIG[action]?.name || action;
    console.log(
      `[DURATION SYSTEM] Started Activity '${configName}' for ${citizenId.toUpperCase()}. ` +
      `Duration: ${activityState.durationSimMinutes.toFixed(1)} sim minutes (Sim Time: ${currentSimMinutes.toFixed(1)} -> ${endsSimMinutes.toFixed(1)})`
    );

    this.notify();
    return activityState;
  }

  /**
   * Evaluated every tick using simulation time.
   */
  public update(
    citizenId: CitizenId,
    currentSimMinutes: number
  ): { isCompleted: boolean; remainingSimMinutes: number; activeState: ActiveActivityState | null } {
    const active = this.activeActivities.get(citizenId);
    if (!active || active.status !== 'ACTIVE') {
      return { isCompleted: false, remainingSimMinutes: 0, activeState: null };
    }

    const remainingSimMinutes = Math.max(0, active.endsSimMinutes - currentSimMinutes);

    if (currentSimMinutes >= active.endsSimMinutes) {
      active.status = 'COMPLETED';
      console.log(
        `[DURATION SYSTEM] Activity '${active.action}' for ${citizenId.toUpperCase()} COMPLETED ` +
        `at sim minute ${currentSimMinutes.toFixed(1)} (Duration ${active.durationSimMinutes.toFixed(1)} sim mins finished).`
      );
      this.notify();
      return { isCompleted: true, remainingSimMinutes: 0, activeState: active };
    }

    return { isCompleted: false, remainingSimMinutes: Math.round(remainingSimMinutes * 10) / 10, activeState: active };
  }

  public isActivityActive(citizenId: CitizenId): boolean {
    const active = this.activeActivities.get(citizenId);
    return active !== undefined && active.status === 'ACTIVE';
  }

  public getActiveActivity(citizenId: CitizenId): ActiveActivityState | null {
    return this.activeActivities.get(citizenId) || null;
  }

  public interruptActivity(citizenId: CitizenId, reason: string) {
    const active = this.activeActivities.get(citizenId);
    if (active && active.status === 'ACTIVE') {
      active.status = 'INTERRUPTED';
      console.warn(`[DURATION SYSTEM] Activity '${active.action}' for ${citizenId.toUpperCase()} INTERRUPTED. Reason: "${reason}"`);
      this.notify();
    }
  }

  public clearActivity(citizenId: CitizenId) {
    this.activeActivities.delete(citizenId);
    this.notify();
  }
}

export const activityDurationManager = new ActivityDurationManager();
