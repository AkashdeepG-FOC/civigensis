import {
  AnimationMetadata,
  AnimationFilterOptions,
  AnimationMemoryStats,
  AnimationRegistryData,
} from './types';
import { ANIMATION_MEMORY_DATA } from './animationMemoryData';

export class AnimationMemorySystem {
  private static instance: AnimationMemorySystem;
  private registry: Map<string, AnimationMetadata> = new Map();
  private stats: AnimationMemoryStats;

  private constructor() {
    this.stats = ANIMATION_MEMORY_DATA.stats;
    this.loadInitialData(ANIMATION_MEMORY_DATA);
  }

  public static getInstance(): AnimationMemorySystem {
    if (!AnimationMemorySystem.instance) {
      AnimationMemorySystem.instance = new AnimationMemorySystem();
    }
    return AnimationMemorySystem.instance;
  }

  private loadInitialData(data: AnimationRegistryData): void {
    data.animations.forEach((item) => {
      this.registry.set(item.id, item);
    });
  }

  /**
   * Returns all registered animations in memory
   */
  public getAllAnimations(): AnimationMetadata[] {
    return Array.from(this.registry.values());
  }

  /**
   * Find animation by ID
   */
  public getAnimationById(id: string): AnimationMetadata | undefined {
    return this.registry.get(id);
  }

  /**
   * Search and filter animations based on criteria
   */
  public findAnimations(filter: AnimationFilterOptions): AnimationMetadata[] {
    return this.getAllAnimations().filter((anim) => {
      if (filter.action && !anim.actions.includes(filter.action)) {
        return false;
      }
      if (filter.category && anim.category !== filter.category) {
        return false;
      }
      if (filter.character) {
        const compat = anim.characterCompatibility[filter.character];
        if (!compat || compat === 'INCOMPATIBLE') return false;
      }
      if (filter.state && !anim.states.includes(filter.state)) {
        return false;
      }
      if (filter.status && anim.status !== filter.status) {
        return false;
      }
      if (filter.loop !== undefined && anim.loop !== filter.loop) {
        return false;
      }
      if (filter.rootMotion !== undefined && anim.rootMotion !== filter.rootMotion) {
        return false;
      }
      if (filter.pack && anim.pack.toLowerCase() !== filter.pack.toLowerCase()) {
        return false;
      }
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some((tag) =>
          anim.tags.includes(tag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }
      return true;
    });
  }

  /**
   * Retrieve all animations matching a specific high-level action (e.g. HARVEST_CROP, TALK, GREETING)
   */
  public getAnimationsForAction(action: string, character?: string): AnimationMetadata[] {
    return this.findAnimations({ action, character });
  }

  /**
   * Retrieve variant animations for a given animation ID or action
   */
  public getVariants(actionOrId: string): AnimationMetadata[] {
    const direct = this.getAnimationById(actionOrId);
    if (direct && direct.variants.length > 0) {
      return direct.variants
        .map((vId) => this.getAnimationById(vId))
        .filter((a): a is AnimationMetadata => a !== undefined);
    }
    const forAction = this.getAnimationsForAction(actionOrId);
    return forAction;
  }

  /**
   * Register a new animation dynamically at runtime
   */
  public registerAnimation(metadata: AnimationMetadata): void {
    this.registry.set(metadata.id, metadata);
    this.updateStats();
  }

  /**
   * Update animation usage status at runtime
   */
  public setAnimationStatus(id: string, status: AnimationMetadata['status']): boolean {
    const anim = this.registry.get(id);
    if (!anim) return false;
    anim.status = status;
    this.updateStats();
    return true;
  }

  /**
   * Get registry statistics
   */
  public getStats(): AnimationMemoryStats {
    return { ...this.stats };
  }

  private updateStats(): void {
    const all = this.getAllAnimations();
    const packs = new Set(all.map((a) => a.pack));
    const packBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    const actionBreakdown: Record<string, number> = {};

    let usedCount = 0;
    let unusedCount = 0;

    all.forEach((anim) => {
      packBreakdown[anim.pack] = (packBreakdown[anim.pack] || 0) + 1;
      categoryBreakdown[anim.category] = (categoryBreakdown[anim.category] || 0) + 1;
      anim.actions.forEach((act) => {
        actionBreakdown[act] = (actionBreakdown[act] || 0) + 1;
      });
      if (anim.status === 'AVAILABLE_AND_USED') usedCount++;
      else unusedCount++;
    });

    this.stats = {
      totalAnimations: all.length,
      totalPacks: packs.size,
      packBreakdown,
      categoryBreakdown,
      actionBreakdown,
      usageBreakdown: {
        AVAILABLE_AND_USED: usedCount,
        AVAILABLE_NOT_CURRENTLY_USED: unusedCount,
      },
      scannedAt: new Date().toISOString(),
    };
  }
}

export const AnimationMemory = AnimationMemorySystem.getInstance();
