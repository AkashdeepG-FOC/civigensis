import { Belief } from '../../types/citizenAgent';

export class BeliefSystem {
  private beliefs: Map<string, Belief> = new Map();

  constructor(initialBeliefs: string[] = []) {
    initialBeliefs.forEach((stmt, idx) => {
      this.addOrUpdateBelief(stmt, 0.8, 'memory');
    });
  }

  public addOrUpdateBelief(
    statement: string,
    confidence: number = 0.8,
    source: 'observation' | 'conversation' | 'deduction' | 'memory' = 'observation',
    id?: string
  ): Belief {
    const key = id || statement.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 40);
    const existing = this.beliefs.get(key);

    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    const belief: Belief = {
      id: key,
      statement,
      confidence: Math.max(0, Math.min(1.0, confidence)),
      source,
      timestamp: existing ? existing.timestamp : now,
      lastVerified: now,
    };

    this.beliefs.set(key, belief);
    return belief;
  }

  public getBelief(id: string): Belief | undefined {
    return this.beliefs.get(id);
  }

  public getAllBeliefs(): Belief[] {
    return Array.from(this.beliefs.values());
  }

  public getTopBeliefs(limit: number = 5): Belief[] {
    return this.getAllBeliefs()
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  public removeBelief(id: string) {
    this.beliefs.delete(id);
  }

  /**
   * Formats beliefs as context strings for LLM reasoning prompts
   */
  public getBeliefsPromptSummary(limit: number = 5): string {
    const beliefs = this.getTopBeliefs(limit);
    if (beliefs.length === 0) {
      return '- No specific established beliefs yet.';
    }
    return beliefs
      .map(
        (b) =>
          `- "${b.statement}" (Confidence: Math.round(${Math.round(b.confidence * 100)}%), Source: ${b.source}, Verified: ${b.lastVerified})`
      )
      .join('\n');
  }
}
