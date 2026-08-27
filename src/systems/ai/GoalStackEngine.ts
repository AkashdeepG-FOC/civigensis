import { AgentGoal, GoalStackItem } from '../../types/citizenAgent';

export class GoalStackEngine {
  private stack: GoalStackItem[] = [];

  public pushGoal(goal: AgentGoal, reason: string, interruptedAction?: { tool: string; arguments: Record<string, any>; intention: string }) {
    const item: GoalStackItem = {
      id: `stack-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      goal,
      interruptedAction,
      pushedAt: Date.now(),
      reason,
    };
    this.stack.push(item);
    console.log(`[GOAL_STACK_PUSH] Goal: "${goal.description}" | Reason: "${reason}" | Stack Depth: ${this.stack.length}`);
  }

  public popGoal(): GoalStackItem | null {
    if (this.stack.length === 0) return null;
    const popped = this.stack.pop()!;
    console.log(`[GOAL_STACK_POP] Popped Goal: "${popped.goal.description}" | Remaining Depth: ${this.stack.length}`);
    return popped;
  }

  public peekGoal(): GoalStackItem | null {
    if (this.stack.length === 0) return null;
    return this.stack[this.stack.length - 1];
  }

  public getDepth(): number {
    return this.stack.length;
  }

  public clearStack() {
    this.stack = [];
  }
}
