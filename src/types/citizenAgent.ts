import { CitizenId } from './citizen';
import { WeatherType, TimePeriod } from './world';

export interface PersonalityTraits {
  workInitiative: 'low' | 'medium' | 'high';
  riskTolerance: 'low' | 'medium' | 'high';
  socialTendency: 'low' | 'medium' | 'high';
  explorationTendency: 'low' | 'medium' | 'high';
  curiosity: number;  // 0 - 100
  empathy: number;    // 0 - 100
}

export interface CitizenIdentity {
  id: CitizenId;
  name: string;
  gender: 'male' | 'female';
  age: number;
  profession: string;
  skills: string[];
  personality: PersonalityTraits;
  preferences: string[];
  values: string[];
  fears: string[];
  interests: string[];
  background: string;
}

export interface CitizenNeeds {
  hunger: number;               // 0 (Satiated) - 100 (Starving)
  energy: number;               // 0 (Exhausted) - 100 (Fully Energized)
  thirst: number;               // 0 (Hydrated) - 100 (Parched)
  safety: number;               // 0 (Terrified) - 100 (Completely Safe)
  socialConnection: number;     // 0 (Lonely) - 100 (Fulfilling Connection)
  comfort: number;              // 0 (Uncomfortable) - 100 (Pampered)
  curiosity: number;            // 0 (Satisfied) - 100 (Burning Curiosity)
  achievement: number;          // 0 (Unfulfilled) - 100 (Accomplished)
  belonging: number;            // 0 (Isolated) - 100 (Fully Belonging)
  financialSecurity: number;    // 0 (Broke/Anxious) - 100 (Secure)
  professionalProgress: number; // 0 (Stagnant) - 100 (Thriving Career)
}

export interface EmotionState {
  valence: number;     // -1.0 (Negative/Unhappy) to +1.0 (Positive/Happy)
  arousal: number;     // 0.0 (Calm/Sleepy) to 1.0 (Excited/Agitated)
  stress: number;      // 0 (Relaxed) to 100 (High Stress)
  mood: 'calm' | 'happy' | 'focused' | 'anxious' | 'frustrated' | 'tired' | 'excited';
  lastUpdated: number;
}

export interface GoalStackItem {
  id: string;
  goal: AgentGoal;
  interruptedAction?: {
    tool: string;
    arguments: Record<string, any>;
    intention: string;
  };
  pushedAt: number;
  reason: string;
}

export interface Belief {
  id: string;
  statement: string;
  confidence: number;      // 0.0 - 1.0
  source: 'observation' | 'conversation' | 'deduction' | 'memory';
  timestamp: string;
  lastVerified: string;
}

export interface EpisodicMemoryItem {
  id: string;
  timestamp: string;
  location: string;
  description: string;
  emotionalImpact: number; // -1.0 (negative) to 1.0 (positive)
  tags: string[];
}

export interface SemanticMemoryItem {
  id: string;
  fact: string;
  confidence: number;
  learnedAt: string;
  source: string;
}

export interface RelationshipMemoryItem {
  id: string;
  targetCitizenId: CitizenId;
  experience: string;
  impactOnTrust: number;
  timestamp: string;
}

export interface ReflectionMemoryItem {
  id: string;
  trigger: string;
  insight: string;
  goalAdjustment?: string;
  timestamp: string;
}

export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED' | 'FAILED';

export interface AgentGoal {
  id: string;
  description: string;
  priority: number;        // 1 (Low) to 10 (Urgent)
  motivation: string;
  status: GoalStatus;
  progress: number;        // 0 - 100%
  createdAt: number;
  updatedAt: number;
  deadline?: string;
  subgoals?: string[];
}

export interface RelationshipState {
  targetCitizenId: CitizenId;
  trust: number;        // 0 - 100
  friendship: number;   // 0 - 100
  respect: number;      // 0 - 100
  familiarity: number;  // 0 - 100
  gratitude: number;    // 0 - 100
  frustration: number;  // 0 - 100
  anger?: number;       // 0 - 100
  resentment?: number;  // 0 - 100
  fear?: number;        // 0 - 100
  romance?: number;     // 0 - 100
  lastInteractionTime: string;
  lastTopic?: string;
}

export interface WorldObjectState {
  id: string;
  type: string;
  name: string;
  owner: CitizenId | 'environment' | 'none';
  location: string;
  quantity: number;
  position: [number, number, number];
  state?: string;
  isInteractable?: boolean;
}

export interface PerceivableCitizen {
  id: CitizenId;
  name: string;
  distance: number;
  location: string;
  apparentActivity: string;
  position: [number, number, number];
  relationshipValues?: Partial<RelationshipState>;
  emotionalState?: string;
  recentInteraction?: string;
}

export interface PerceivableObject {
  id: string;
  name: string;
  type: string;
  owner: string;
  location: string;
  distance: number;
  quantity: number;
}

export interface PerceptionSnapshot {
  locationName: string;
  position: [number, number, number];
  visibleObjects: string[];
  perceivableObjects?: PerceivableObject[];
  nearbyCitizens: PerceivableCitizen[];
  localWeather: {
    type: WeatherType;
    temperature: number;
    rainRate: number;
  };
  localTime: {
    formatted: string;
    period: TimePeriod;
  };
  ambientSound?: string;
  recentEvents: string[];
}

export type ToolCategory =
  | 'MOVEMENT'
  | 'PERCEPTION'
  | 'SOCIAL'
  | 'OBJECT'
  | 'SURVIVAL'
  | 'WORLD'
  | 'CONFLICT'
  | 'EMOTIONAL'
  | 'IDLE'
  | 'COGNITIVE'
  | 'GOVERNANCE'
  | 'ECONOMY';

export interface ToolResult {
  success: boolean;
  reason: string;
  worldStateMutation?: Record<string, any>;
  memoryDescription?: string;
  timeSpentMinutes?: number;
  data?: any;
  targetId?: string;
  consequences?: Record<string, any>;
  eventType?: string;
  eventData?: Record<string, any>;
}

export interface StructuredDecision {
  decision_id?: string;
  goal: string;
  reason?: string;
  intention?: string;
  immediate_behavior?: string;
  target?: string;
  next?: string;
  speech?: string;

  // Backward-compatibility & execution mapping fields
  action?: string;
  expected_next_action?: string;
  tool?: string;
  arguments?: Record<string, any>;
  resolvedTool?: string;
  resolvedArguments?: Record<string, any>;
  reasoning_summary?: string;
  expected_outcome?: string;
  confidence?: number;
}

export interface CoreMemory {
  agentId: CitizenId;
  identity: CitizenIdentity;
  coreBeliefs: string[]; // Soul entries
  longTermGoals: string[];
}

export interface WorkingMemory {
  goal: string;
  reason: string;
  intention: string;
  immediate_behavior: string;
  target: string;
  next: string;
  current_activity: string;
  current_location: string;
  active_plan?: string[];
  interrupted_plan?: {
    goal: string;
    intention: string;
    target: string;
    next: string;
    interruptedAt: string;
  } | null;
  lastUpdated: string;
}

export interface WorldMemoryFact {
  id: string;
  category: 'location' | 'weather' | 'market' | 'citizen' | 'object' | 'relationship' | 'general';
  fact: string;
  value?: any;
  timestamp: string;
  lastVerified: string;
}

export interface RecentEventItem {
  id: string;
  event: string;
  timestamp: string;
  source?: string;
}

export interface AgentSessionContext {
  agentId: CitizenId;
  coreMemory: CoreMemory;
  workingMemory: WorkingMemory;
  worldFacts: WorldMemoryFact[];
  episodicMemories: EpisodicMemoryItem[];
  recentEvents: RecentEventItem[];
}


export type CitizenEventType =
  | 'LIFE_THREAT'
  | 'PHYSICAL_DANGER'
  | 'SOCIAL_INTERACTION'
  | 'URGENT_HELP'
  | 'CRITICAL_NEED'
  | 'TASK_INTERRUPT'
  | 'LONG_TERM_GOAL'
  | 'EXPLORATION'
  | 'IDLE_OBSERVE';

export interface CitizenEvent {
  id: string;
  type: CitizenEventType;
  source: CitizenId | string;
  target: CitizenId | string;
  message?: string;
  requiresResponse: boolean;
  timestamp: number;
  priority: number; // 0 - 100
  data?: Record<string, any>;
}

export interface AttentionItem {
  type: 'SOCIAL' | 'NEED' | 'GOAL' | 'WORLD' | 'EMERGENCY';
  priority: number;
  source?: string;
  message?: string;
  requiresResponse?: boolean;
  details: string;
}

export interface AttentionSnapshot {
  topPriority: number;
  primaryFocus: AttentionItem | null;
  attentionList: AttentionItem[];
  hasPendingSocialInteraction: boolean;
}

export interface InterruptedTask {
  id: string;
  tool: string;
  arguments: Record<string, any>;
  goal: string;
  intention: string;
  priority: number;
  interruptedAt: number;
  targetLocation?: string;
}

