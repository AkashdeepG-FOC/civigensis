import { CitizenId } from '../../types/citizen';
import { InterruptedTask, StructuredDecision } from '../../types/citizenAgent';
import { farmingWorldState } from './FarmingWorldState';

export class TaskInterruptManager {
  private static instance: TaskInterruptManager;

  private interruptedTasks: Record<CitizenId, InterruptedTask | null> = {
    ben: null,
    julie: null,
    ravi: null,
  };

  public static getInstance(): TaskInterruptManager {
    if (!TaskInterruptManager.instance) {
      TaskInterruptManager.instance = new TaskInterruptManager();
    }
    return TaskInterruptManager.instance;
  }

  public saveInterruptedTask(citizenId: CitizenId, task: Omit<InterruptedTask, 'id' | 'interruptedAt'>) {
    const fullTask: InterruptedTask = {
      ...task,
      id: `int-${Date.now()}`,
      interruptedAt: Date.now(),
    };
    this.interruptedTasks[citizenId] = fullTask;
    console.log(
      `[TASK_INTERRUPT] Saved interrupted task for ${citizenId.toUpperCase()}: Tool="${fullTask.tool}", Goal="${fullTask.goal}"`
    );
  }

  public getInterruptedTask(citizenId: CitizenId): InterruptedTask | null {
    return this.interruptedTasks[citizenId] || null;
  }

  public clearInterruptedTask(citizenId: CitizenId) {
    this.interruptedTasks[citizenId] = null;
  }

  /**
   * Evaluates if interrupted task is still valid and produces a decision to resume it
   */
  public resumeTaskIfValid(citizenId: CitizenId): StructuredDecision | null {
    const task = this.interruptedTasks[citizenId];
    if (!task) return null;

    // Check if task is too old (> 10 wall-clock minutes)
    if (Date.now() - task.interruptedAt > 600000) {
      console.log(`[TASK_INTERRUPT] Interrupted task for ${citizenId.toUpperCase()} expired (> 10 mins).`);
      this.clearInterruptedTask(citizenId);
      return null;
    }

    const tool = task.tool.toLowerCase();

    // Validation for Farming activities
    if (tool === 'water_crops' || tool === 'collect_water') {
      const crop = farmingWorldState.wheatCrop;
      if (crop.waterLevel >= 85) {
        console.log(`[TASK_INTERRUPT] Interrupted watering task no longer valid (Water level: ${crop.waterLevel}%).`);
        this.clearInterruptedTask(citizenId);
        return null;
      }
    }

    if (tool === 'harvest_crops') {
      const crop = farmingWorldState.wheatCrop;
      if (!crop.isMature) {
        console.log(`[TASK_INTERRUPT] Interrupted harvest task no longer valid (Crops harvested or not mature).`);
        this.clearInterruptedTask(citizenId);
        return null;
      }
    }

    console.log(`[TASK_INTERRUPT] Resuming interrupted task for ${citizenId.toUpperCase()}: ${task.tool}`);
    const decision: StructuredDecision = {
      reasoning_summary: `Resuming previous interrupted task: "${task.intention}"`,
      goal: task.goal,
      intention: task.intention,
      immediate_behavior: task.intention,
      target: task.targetLocation,
      action: task.tool.toUpperCase(),
      tool: task.tool,
      arguments: task.arguments || {},
      expected_outcome: `Resumed completion of ${task.goal}`,
      confidence: 0.9,
    };

    this.clearInterruptedTask(citizenId);
    return decision;
  }
}

export const taskInterruptManager = TaskInterruptManager.getInstance();
