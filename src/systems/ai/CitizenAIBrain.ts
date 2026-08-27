import { CitizenAgent } from './CitizenAgent';
import { BEN_IDENTITY, JULIE_IDENTITY, BEN_CONFIG, JULIE_CONFIG } from '../../config/citizens';
import { CitizenConfig, CitizenId, ControlMode } from '../../types/citizen';
import { HighLevelIntention } from '../../types/benAI';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';

export type CitizenAIBrainListener = () => void;

export class CitizenAIBrain {
  public agent: CitizenAgent;
  private config: CitizenConfig;

  constructor(config: CitizenConfig = BEN_CONFIG) {
    this.config = config;
    let identity: typeof BEN_IDENTITY;
    switch (config.id) {
      case 'ben':
        identity = BEN_IDENTITY;
        break;
      case 'julie':
        identity = JULIE_IDENTITY;
        break;
      default:
        throw new Error(`Unknown citizen ID: ${config.id}`);
    }
    this.agent = new CitizenAgent(identity);
  }

  public getCitizenId(): CitizenId {
    return this.config.id;
  }

  public getConfig(): CitizenConfig {
    return this.config;
  }

  public getAgent(): CitizenAgent {
    return this.agent;
  }

  public subscribe(listener: CitizenAIBrainListener): () => void {
    return this.agent.subscribe(listener);
  }

  public getControlMode(): ControlMode {
    return this.agent.getControlMode();
  }

  public setControlMode(mode: ControlMode) {
    this.agent.setControlMode(mode);
  }

  public getCurrentIntention(): HighLevelIntention | null {
    const decision = this.agent.cognitionEngine.getCurrentDecision();
    if (!decision) return null;

    const toolName = decision.tool || decision.action || 'GO_TO';
    const intentText = decision.speech || decision.intention || decision.goal || 'Autonomous Goal';
    const reasonText = decision.reason || decision.reasoning_summary || 'Village Routine';

    return {
      id: `DEC-${Date.now()}`,
      intent: intentText,
      rationale: reasonText,
      targetDescription: toolName,
      parsedIntent: {
        intentionText: intentText,
        rationale: reasonText,
        targetDescription: toolName,
        action: 'INSPECT' as any,
        target: toolName,
        rawText: `${toolName}`,
        createdAt: Date.now(),
      },
      createdAt: Date.now(),
      status: 'EXECUTING',
    };
  }

  public getIsLLMRequestPending(): boolean {
    return this.agent.cognitionEngine.getIsThinking();
  }

  public getReplanCounter(): number {
    return 0;
  }

  public getLastEventReason(): string {
    return 'Event Driven Cognition Active';
  }

  public getPlanManager(): any {
    const activeGoal = this.agent.goalSystem.getActiveGoal();
    const decision = this.agent.cognitionEngine.getCurrentDecision();

    return {
      getCurrentPlan: () => {
        if (!activeGoal && !decision) return null;
        const toolName = decision ? (decision.tool || decision.action || 'GO_TO') : 'surrounding area';
        return {
          id: activeGoal ? activeGoal.id : 'DEC-1',
          goal: decision?.goal || activeGoal?.description || 'Autonomous Intention',
          rationale: decision?.reason || decision?.reasoning_summary || activeGoal?.motivation,
          targetDescription: toolName,
          status: 'ACTIVE',
          lifecycleState: activeGoal?.status || 'EXECUTING',
          plan: decision ? [
            {
              step: 1,
              action: toolName.toUpperCase(),
              target: JSON.stringify(decision.arguments || {}),
              targetDescription: decision.expected_outcome || decision.reason,
              status: 'EXECUTING',
            }
          ] : [],
        };
      },
      getCurrentStep: () => {
        if (!decision) return null;
        const toolName = decision.tool || decision.action || 'GO_TO';
        return {
          step: 1,
          action: toolName.toUpperCase(),
          target: JSON.stringify(decision.arguments || {}),
          targetDescription: decision.expected_outcome || decision.reason,
          status: 'EXECUTING',
        };
      },
      isPlanValid: () => true,
    };
  }

  public update(
    currentPos: [number, number, number],
    currentRotY: number,
    delta: number,
    allPositions: Record<CitizenId, [number, number, number]>
  ) {
    const state = worldSimulationEngine.getState();
    return this.agent.update(
      currentPos,
      currentRotY,
      delta,
      allPositions,
      worldSimulationEngine.lastSimDeltaMinutes,
      state.weather.temperature
    );
  }
}

export const benAIBrain = new CitizenAIBrain(BEN_CONFIG);
export const julieAIBrain = new CitizenAIBrain(JULIE_CONFIG);
