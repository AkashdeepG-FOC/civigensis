import { StructuredDecision, CitizenIdentity } from '../../types/citizenAgent';
import { CitizenId, CitizenLLMConfig } from '../../types/citizen';
import { BEN_CONFIG, JULIE_CONFIG } from '../../config/citizens';
import { TextSimilarity } from './TextSimilarity';

export class OllamaService {
  private static endpoint: string = 'http://localhost:11434/api/generate';
  private static isConnected: boolean = false;
  private static decisionCounter: number = 0;
  private static availableModels: string[] = [];
  private static lastCheckTime: number = 0;
  private static checkCooldownMs: number = 20000;
  private static requestLock: Promise<void> = Promise.resolve();
  private static lastResponses: Record<string, string> = {};

  public static getIsConnected(): boolean {
    return this.isConnected;
  }

  public static getAvailableModels(): string[] {
    return this.availableModels;
  }

  public static async checkConnection(): Promise<boolean> {
    const now = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.models) && data.models.length > 0) {
          this.availableModels = data.models.map((m: any) => m.name);
        }
      }
      this.isConnected = response.ok;
      this.lastCheckTime = now;
      return this.isConnected;
    } catch {
      this.isConnected = false;
      this.lastCheckTime = now;
      return false;
    }
  }

  /**
   * Strip thinking tags and speaker prefixes
   */
  public static stripThinkTags(rawText: string): string {
    if (!rawText) return '';

    let cleaned = rawText;
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    if (cleaned.includes('<think>')) {
      cleaned = cleaned.split('<think>').pop() || cleaned;
    }
    cleaned = cleaned.replace(/<\/think>/gi, '');
    cleaned = cleaned.replace(/^(?:Ben|Julie)(?:\s+says)?:?\s*/i, '');
    cleaned = cleaned.trim().replace(/^["']|["']$/g, '');

    return cleaned;
  }

  /**
   * Main open-ended autonomous decision prompt generation for CitizenAgent
   */
  public static async generateAutonomousDecision(
    identity: CitizenIdentity,
    locationName: string,
    needsSummary: string[],
    beliefsSummary: string,
    memoriesSummary: string,
    goalSummary: string,
    relationshipSummary: string,
    toolsSummary: string,
    recentEventsSummary: string[],
    loopWarning: string | null,
    lastActionResult: string | null,
    nearbyCitizensSummary: string = '- No citizens nearby.',
    nearbyObjectsSummary: string = '- No special objects nearby.',
    llmConfig?: CitizenLLMConfig,
    attentionSummary: string = '',
    immediateEventSummary: string | null = null
  ): Promise<StructuredDecision | null> {
    const now = Date.now();
    // Connection check with cooldown to prevent repetitive 3s blocking fetches when offline
    if (!this.isConnected) {
      if (now - this.lastCheckTime > this.checkCooldownMs) {
        const isOnline = await this.checkConnection();
        if (!isOnline) {
          return null;
        }
      } else {
        return null;
      }
    }

    // Queue requests to process sequentially on local LLM hardware
    const previousLock = this.requestLock;
    let resolveLock: () => void = () => { };
    this.requestLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    try {
      await previousLock;
      return await this.executeDecisionRequest(
        identity,
        locationName,
        needsSummary,
        beliefsSummary,
        memoriesSummary,
        goalSummary,
        relationshipSummary,
        toolsSummary,
        recentEventsSummary,
        loopWarning,
        lastActionResult,
        nearbyCitizensSummary,
        nearbyObjectsSummary,
        llmConfig,
        attentionSummary,
        immediateEventSummary
      );
    } finally {
      resolveLock();
    }
  }

  private static async executeDecisionRequest(
    identity: CitizenIdentity,
    locationName: string,
    needsSummary: string[],
    beliefsSummary: string,
    memoriesSummary: string,
    goalSummary: string,
    relationshipSummary: string,
    toolsSummary: string,
    recentEventsSummary: string[],
    loopWarning: string | null,
    lastActionResult: string | null,
    nearbyCitizensSummary: string = '- No citizens nearby.',
    nearbyObjectsSummary: string = '- No special objects nearby.',
    llmConfig?: CitizenLLMConfig,
    attentionSummary: string = '',
    immediateEventSummary: string | null = null
  ): Promise<StructuredDecision | null> {
    let config: typeof BEN_CONFIG;
    switch (identity.id) {
      case 'ben':
        config = BEN_CONFIG;
        break;

      case 'julie':
        config = JULIE_CONFIG;
        break;

      default:
        throw new Error(`Unknown citizen ID: ${identity.id}`);
    }

    if (identity.id === 'ben' && llmConfig && llmConfig.model !== BEN_CONFIG.llm.model) {
      console.warn('[AI_CONFIG_MISMATCH] Ben received an invalid model config');
    }

    if (identity.id === 'julie' && llmConfig && llmConfig.model !== JULIE_CONFIG.llm.model) {
      console.warn('[AI_CONFIG_MISMATCH] Julie received an invalid model config');
    }

    const activeLLM = config.llm;
    const targetModel = activeLLM.model;
    const decisionId = `${identity.id}-${Date.now()}-${++this.decisionCounter}`;

    const eventsText = recentEventsSummary.length > 0 ? recentEventsSummary.map((e) => `- ${e}`).join('\n') : '- Quiet in the area.';
    const needsText = needsSummary.map((n) => `- ${n}`).join('\n');
    const loopText = loopWarning ? `\nCRITICAL WARNING: ${loopWarning}\n` : '';
    const lastResultText = lastActionResult ? `\nLAST TOOL RESULT: ${lastActionResult}\n` : '';

    const attentionBlock = attentionSummary
      ? `\nATTENTION LAYER (DETERMINISTIC PRIORITY RANKING):\n${attentionSummary}\n`
      : '';

    const basePrompt = `DECISION INSTANCE:
${decisionId}

You are the autonomous AI brain of EXACTLY ONE citizen.

CHARACTER LOCK

Citizen Name: ${identity.name}
Citizen ID: ${identity.id}
Profession: ${identity.profession}

You MUST make decisions ONLY for ${identity.name}.

You are NOT controlling any other citizen.

Never copy another citizen's:
- goal
- reason
- action
- target
- speech
- memories
- personality
- needs

Your decision must be independently generated from THIS citizen's current state.

Even if another citizen is nearby or has a similar goal, do not automatically copy their behavior.

Two citizens may independently choose the same action only when their own current state logically requires it.

INDEPENDENT DECISION RULE

Do not assume that another citizen has the same needs as you.

Do not repeat another citizen's previous decision.

Do not copy another citizen's speech.

Do not use a generic village-wide decision.

Your decision must be based on your own:
1. needs
2. goals
3. location
4. memories
5. personality
6. inventory
7. relationships
8. observations
9. previous action result

If your state differs from another citizen's state, your decision should normally reflect that difference.

IDENTITY & PERSONALITY:
- Name: ${identity.name} (${identity.id})
- Profession: ${identity.profession}
- Background: ${identity.background}
- Personality: Work Initiative (${identity.personality.workInitiative}), Social (${identity.personality.socialTendency}), Exploration (${identity.personality.explorationTendency}).

CURRENT WORLD STATE:
- Location: ${locationName}
${attentionBlock}${loopText}${lastResultText}
CURRENT MOTIVATIONAL NEEDS:
${needsText}

NEARBY CITIZENS:
${nearbyCitizensSummary}

NEARBY OBJECTS & INVENTORY:
${nearbyObjectsSummary}

CURRENT GOAL STATE:
${goalSummary}

IMPORTANT BELIEFS:
${beliefsSummary}

RELEVANT MEMORIES:
${memoriesSummary}

RELATIONSHIP CONTEXT:
${relationshipSummary}

RECENT EVENTS:
${eventsText}

VALID TARGET LOCATIONS (Choose ONLY from this list):
- village_center (Village Market Square & Stone Well)
- bens_farm (Ben's Wheat Farm & Crop Field)
- julies_farm (Julie's Farm & Bakery Manor)
- river (Village River & Water Basin)
- wheat_field (Ben's Wheat Field)
- market (Market Square)
- well (Stone Well)
- home (Character's House)
- ravis_house (Ravi's Cottage)
- vegetable_stall (Ravi's Stall)

DECISION REQUIREMENTS:
1. First evaluate your current needs, crop conditions, and goals to decide WHY you need to act.
2. Select a meaningful GOAL and a specific REASON.
3. Choose an internal ACTION from: ["GO_TO", "COLLECT_WATER", "WATER_CROP", "HARVEST_CROP", "EAT", "REST", "INSPECT", "TALK", "EXPLORE", "WAIT"].
4. Choose a valid TARGET from the valid locations list above.
5. Choose an EXPECTED_NEXT_ACTION if this action is part of a multi-step task (e.g., if action is GO_TO river, expected_next_action is COLLECT_WATER).
6. Provide a natural, contextual, first-person SPEECH sentence expressing what you are thinking/doing. Do NOT write raw tool names as speech.

Return strictly valid raw JSON format matching this schema:
{
  "goal": "<character-specific goal>",
  "reason": "<character-specific reason>",
  "action": "<valid action>",
  "target": "<valid target>",
  "expected_next_action": "<next action or null>",
  "speech": "<natural first-person sentence>"
}`;

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutMs = 20000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(
        `[AI_REQUEST] citizen=${identity.id} ` +
        `name=${identity.name} ` +
        `model=${activeLLM.model} ` +
        `decisionId=${decisionId}`
      );

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          system: 'You are an autonomous character decision engine. Respond ONLY with valid raw JSON matching the requested schema. Do NOT write <think> tags or extra markdown text.',
          prompt: basePrompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.8,
            top_k: 40,
            top_p: 0.95,
            num_predict: 160,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.isConnected = false;
        this.lastCheckTime = Date.now();
        return null;
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim().length === 0) return null;

      const data: any = JSON.parse(responseText);
      this.isConnected = true;
      this.lastCheckTime = Date.now();
      const rawModelResponse = data?.response || '';

      console.log(
        `[AI_RESPONSE] citizen=${identity.id} ` +
        `model=${activeLLM.model} ` +
        `decisionId=${decisionId} ` +
        `response=${rawModelResponse}`
      );

      const previous = this.lastResponses[identity.id];
      if (previous && TextSimilarity.similarity(previous, rawModelResponse) > 0.95) {
        console.warn(
          `[AI_REPEAT] ${identity.name} generated a highly similar response to its previous decision`
        );
      }
      this.lastResponses[identity.id] = rawModelResponse;

      const cleaned = OllamaService.stripThinkTags(rawModelResponse);

      const parsedJson = JSON.parse(cleaned) as StructuredDecision;
      if (parsedJson && typeof parsedJson === 'object') {
        const actionStr = String(parsedJson.action || parsedJson.tool || 'GO_TO').toUpperCase();
        const targetStr = parsedJson.target || parsedJson.arguments?.location || 'village_center';

        const mappedDecision: StructuredDecision = {
          goal: parsedJson.goal || 'Autonomous village routine',
          reason: parsedJson.reason || parsedJson.reasoning_summary || 'Maintaining village responsibilities',
          action: actionStr,
          target: targetStr,
          expected_next_action: parsedJson.expected_next_action || undefined,
          speech: parsedJson.speech || `Heading to ${targetStr} to work.`,

          // Backward compatibility mappings for internal execution
          tool: actionStr === 'GO_TO' ? 'move_to' : actionStr.toLowerCase(),
          arguments: actionStr === 'GO_TO' ? { location: targetStr } : { target: targetStr },
          reasoning_summary: parsedJson.reason || parsedJson.reasoning_summary || 'Evaluating village needs',
          intention: parsedJson.speech || `Pursuing ${parsedJson.goal}`,
          expected_outcome: `Completed ${actionStr} at ${targetStr}`,
          confidence: 0.85,
        };

        const latencyMs = Date.now() - startTime;
        console.log(`[AI_DECISION][${identity.name.toUpperCase()}][${activeLLM.model}] (${latencyMs}ms) Goal="${mappedDecision.goal}", Action="${mappedDecision.action}", Target="${mappedDecision.target}", Next="${mappedDecision.expected_next_action}"`);
        return mappedDecision;
      }
    } catch (err: any) {
      console.warn(`[AI_DECISION_OFFLINE][${identity.name.toUpperCase()}] Ollama inference timed out or unavailable. Switching to fallback decision engine.`);
      this.isConnected = false;
      this.lastCheckTime = Date.now();
    }

    return null;
  }

  /**
   * Generates dynamic social dialogue
   */
  public static async generateSocialDialogue(
    speakerId: CitizenId,
    listenerId: CitizenId,
    location: string,
    listenerActivity: string,
    llmConfig?: CitizenLLMConfig
  ): Promise<string> {
    return `Working nearby at ${location}`;
  }
}
