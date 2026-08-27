export type BenAction =
  | 'GO_TO'
  | 'COLLECT_WATER'
  | 'WATER_CROP'
  | 'HARVEST_CROP'
  | 'EAT'
  | 'REST'
  | 'INSPECT'
  | 'OBSERVE'
  | 'TALK'
  | 'RESPOND_TO_CITIZEN'
  | 'TALK_TO'
  | 'ASK'
  | 'HELP'
  | 'EXPLORE'
  | 'REPAIR'
  | 'WAIT';

export interface ParsedIntent {
  intentionText: string;
  rationale: string;
  targetDescription: string;
  action: BenAction;
  target: string;
  rawText: string;
  createdAt: number;
}

const PHYSICAL_CAPABILITIES: Set<string> = new Set<string>([
  'GO_TO',
  'COLLECT_WATER',
  'WATER_CROP',
  'HARVEST_CROP',
  'EAT',
  'REST',
  'INSPECT',
  'OBSERVE',
  'TALK',
  'RESPOND_TO_CITIZEN',
  'TALK_TO',
  'ASK',
  'HELP',
  'EXPLORE',
  'REPAIR',
  'WAIT',
]);

export class IntentParser {
  /**
   * Intention Interpreter:
   * Parses LLM open-ended JSON output to extract:
   * - Natural language intention
   * - Rationale / motivation
   * - Open target description (e.g. "my farm", "unfamiliar structure in northern woods")
   * - Physical capability step(s) required for execution (GO_TO, INSPECT, etc.)
   *
   * Crucially:
   * 1. Does NOT use hardcoded keyword switch statements ("if 'water' in text -> WATER").
   * 2. Does NOT constrain targetDescription to a closed target enum.
   */
  public static parse(rawText: string): ParsedIntent | null {
    if (!rawText || typeof rawText !== 'string') {
      return null;
    }

    let cleaned = rawText.trim();

    // 1. Clean think tags if present
    if (cleaned.includes('<think>')) {
      if (cleaned.includes('</think>')) {
        cleaned = cleaned.split('</think>').pop()?.trim() || cleaned;
      } else {
        const jsonMatch = cleaned.match(/\{[\s\S]*?\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
      }
    }

    // 2. Remove markdown code fences
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    }

    // 3. Extract JSON substring if surrounded by text
    if (!cleaned.startsWith('{')) {
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Extract natural intention text
    const intentionText =
      typeof parsed.intention === 'string'
        ? parsed.intention
        : typeof parsed.goal === 'string'
          ? parsed.goal
          : 'Autonomous Intention';

    const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : 'Contextual motivation';

    // Extract open target description (can be ANY string describing an object, entity, or location)
    const targetDescription =
      typeof parsed.targetDescription === 'string'
        ? parsed.targetDescription
        : typeof parsed.target === 'string'
          ? parsed.target
          : typeof parsed.location === 'string'
            ? parsed.location
            : 'surrounding area';

    // Extract physical execution capability primitive
    const capabilityObj = parsed.capability && typeof parsed.capability === 'object' ? parsed.capability : parsed;
    let action: BenAction = 'INSPECT';

    if (typeof capabilityObj.action === 'string' && PHYSICAL_CAPABILITIES.has(capabilityObj.action.toUpperCase())) {
      action = capabilityObj.action.toUpperCase() as BenAction;
    } else if (typeof parsed.action === 'string' && PHYSICAL_CAPABILITIES.has(parsed.action.toUpperCase())) {
      action = parsed.action.toUpperCase() as BenAction;
    } else {
      // Default physical capability primitive is observation / locomotion (INSPECT or GO_TO)
      action = 'INSPECT';
    }

    const target = typeof capabilityObj.target === 'string' ? capabilityObj.target : targetDescription;

    return {
      intentionText,
      rationale,
      targetDescription,
      action,
      target,
      rawText: cleaned,
      createdAt: Date.now(),
    };
  }

  /**
   * Intention Interpreter for Multi-Step Plans:
   * Extracts open goal intention, rationale, targetDescription, and capability execution steps.
   */
  public static parsePlan(
    rawText: string
  ): {
    goal: string;
    rationale: string;
    targetDescription: string;
    plan: { step: number; action: BenAction; target: string | null; targetDescription?: string }[];
  } | null {
    const single = this.parse(rawText);
    if (!single) {
      if (!rawText || typeof rawText !== 'string') return null;
      let cleaned = rawText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }
      try {
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === 'object') {
          const goal = typeof parsed.goal === 'string' ? parsed.goal : typeof parsed.intention === 'string' ? parsed.intention : 'Autonomous Intention';
          const rationale = typeof parsed.rationale === 'string' ? parsed.rationale : 'Contextual motivation';
          const targetDescription = typeof parsed.targetDescription === 'string' ? parsed.targetDescription : 'surrounding area';

          const steps: { step: number; action: BenAction; target: string | null; targetDescription?: string }[] = [];
          if (Array.isArray(parsed.plan) && parsed.plan.length > 0) {
            parsed.plan.forEach((p: any, idx: number) => {
              const act = typeof p?.action === 'string' && PHYSICAL_CAPABILITIES.has(p.action.toUpperCase())
                ? (p.action.toUpperCase() as BenAction)
                : 'INSPECT';
              steps.push({
                step: p.step || idx + 1,
                action: act,
                target: typeof p.target === 'string' ? p.target : targetDescription,
                targetDescription: typeof p.targetDescription === 'string' ? p.targetDescription : targetDescription,
              });
            });
          }

          if (steps.length === 0) {
            steps.push({ step: 1, action: 'INSPECT', target: targetDescription, targetDescription });
          }

          return { goal, rationale, targetDescription, plan: steps };
        }
      } catch {
        return null;
      }
      return null;
    }

    return {
      goal: single.intentionText,
      rationale: single.rationale,
      targetDescription: single.targetDescription,
      plan: [
        {
          step: 1,
          action: single.action,
          target: single.target,
          targetDescription: single.targetDescription,
        },
      ],
    };
  }
}


