import {
  EpisodicMemoryItem,
  SemanticMemoryItem,
  RelationshipMemoryItem,
  ReflectionMemoryItem,
} from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';

export class MemorySystem {
  private citizenId: CitizenId;
  private episodicMemories: EpisodicMemoryItem[] = [];
  private semanticMemories: SemanticMemoryItem[] = [];
  private relationshipMemories: RelationshipMemoryItem[] = [];
  private reflectionMemories: ReflectionMemoryItem[] = [];
  private maxCapacity: number = 100;

  constructor(citizenId: CitizenId) {
    this.citizenId = citizenId;
  }

  // --- Episodic Memory ---
  public addEpisodicMemory(
    description: string,
    location: string = 'village',
    emotionalImpact: number = 0.0,
    tags: string[] = []
  ): EpisodicMemoryItem {
    const memory: EpisodicMemoryItem = {
      id: `EPI-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      location,
      description,
      emotionalImpact,
      tags,
    };

    this.episodicMemories.unshift(memory);
    if (this.episodicMemories.length > this.maxCapacity) {
      this.episodicMemories.pop();
    }
    return memory;
  }

  // --- Semantic Memory ---
  public addSemanticMemory(fact: string, confidence: number = 0.9, source: string = 'observation'): SemanticMemoryItem {
    const memory: SemanticMemoryItem = {
      id: `SEM-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fact,
      confidence,
      learnedAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      source,
    };

    this.semanticMemories.unshift(memory);
    if (this.semanticMemories.length > this.maxCapacity) {
      this.semanticMemories.pop();
    }
    return memory;
  }

  // --- Relationship Memory ---
  public addRelationshipMemory(
    targetCitizenId: CitizenId,
    experience: string,
    impactOnTrust: number = 0
  ): RelationshipMemoryItem {
    const memory: RelationshipMemoryItem = {
      id: `REL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      targetCitizenId,
      experience,
      impactOnTrust,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };

    this.relationshipMemories.unshift(memory);
    if (this.relationshipMemories.length > this.maxCapacity) {
      this.relationshipMemories.pop();
    }
    return memory;
  }

  // --- Reflection Memory ---
  public addReflectionMemory(
    trigger: string,
    insight: string,
    goalAdjustment?: string
  ): ReflectionMemoryItem {
    const memory: ReflectionMemoryItem = {
      id: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trigger,
      insight,
      goalAdjustment,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
    };

    this.reflectionMemories.unshift(memory);
    if (this.reflectionMemories.length > this.maxCapacity) {
      this.reflectionMemories.pop();
    }
    return memory;
  }

  // --- Contextual Retrieval ---
  public getRecentEpisodicMemories(limit: number = 5): EpisodicMemoryItem[] {
    return this.episodicMemories.slice(0, limit);
  }

  public getRecentReflections(limit: number = 3): ReflectionMemoryItem[] {
    return this.reflectionMemories.slice(0, limit);
  }

  public getRelationshipMemoriesWith(targetCitizenId: CitizenId, limit: number = 4): RelationshipMemoryItem[] {
    return this.relationshipMemories
      .filter((m) => m.targetCitizenId === targetCitizenId)
      .slice(0, limit);
  }

  /**
   * Retrieves contextually relevant memories for current location and keywords
   */
  public getRelevantMemoriesPrompt(currentLocation: string, goalContext?: string, limit: number = 6): string {
    const bullets: string[] = [];

    // 1. Relevant Reflections
    if (this.reflectionMemories.length > 0) {
      const topRef = this.reflectionMemories[0];
      bullets.push(`- Key Insight: "${topRef.insight}" (${topRef.timestamp})`);
    }

    // 2. Relevant Episodic Memories matching location or keywords
    const searchTerms = [currentLocation.toLowerCase(), ...(goalContext ? goalContext.toLowerCase().split(' ') : [])];
    const relevantEpisodic = this.episodicMemories.filter((m) =>
      searchTerms.some((term) => term.length > 3 && (m.description.toLowerCase().includes(term) || m.location.toLowerCase().includes(term)))
    );

    const episodicToUse = relevantEpisodic.length > 0 ? relevantEpisodic.slice(0, limit) : this.episodicMemories.slice(0, 4);

    episodicToUse.forEach((m) => {
      bullets.push(`- Experience [${m.timestamp} at ${m.location}]: "${m.description}"`);
    });

    // 3. Relevant Facts (Semantic)
    if (this.semanticMemories.length > 0) {
      const topSem = this.semanticMemories.slice(0, 2);
      topSem.forEach((s) => bullets.push(`- Known Fact: "${s.fact}"`));
    }

    if (bullets.length === 0) {
      return '- No relevant past memories for this situation.';
    }

    return bullets.join('\n');
  }
}
