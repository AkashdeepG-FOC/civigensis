import { MemorySystem } from './MemorySystem';
import { BeliefSystem } from './BeliefSystem';
import { GoalSystem } from './GoalSystem';
import { CitizenIdentity } from '../../types/citizenAgent';

export class ReflectionSystem {
  private lastReflectionTime: number = 0;
  private minIntervalMs: number = 60000; // Reflect at most once every 60 sim seconds / 1 min real time

  public shouldReflect(recentEventCount: number, goalFailed: boolean = false): boolean {
    const now = Date.now();
    if (goalFailed) return true;
    if (now - this.lastReflectionTime > this.minIntervalMs && recentEventCount > 3) {
      return true;
    }
    return false;
  }

  public reflect(
    identity: CitizenIdentity,
    memorySystem: MemorySystem,
    beliefSystem: BeliefSystem,
    goalSystem: GoalSystem,
    triggerReason: string
  ) {
    this.lastReflectionTime = Date.now();

    const activeGoal = goalSystem.getActiveGoal();
    const recentExperiences = memorySystem.getRecentEpisodicMemories(10).filter((m) => {
      const desc = m.description.toLowerCase();
      // Filter out transient system/debug events
      if (desc.includes('started navigation')) return false;
      if (desc.includes('pathfinding')) return false;
      if (desc.includes('nav state')) return false;
      if (desc.includes('velocity')) return false;
      if (desc.includes('animation')) return false;
      return true;
    });

    if (recentExperiences.length === 0) return;

    const latestExp = recentExperiences[0];
    const insight = `${identity.name} reflected on "${latestExp.description}": Realized this route is accessible and vital for daily village activities.`;

    memorySystem.addReflectionMemory(triggerReason, insight, activeGoal ? activeGoal.description : undefined);

    console.log(`[REFLECTION][${identity.name.toUpperCase()}] Trigger: "${triggerReason}" -> Insight: "${insight}"`);
  }
}
