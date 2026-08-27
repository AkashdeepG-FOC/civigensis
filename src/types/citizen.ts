export type AnimationState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'SWIM'
  | 'TREAD_WATER'
  | 'WATER_CROP'
  | 'HARVEST_CROP'
  | 'PLANT_CROP'
  | 'DIG'
  | 'PULL_PLANT'
  | 'MILK_COW'
  | 'WHEELBARROW';

export type CitizenId = 'ben' | 'julie' | 'ravi';
export type ControlMode = 'MANUAL' | 'AI';

export interface PersonalityTraits {
  workInitiative: 'low' | 'medium' | 'high';
  riskTolerance: 'low' | 'medium' | 'high';
  socialTendency: 'low' | 'medium' | 'high';
  explorationTendency: 'low' | 'medium' | 'high';
}

export interface VoiceProfile {
  preferredVoiceNames: string[];
  pitch: number;
  rate: number;
  lang: string;
}

export interface CitizenLLMConfig {
  model: string;
  modelId?: string;
  temperature: number;
  numPredict: number;
  timeoutMs?: number;
}

export interface CitizenConfig {
  id: CitizenId;
  name: string;
  gender: 'male' | 'female';
  modelPath: string;
  role: string;
  initialPosition: [number, number, number];
  speed: {
    walk: number;
    run: number;
  };
  personality: PersonalityTraits;
  voiceProfile: VoiceProfile;
  llm: CitizenLLMConfig;
}

export const ROLE_CAPABILITIES = {
  FARMER: [
    'HARVEST_CROP',
    'WATER_CROP',
    'COLLECT_WATER',
    'PLANT_CROP',
    'DIG',
    'PULL_PLANT',
    'MILK_COW',
    'WHEELBARROW',
  ],
  VEGETABLE_SELLER: [
    'AT_HOME',
    'WAKE_UP',
    'GO_TO_TOWN_CENTER',
    'SETUP_STALL',
    'SELLING',
    'IDLE_AT_STALL',
    'ARRANGE_VEGETABLES',
    'TALK_TO_CUSTOMER',
    'SELL_TO_CUSTOMER',
    'EAT_LUNCH',
    'CLOSE_STALL',
    'GO_HOME',
    'RELAX',
    'SLEEP',
    'ALERT',
    'AFRAID',
    'ANGRY',
    'PANIC',
    'FLEEING',
    'RECOVERING',
    'DRINK_WATER',
    'LOOK_AROUND',
  ],
} as const;


export interface NearbyCitizen {
  id: CitizenId;
  name: string;
  distance: number;
  location: string;
  activity: string;
  intention?: string;
  position: [number, number, number];
}

export interface SocialMemoryItem {
  id: string;
  speaker: CitizenId;
  listener: CitizenId;
  content: string;
  location: string;
  importance: number;
  timestamp: string;
}

export type CommunicationType =
  | 'NO_INTERACTION'
  | 'COMMENT'
  | 'CONTINUE_WORKING';

export interface CommunicationDecision {
  shouldCommunicate: boolean;
  type: CommunicationType;
  targetCitizenId?: CitizenId;
  rationale?: string;
}

export interface CitizenState {
  id: CitizenId;
  position: [number, number, number];
  rotationY: number;
  speed: number;
  animState: AnimationState;
  targetLookAt?: [number, number, number] | null;
}

export interface SimulationState {
  activeCitizenId: CitizenId;
  citizens: Record<CitizenId, CitizenState>;
}


