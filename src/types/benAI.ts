import { ParsedIntent } from '../systems/ai/IntentParser';

export type ControlMode = 'MANUAL' | 'AI';

export interface CitizenNeeds {
  energy: number;        // 0 - 100
  hunger: number;        // 0 - 100 (0 = Fully Satiated, 100 = Extremely Starved)
  foodStock: number;     // 0+ units of food available
  waterBucket: number;   // 0 - 5 buckets carried
  harvestedWheat: number; // 0 - 10 units carried
}
export type BenNeeds = CitizenNeeds;

export interface EatActionResult {
  success: boolean;
  reason: string;
  hungerBefore: number;
  hungerAfter: number;
  foodStockBefore: number;
  foodStockAfter: number;
  energyBefore: number;
  energyAfter: number;
}

export interface WheatCropState {
  growth: number;          // 0 - 100%
  waterLevel: number;      // 0 - 100%
  health: number;          // 0 - 100%
  isMature: boolean;
}

export interface EpisodicMemory {
  id: string;
  timestamp: string;      // e.g. "07:15:00"
  description: string;    // e.g. "Ben completed WATER_CROP at wheat farm."
}

export interface ExperienceRecord {
  id: string;
  timestamp: string;
  intention: string;
  targetDescription: string;
  outcome: 'COMPLETED' | 'REJECTED' | 'INVALIDATED' | 'FAILED';
  reason: string;
}

export interface CitizenMemory {
  identity: string[];
  worldKnowledge: string[];
  episodicMemories: EpisodicMemory[];
  experiences: ExperienceRecord[];
  socialMemories: import('./citizen').SocialMemoryItem[];
}
export type BenMemory = CitizenMemory;

export type GoalLifecycleState =
  | 'CREATED'
  | 'PLANNING'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED';

export interface OpenIntention {
  id: string;
  intention: string;        // "I want to inspect my farm because rainfall just stopped."
  rationale: string;        // "Rain may have hydrated the soil, rendering watering obsolete."
  targetDescription: string;// "my farm" or "unfamiliar object near northern river"
  createdAt: number;
}

export type IntentionStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'INVALIDATED' | 'FAILED';

export interface HighLevelIntention {
  id: string;
  intent: string;          // Open intention string
  rationale?: string;
  targetDescription: string;
  parsedIntent: ParsedIntent;
  expectedNextAction?: string;
  createdAt: number;
  status: IntentionStatus;
  reason?: string;
}

export type PlanStepStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'INVALIDATED' | 'FAILED';

export interface PlanStep {
  step: number;
  action: ParsedIntent['action'];
  target: string | null;
  targetDescription?: string;
  status: PlanStepStatus;
  failureReason?: string;
  completedAt?: number;
}

export interface MultiStepPlan {
  id: string;
  version: number;
  goal: string;
  rationale?: string;
  targetDescription?: string;
  plan: PlanStep[];
  createdAt: number;
  status: 'ACTIVE' | 'COMPLETED' | 'INVALIDATED' | 'FAILED';
  lifecycleState: GoalLifecycleState;
  invalidationReason?: string;
  sourceEvent?: string;
}

