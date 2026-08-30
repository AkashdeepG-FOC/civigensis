import {
  CitizenId,
} from '../../types/citizen';
import {
  CitizenIdentity,
  CoreMemory,
  WorkingMemory,
  WorldMemoryFact,
  RecentEventItem,
  EpisodicMemoryItem,
  StructuredDecision,
} from '../../types/citizenAgent';
import { BEN_IDENTITY, JULIE_IDENTITY } from '../../config/citizens';
import { agentEventLogger } from '../logging/AgentEventLogger';


export class MemoryManager {
  private citizenId: CitizenId;
  private coreMemory: CoreMemory;
  private workingMemory: WorkingMemory;
  private worldFacts: Map<string, WorldMemoryFact> = new Map();
  private episodicMemories: EpisodicMemoryItem[] = [];
  private memorySummaries: string[] = [];
  private recentEvents: RecentEventItem[] = [];
  private maxEpisodicCapacity: number = 50;
  private maxRecentEventsCapacity: number = 10;

  constructor(citizenId: CitizenId, identity?: CitizenIdentity) {
    this.citizenId = citizenId;

    const baseIdentity = identity || (citizenId === 'ben' ? BEN_IDENTITY : JULIE_IDENTITY);
    const initialSoulEntries = citizenId === 'ben'
      ? [
          'I believe hard work on the soil builds real community resilience.',
          'Trust is earned through honest actions and evidence, not just talk.',
        ]
      : [
          'Creative craft and community warmth are essential to a living village.',
          'Collaboration and social dialogue lead to sustainable prosperity.',
        ];

    const initialLongTermGoals = citizenId === 'ben'
      ? ['Maintain a high-yield sustainable wheat farm', 'Support village food security']
      : ['Manage a prosperous village bakery', 'Provide fresh baked goods to all citizens'];

    this.coreMemory = {
      agentId: citizenId,
      identity: baseIdentity,
      coreBeliefs: initialSoulEntries,
      longTermGoals: initialLongTermGoals,
    };

    const initialLocation = citizenId === 'ben' ? 'bens_farm' : 'julies_farm';
    const initialGoal = citizenId === 'ben'
      ? 'Manage wheat farm, irrigate crops, and inspect farm buildings'
      : 'Manage village bakery, prepare fresh food, and explore surrounding area';

    this.workingMemory = {
      goal: initialGoal,
      reason: 'Initial citizen role motivation',
      intention: initialGoal,
      immediate_behavior: `Inspect ${initialLocation}`,
      target: initialLocation,
      next: 'Continue daily tasks',
      current_activity: 'idle',
      current_location: initialLocation,
      lastUpdated: new Date().toISOString(),
    };

    // Populate initial world facts
    this.setWorldFact('market_status', 'market', 'Village Center Market', 'open');
    this.setWorldFact('weather_status', 'weather', 'Village Weather', 'clear');

    // Attempt background sync from MongoDB
    this.loadFromMongoDB();
  }

  public getCitizenId(): CitizenId {
    return this.citizenId;
  }

  // --- 1. CORE MEMORY ---
  public getCoreMemory(): CoreMemory {
    return { ...this.coreMemory };
  }

  public addCoreBelief(belief: string): void {
    if (!this.coreMemory.coreBeliefs.includes(belief)) {
      this.coreMemory.coreBeliefs.push(belief);
      this.persistWorkingMemory();
    }
  }

  // --- 2. WORKING MEMORY ---
  public getWorkingMemory(): WorkingMemory {
    return { ...this.workingMemory };
  }

  public updateWorkingMemory(decision: StructuredDecision, locationName?: string): void {
    this.workingMemory = {
      ...this.workingMemory,
      goal: decision.goal || this.workingMemory.goal,
      reason: decision.reason || decision.reasoning_summary || this.workingMemory.reason,
      intention: decision.intention || decision.speech || decision.goal || this.workingMemory.intention,
      immediate_behavior: decision.immediate_behavior || decision.action || this.workingMemory.immediate_behavior,
      target: decision.target || this.workingMemory.target,
      next: decision.next || decision.expected_next_action || 'Re-evaluate situation',
      current_location: locationName || this.workingMemory.current_location,
      lastUpdated: new Date().toISOString(),
    };

    this.persistWorkingMemory();
  }

  public setInterruptedPlan(interruptedPlan: WorkingMemory['interrupted_plan']): void {
    this.workingMemory.interrupted_plan = interruptedPlan;
    this.persistWorkingMemory();
  }

  public clearInterruptedPlan(): void {
    this.workingMemory.interrupted_plan = null;
    this.persistWorkingMemory();
  }

  // --- 3. WORLD MEMORY ---
  public setWorldFact(id: string, category: WorldMemoryFact['category'], fact: string, value?: any): void {
    this.worldFacts.set(id, {
      id,
      category,
      fact,
      value,
      timestamp: new Date().toISOString(),
      lastVerified: new Date().toISOString(),
    });
    agentEventLogger.logWorldStateUpdated({
      agentId: this.citizenId,
      updates: { [id]: { fact, value } },
    });
  }

  public getWorldFact(id: string): WorldMemoryFact | undefined {
    return this.worldFacts.get(id);
  }

  public getAllWorldFacts(): WorldMemoryFact[] {
    return Array.from(this.worldFacts.values());
  }

  // --- 4. EPISODIC MEMORY ---
  public addEpisodicMemory(
    description: string,
    location: string = 'village',
    emotionalImpact: number = 0,
    tags: string[] = []
  ): EpisodicMemoryItem {
    const memory: EpisodicMemoryItem = {
      id: `EPI-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      location,
      description,
      emotionalImpact,
      tags,
    };

    this.episodicMemories.unshift(memory);

    // Consolidate old memories if capacity exceeded
    if (this.episodicMemories.length > this.maxEpisodicCapacity) {
      this.consolidateMemories();
    }

    // Persist to MongoDB
    if (typeof window === 'undefined') {
      import('../../services/database/MongoDBService').then(({ mongoDBService }) => {
        mongoDBService.saveEpisodicMemoryDoc(this.citizenId, memory);
      }).catch(() => {});
    }

    agentEventLogger.logMemoryUpdated({
      agentId: this.citizenId,
      summary: `Episodic memory added: "${description}"`,
    });

    return memory;
  }

  public getRecentEpisodicMemories(limit: number = 5): EpisodicMemoryItem[] {
    return this.episodicMemories.slice(0, limit);
  }

  // --- 5. RECENT EVENTS ---
  public recordRecentEvent(eventText: string, source?: string): void {
    const item: RecentEventItem = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      event: eventText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      source,
    };

    this.recentEvents.unshift(item);
    if (this.recentEvents.length > this.maxRecentEventsCapacity) {
      this.recentEvents.pop();
    }
  }

  public getRecentEvents(): RecentEventItem[] {
    return [...this.recentEvents];
  }

  // --- MEMORY RETRIEVAL & CONTEXT ASSEMBLY ---
  public retrieveRelevantMemories(queryContext?: string, limit: number = 6): string {
    const bullets: string[] = [];

    // Include recent consolidated summaries
    if (this.memorySummaries.length > 0) {
      bullets.push(`- Consolidated Experience: ${this.memorySummaries[0]}`);
    }

    const queryLower = (queryContext || '').toLowerCase();
    const searchTerms = queryLower.split(' ').filter((t) => t.length > 3);

    // Filter relevant episodic memories
    const matches = this.episodicMemories.filter((m) =>
      searchTerms.some((t) => m.description.toLowerCase().includes(t) || m.location.toLowerCase().includes(t))
    );

    const memoriesToUse = matches.length > 0 ? matches.slice(0, limit) : this.episodicMemories.slice(0, limit);

    memoriesToUse.forEach((m) => {
      bullets.push(`- Past Experience [${m.timestamp} at ${m.location}]: "${m.description}"`);
    });

    if (bullets.length === 0) {
      return '- No relevant past experiences found.';
    }

    return bullets.join('\n');
  }

  // --- MEMORY CONSOLIDATION ---
  public consolidateMemories(): void {
    if (this.episodicMemories.length < 5) return;

    const oldestBatch = this.episodicMemories.slice(-10);
    const summaryNarrative =
      `Historical Summary: Citizen experienced standard village activities including ` +
      oldestBatch.map((m) => m.description).join('; ');

    this.memorySummaries.unshift(summaryNarrative);
    if (this.memorySummaries.length > 10) {
      this.memorySummaries.pop();
    }

    // Keep most recent 15 episodic memories
    this.episodicMemories = this.episodicMemories.slice(0, 15);
    console.log(`[MemoryManager][${this.citizenId.toUpperCase()}] Consolidated episodic memories into summary narrative.`);
  }

  public getMemorySummariesPrompt(): string {
    if (this.memorySummaries.length === 0) return '- No consolidated summaries.';
    return this.memorySummaries.map((s) => `- ${s}`).join('\n');
  }

  // --- MONGODB PERSISTENCE ---
  private async persistWorkingMemory(): Promise<void> {
    if (typeof window === 'undefined') {
      try {
        const { mongoDBService } = await import('../../services/database/MongoDBService');
        await mongoDBService.saveWorkingMemory(this.citizenId, this.workingMemory);
      } catch (err) {}
    }
  }

  private async loadFromMongoDB(): Promise<void> {
    if (typeof window === 'undefined') {
      try {
        const { mongoDBService } = await import('../../services/database/MongoDBService');
        const savedWM = await mongoDBService.getWorkingMemory(this.citizenId);
        if (savedWM) {
          this.workingMemory = {
            ...this.workingMemory,
            ...savedWM,
          };
          console.log(`[MemoryManager][${this.citizenId.toUpperCase()}] Restored Working Memory from MongoDB.`);
        }
      } catch (err) {
        console.warn(`[MemoryManager][${this.citizenId.toUpperCase()}] Could not restore memory from MongoDB:`, err);
      }
    }
  }

}
