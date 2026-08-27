import { CitizenMemory, EpisodicMemory, ExperienceRecord } from '../../types/benAI';
import { CitizenId, SocialMemoryItem } from '../../types/citizen';

export class CitizenMemorySystem {
  private citizenId: CitizenId;
  private memory: CitizenMemory;

  constructor(citizenId: CitizenId) {
    this.citizenId = citizenId;
    const isBen = citizenId === 'ben';

    this.memory = {
      identity: isBen
        ? [
            'Ben is an independent farmer in CiviGenis.',
            'Ben lives in his cottage in the village.',
            'Ben works on the wheat farm and shares the world with Julie.',
          ]
        : [
            'Julie is an independent farmer in CiviGenis.',
            'Julie lives in her manor in the village.',
            'Julie works on the wheat farm and shares the world with Ben.',
          ],
      worldKnowledge: [
        'Knows the village center.',
        'Knows the wheat farm and fields.',
        'Knows the northern river.',
        'Knows home and surrounding structures.',
      ],
      episodicMemories: [
        {
          id: `init-${citizenId}-1`,
          timestamp: '06:00:00',
          description: `${isBen ? 'Ben' : 'Julie'} woke up in the village.`,
        },
      ],
      experiences: [],
      socialMemories: [],
    };
  }

  public getCitizenId(): CitizenId {
    return this.citizenId;
  }

  public getMemory(): CitizenMemory {
    return this.memory;
  }

  public getIdentity(): string[] {
    return this.memory.identity;
  }

  public getWorldKnowledge(): string[] {
    return this.memory.worldKnowledge;
  }

  public getRecentEpisodicMemories(limit: number = 5): EpisodicMemory[] {
    return this.memory.episodicMemories.slice(-limit);
  }

  public addEpisodicMemory(description: string, timestamp: string = ''): EpisodicMemory {
    const memoryItem: EpisodicMemory = {
      id: `mem-${this.citizenId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      description,
    };

    this.memory.episodicMemories.push(memoryItem);

    if (this.memory.episodicMemories.length > 50) {
      this.memory.episodicMemories.shift();
    }

    return memoryItem;
  }

  public addExperienceRecord(
    intention: string,
    targetDescription: string,
    outcome: 'COMPLETED' | 'REJECTED' | 'INVALIDATED' | 'FAILED',
    reason: string,
    timestamp: string = ''
  ): ExperienceRecord {
    const exp: ExperienceRecord = {
      id: `exp-${this.citizenId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      intention,
      targetDescription,
      outcome,
      reason,
    };

    this.memory.experiences.push(exp);

    if (this.memory.experiences.length > 50) {
      this.memory.experiences.shift();
    }

    console.log(`[AI][EXPERIENCE RECORDED] [${this.citizenId.toUpperCase()}] [${outcome}] Intention: "${intention}" | Reason: "${reason}"`);
    return exp;
  }

  public getRecentExperiences(limit: number = 5): ExperienceRecord[] {
    return this.memory.experiences.slice(-limit);
  }

  public addSocialMemory(
    speaker: CitizenId,
    listener: CitizenId,
    content: string,
    location: string,
    importance: number = 0.5
  ): SocialMemoryItem {
    const item: SocialMemoryItem = {
      id: `soc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      speaker,
      listener,
      content,
      location,
      importance,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.memory.socialMemories.push(item);
    if (this.memory.socialMemories.length > 30) {
      this.memory.socialMemories.shift();
    }

    console.log(`[SOCIAL MEMORY] [${this.citizenId.toUpperCase()}] Stored: "${content}"`);
    return item;
  }

  public getRecentSocialMemories(limit: number = 5): SocialMemoryItem[] {
    return this.memory.socialMemories.slice(-limit);
  }

  public getFormattedExperiencesForPrompt(limit: number = 4): string {
    const recent = this.getRecentExperiences(limit);
    if (recent.length === 0) return '- No previous attempts recorded.';

    return recent
      .map((e) => {
        const statusStr = e.outcome === 'COMPLETED' ? 'SUCCESS' : `FAILED (${e.outcome})`;
        return `- [${e.timestamp}] Intention: "${e.intention}" -> Outcome: ${statusStr}. Reason: ${e.reason}`;
      })
      .join('\n');
  }

  public getFormattedSocialMemoriesForPrompt(limit: number = 3): string {
    const recent = this.getRecentSocialMemories(limit);
    if (recent.length === 0) return '- No social interactions recorded.';

    return recent
      .map((s) => {
        const other = s.speaker === this.citizenId ? s.listener : s.speaker;
        const otherName = other === 'ben' ? 'Ben' : 'Julie';
        if (s.speaker === this.citizenId) {
          return `- [${s.timestamp}] I told ${otherName}: "${s.content}" (Location: ${s.location})`;
        } else {
          return `- [${s.timestamp}] ${otherName} told me: "${s.content}" (Location: ${s.location})`;
        }
      })
      .join('\n');
  }
}

// Registry holding isolated memory systems per citizen ID
const memoryRegistry: Record<CitizenId, CitizenMemorySystem> = {
  ben: new CitizenMemorySystem('ben'),
  julie: new CitizenMemorySystem('julie'),
  ravi: new CitizenMemorySystem('ravi'),
};

export function getCitizenMemorySystem(citizenId: CitizenId): CitizenMemorySystem {
  if (!memoryRegistry[citizenId]) {
    memoryRegistry[citizenId] = new CitizenMemorySystem(citizenId);
  }
  return memoryRegistry[citizenId];
}

// Backward compatibility export for legacy references
export const benMemorySystem = getCitizenMemorySystem('ben');
export const julieMemorySystem = getCitizenMemorySystem('julie');
