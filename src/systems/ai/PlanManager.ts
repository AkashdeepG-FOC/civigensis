import { MultiStepPlan, PlanStep, PlanStepStatus } from '../../types/benAI';
import { BenAction } from './IntentParser';

export type PlanManagerListener = () => void;

export class PlanManager {
  private planVersion: number = 0;
  private currentPlan: MultiStepPlan | null = null;
  private listeners: Set<PlanManagerListener> = new Set();
  private planCounter: number = 0;

  public subscribe(listener: PlanManagerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Single Authoritative Source for Plan Version
   */
  public getPlanVersion(): number {
    return this.planVersion;
  }

  public incrementVersion(): number {
    this.planVersion++;
    return this.planVersion;
  }

  /**
   * Sets a new multi-step plan or updates the active goal sequence.
   */
  public setPlan(
    goal: string,
    rawSteps: { step: number; action: BenAction; target: string | null; targetDescription?: string }[],
    sourceEvent?: string,
    rationale?: string,
    targetDescription?: string
  ): MultiStepPlan {
    const planId = `PLAN-${++this.planCounter}-${Date.now()}`;
    this.planVersion++;

    const steps: PlanStep[] = rawSteps.map((s, index) => ({
      step: s.step || index + 1,
      action: s.action,
      target: s.target || null,
      targetDescription: s.targetDescription || targetDescription || undefined,
      status: index === 0 ? 'EXECUTING' : 'PENDING',
    }));

    this.currentPlan = {
      id: planId,
      version: this.planVersion,
      goal: goal || 'Autonomous Goal',
      rationale: rationale || 'Contextual motivation',
      targetDescription: targetDescription || (steps[0]?.targetDescription) || 'surrounding area',
      plan: steps,
      createdAt: Date.now(),
      status: 'ACTIVE',
      lifecycleState: 'EXECUTING',
      sourceEvent,
    };

    console.log(`[PLAN MANAGER v${this.planVersion}] Set Goal [${planId}]: "${goal}" (${steps.length} steps)`);
    console.log(`  Target: "${this.currentPlan.targetDescription}" | Rationale: "${this.currentPlan.rationale}"`);
    steps.forEach((s) => {
      console.log(`  Step #${s.step}: ${s.action} -> ${s.target || s.targetDescription || 'N/A'} [${s.status}]`);
    });

    this.notify();
    return this.currentPlan;
  }


  public getCurrentPlan(): MultiStepPlan | null {
    return this.currentPlan;
  }

  /**
   * Authoritative Active Step Selector:
   * Finds the FIRST step with status 'EXECUTING' or 'PENDING'.
   * Automatically skips COMPLETED, INVALIDATED, and FAILED steps!
   */
  public getCurrentStep(): PlanStep | null {
    if (!this.currentPlan || this.currentPlan.status !== 'ACTIVE') return null;

    // First check if a step is currently EXECUTING
    const executing = this.currentPlan.plan.find((s) => s.status === 'EXECUTING');
    if (executing) return executing;

    // Otherwise find the first PENDING step and mark it EXECUTING
    const pending = this.currentPlan.plan.find((s) => s.status === 'PENDING');
    if (pending) {
      pending.status = 'EXECUTING';
      console.log(`[PLAN MANAGER v${this.planVersion}] Step #${pending.step} transition: PENDING -> EXECUTING (${pending.action} -> ${pending.target})`);
      this.notify();
      return pending;
    }

    // If no EXECUTING or PENDING steps remain, mark plan as COMPLETED
    if (this.currentPlan.plan.length > 0 && !this.currentPlan.plan.some((s) => s.status === 'PENDING' || s.status === 'EXECUTING')) {
      this.currentPlan.status = 'COMPLETED';
      console.log(`[PLAN MANAGER v${this.planVersion}] Plan [${this.currentPlan.id}] ALL PENDING STEPS PROCESSED: Goal "${this.currentPlan.goal}" finished.`);
      this.notify();
    }

    return null;
  }

  /**
   * Marks the current active step as COMPLETED.
   */
  public markCurrentStepCompleted(): PlanStep | null {
    if (!this.currentPlan || this.currentPlan.status !== 'ACTIVE') return null;

    const currentStep = this.getCurrentStep();
    if (currentStep) {
      currentStep.status = 'COMPLETED';
      currentStep.completedAt = Date.now();
      console.log(`[PLAN MANAGER v${this.planVersion}] Step #${currentStep.step} COMPLETED: ${currentStep.action} -> ${currentStep.target}`);
    }

    this.notify();
    return this.getCurrentStep();
  }

  /**
   * Invalidates specific pending actions matching a reason (e.g., WATER_CROP on rain).
   * Completed steps RETAIN status 'COMPLETED' intact!
   */
  public invalidateStepByAction(action: BenAction, reason: string): number {
    if (!this.currentPlan || this.currentPlan.status !== 'ACTIVE') return 0;

    let invalidatedCount = 0;
    this.currentPlan.plan.forEach((s) => {
      if (s.action === action && (s.status === 'PENDING' || s.status === 'EXECUTING')) {
        s.status = 'INVALIDATED';
        s.failureReason = reason;
        invalidatedCount++;
      }
    });

    if (invalidatedCount > 0) {
      this.planVersion++;
      this.currentPlan.version = this.planVersion;
      console.warn(`[PLAN MANAGER v${this.planVersion}] Invalidated ${invalidatedCount} '${action}' step(s). Reason: "${reason}"`);

      // Check if any actionable pending steps remain
      const hasPending = this.currentPlan.plan.some((s) => s.status === 'PENDING' || s.status === 'EXECUTING');
      if (!hasPending) {
        console.log(`[PLAN MANAGER v${this.planVersion}] No remaining pending steps after invalidation; goal evaluated.`);
      }
      this.notify();
    }

    return invalidatedCount;
  }

  /**
   * Marks current active step as FAILED and invalidates the plan.
   */
  public markCurrentStepFailed(reason: string) {
    if (!this.currentPlan) return;

    const currentStep = this.getCurrentStep();
    if (currentStep) {
      currentStep.status = 'FAILED';
      currentStep.failureReason = reason;
      console.log(`[PLAN MANAGER v${this.planVersion}] Step #${currentStep.step} FAILED: ${reason}`);
    }

    this.invalidatePlan(`Step failed: ${reason}`);
  }

  public invalidatePlan(reason: string) {
    if (!this.currentPlan) return;

    this.planVersion++;
    this.currentPlan.status = 'INVALIDATED';
    this.currentPlan.version = this.planVersion;
    this.currentPlan.invalidationReason = reason;
    console.warn(`[PLAN MANAGER v${this.planVersion}] Plan [${this.currentPlan.id}] INVALIDATED. Reason: "${reason}"`);
    this.notify();
  }

  public getCompletedSteps(): PlanStep[] {
    if (!this.currentPlan) return [];
    return this.currentPlan.plan.filter((s) => s.status === 'COMPLETED');
  }

  public getInvalidatedSteps(): PlanStep[] {
    if (!this.currentPlan) return [];
    return this.currentPlan.plan.filter((s) => s.status === 'INVALIDATED');
  }

  public getPendingSteps(): PlanStep[] {
    if (!this.currentPlan) return [];
    return this.currentPlan.plan.filter((s) => s.status === 'PENDING' || s.status === 'EXECUTING');
  }

  public isPlanValid(): boolean {
    return (
      this.currentPlan !== null &&
      this.currentPlan.status === 'ACTIVE' &&
      this.currentPlan.plan.some((s) => s.status === 'PENDING' || s.status === 'EXECUTING')
    );
  }

  public reset() {
    this.planVersion++;
    this.currentPlan = null;
    this.notify();
  }
}
