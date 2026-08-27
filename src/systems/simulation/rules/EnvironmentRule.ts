import { WorldState, WorldEvent } from '../../../types/world';

export type EnvironmentCategory =
  | 'TIME'
  | 'SUNLIGHT'
  | 'TEMPERATURE'
  | 'RAIN'
  | 'HUMIDITY'
  | 'WIND'
  | 'WATER'
  | 'RIVER'
  | 'SOIL'
  | 'CROP'
  | 'PLANT'
  | 'EVAPORATION'
  | 'FLOOD'
  | 'DROUGHT'
  | 'FIRE'
  | 'RESOURCE'
  | 'CITIZEN'
  | 'NAVIGATION';

export interface RuleEvaluationResult {
  ruleId: string;
  triggered: boolean;
  emittedEvents: WorldEvent[];
}

export interface IEnvironmentRule {
  id: string;
  category: EnvironmentCategory;
  name: string;
  description: string;
  priority: number;
  isProbabilistic: boolean;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult;
}
