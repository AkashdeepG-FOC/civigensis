import { AnimationMemory } from './AnimationMemory';
import { AnimationMetadata } from './types';

export interface SelectionContext {
  character: string;
  action: string;
  currentState?: string;
  movementState?: 'IDLE' | 'WALK' | 'RUN';
  preferredPack?: string;
}

export class AnimationSelectorSystem {
  private lastSelectedMap: Map<string, string> = new Map(); // key: `${character}_${action}` -> animationId

  /**
   * Selects the most appropriate animation metadata for a character and action,
   * automatically cycling through variants to prevent repetitive playback.
   */
  public selectAnimationForAction(
    action: string,
    character: string,
    context?: Partial<SelectionContext>
  ): AnimationMetadata | undefined {
    let candidates = AnimationMemory.getAnimationsForAction(action, character);

    if (candidates.length === 0) {
      // Fallback: search by tag or category if exact action match isn't found
      candidates = AnimationMemory.findAnimations({
        tags: [action.toLowerCase()],
        character,
      });
    }

    if (candidates.length === 0) {
      return undefined;
    }

    if (candidates.length === 1) {
      this.recordSelection(character, action, candidates[0].id);
      return candidates[0];
    }

    // Filter candidate list by preferred pack if requested
    if (context?.preferredPack) {
      const packCandidates = candidates.filter(
        (c) => c.pack.toLowerCase() === context.preferredPack!.toLowerCase()
      );
      if (packCandidates.length > 0) {
        candidates = packCandidates;
      }
    }

    // Avoid picking the exact same animation played last time
    const key = `${character}_${action}`;
    const lastId = this.lastSelectedMap.get(key);

    const unusedVariants = candidates.filter((c) => c.id !== lastId);
    const pool = unusedVariants.length > 0 ? unusedVariants : candidates;

    // Pick next variant in round-robin or randomized cycle
    const selected = pool[Math.floor(Math.random() * pool.length)];

    this.recordSelection(character, action, selected.id);
    return selected;
  }

  private recordSelection(character: string, action: string, animId: string): void {
    const key = `${character}_${action}`;
    this.lastSelectedMap.set(key, animId);
  }

  /**
   * Clear selection history cache
   */
  public resetHistory(): void {
    this.lastSelectedMap.clear();
  }
}

export const AnimationSelector = new AnimationSelectorSystem();
