export type AnimationCategory =
  | 'FARMING'
  | 'INJURED'
  | 'LOCOMOTION'
  | 'SOCIAL'
  | 'SURVIVAL'
  | 'INTERACTION'
  | 'SWIMMING'
  | 'TRANSITION'
  | 'GENERAL';

export type LoopType = 'LOOP' | 'ONE_SHOT' | 'TRANSITION';

export type CompatibilityLevel =
  | 'DIRECTLY_COMPATIBLE'
  | 'REQUIRES_RETARGETING'
  | 'INCOMPATIBLE'
  | 'UNKNOWN';

export interface CharacterCompatibility {
  Ben: CompatibilityLevel;
  Julie: CompatibilityLevel;
  NPC: CompatibilityLevel;
  [key: string]: CompatibilityLevel;
}

export type AnimationUsageStatus =
  | 'AVAILABLE_AND_USED'
  | 'AVAILABLE_NOT_CURRENTLY_USED';

export interface AnimationMetadata {
  id: string;
  file: string; // Path relative to public/assets/animations/
  name: string;
  pack: string;
  category: AnimationCategory;
  description: string;
  actions: string[];
  states: string[];
  loop: boolean;
  loopType: LoopType;
  rootMotion: boolean;
  duration: number; // in seconds
  fps: number;
  trackCount: number;
  boneCount: number;
  skeleton: string;
  compatibleCharacters: string[];
  characterCompatibility: CharacterCompatibility;
  tags: string[];
  status: AnimationUsageStatus;
  variants: string[]; // IDs of variant animations
}

export interface AnimationFilterOptions {
  action?: string;
  category?: AnimationCategory;
  character?: string;
  state?: string;
  tags?: string[];
  status?: AnimationUsageStatus;
  loop?: boolean;
  rootMotion?: boolean;
  pack?: string;
}

export interface AnimationMemoryStats {
  totalAnimations: number;
  totalPacks: number;
  packBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  actionBreakdown: Record<string, number>;
  usageBreakdown: Record<AnimationUsageStatus, number>;
  scannedAt: string;
}

export interface AnimationRegistryData {
  version: string;
  stats: AnimationMemoryStats;
  animations: AnimationMetadata[];
}
