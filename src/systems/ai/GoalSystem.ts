import { AgentGoal, GoalStatus } from '../../types/citizenAgent';

export class GoalSystem {
  private goals: Map<string, AgentGoal> = new Map();
  private activeGoalId: string | null = null;

  public createGoal(
    description: string,
    priority: number = 5,
    motivation: string = 'Personal desire',
    deadline?: string,
    subgoals: string[] = []
  ): AgentGoal {
    const id = `GOAL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = Date.now();
    const goal: AgentGoal = {
      id,
      description,
      priority: Math.max(1, Math.min(10, priority)),
      motivation,
      status: 'ACTIVE',
      progress: 0,
      createdAt: now,
      updatedAt: now,
      deadline,
      subgoals,
    };

    this.goals.set(id, goal);

    // Auto-select highest priority goal if none active or new goal is higher priority
    const currentActive = this.getActiveGoal();
    if (!currentActive || goal.priority > currentActive.priority) {
      this.activeGoalId = id;
    }

    return goal;
  }

  public getActiveGoal(): AgentGoal | null {
    if (!this.activeGoalId) return this.getHighestPriorityActiveGoal();
    const g = this.goals.get(this.activeGoalId);
    if (g && g.status === 'ACTIVE') return g;
    return this.getHighestPriorityActiveGoal();
  }

  public getHighestPriorityActiveGoal(): AgentGoal | null {
    const active = Array.from(this.goals.values())
      .filter((g) => g.status === 'ACTIVE')
      .sort((a, b) => b.priority - a.priority);

    if (active.length > 0) {
      this.activeGoalId = active[0].id;
      return active[0];
    }
    this.activeGoalId = null;
    return null;
  }

  public updateGoalStatus(id: string, status: GoalStatus, progress: number = 100) {
    const g = this.goals.get(id);
    if (g) {
      g.status = status;
      g.progress = progress;
      g.updatedAt = Date.now();

      if (status === 'COMPLETED' || status === 'ABANDONED' || status === 'FAILED') {
        if (this.activeGoalId === id) {
          this.activeGoalId = null;
          this.getHighestPriorityActiveGoal();
        }
      }
    }
  }

  public updateProgress(id: string, progressDelta: number) {
    const g = this.goals.get(id);
    if (g) {
      g.progress = Math.max(0, Math.min(100, g.progress + progressDelta));
      g.updatedAt = Date.now();
      if (g.progress >= 100) {
        this.updateGoalStatus(id, 'COMPLETED', 100);
      }
    }
  }

  public abandonActiveGoal(reason: string) {
    const active = this.getActiveGoal();
    if (active) {
      this.updateGoalStatus(active.id, 'ABANDONED');
    }
  }

  public getAllGoals(): AgentGoal[] {
    return Array.from(this.goals.values());
  }

  public getGoalsPromptSummary(): string {
    const active = this.getActiveGoal();
    if (!active) {
      return 'Currently no active long-horizon goal. Eager to formulate a new goal based on identity, needs, or world observations.';
    }

    return `Active Goal: "${active.description}" (Priority: ${active.priority}/10, Progress: ${Math.round(active.progress)}%, Motivation: "${active.motivation}")`;
  }
}
