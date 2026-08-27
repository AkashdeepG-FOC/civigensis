import { CitizenId } from '../../types/citizen';
import { benAIBrain, julieAIBrain, CitizenAIBrain } from './CitizenAIBrain';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';

export class CitizenRuntime {
  private static instance: CitizenRuntime;
  private brains: Record<CitizenId, CitizenAIBrain>;

  private constructor() {
    this.brains = {
      ben: benAIBrain,
      julie: julieAIBrain,
      ravi: benAIBrain,
    };
  }

  public static getInstance(): CitizenRuntime {
    if (!CitizenRuntime.instance) {
      CitizenRuntime.instance = new CitizenRuntime();
    }
    return CitizenRuntime.instance;
  }

  public getBrain(id: CitizenId): CitizenAIBrain {
    return this.brains[id];
  }

  /**
   * Synchronized tick for all citizens driven by SimulationEngine
   */
  public tick(
    delta: number,
    positions: Record<CitizenId, [number, number, number]>,
    rotations: Record<CitizenId, number>
  ): Record<CitizenId, any> {
    const simDeltaMinutes = worldSimulationEngine.getState().isPaused ? 0 : worldSimulationEngine.lastSimDeltaMinutes;
    const weatherTemp = worldSimulationEngine.getState().weather.temperature;

    const results: Record<string, any> = {};

    for (const id of ['ben', 'julie'] as CitizenId[]) {
      const brain = this.brains[id];
      if (brain && brain.getControlMode() === 'AI') {
        results[id] = brain.update(
          positions[id],
          rotations[id],
          delta,
          positions,
        );
      }
    }

    return results;
  }
}

export const citizenRuntime = CitizenRuntime.getInstance();
