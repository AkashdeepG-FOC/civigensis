import { StructuredDecision, CitizenIdentity } from '../../types/citizenAgent';
import { CitizenId, CitizenLLMConfig } from '../../types/citizen';
import { BEN_CONFIG, JULIE_CONFIG } from '../../config/citizens';
import { TextSimilarity } from './TextSimilarity';
import { navigationSystem } from './NavigationSystem';
import { activityDurationManager } from '../simulation/ActivityDurationManager';
import { agentEventLogger } from '../logging/AgentEventLogger';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';

export class OllamaService {
  private static endpoint: string = 'http://localhost:11434/api/generate';
  private static isConnected: boolean = false;
  private static decisionCounter: number = 0;
  private static availableModels: string[] = [];
  private static lastCheckTime: number = 0;
  private static checkCooldownMs: number = 10000;
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
        this.availableModels = (data.models || []).map((m: any) => m.name || m.model);
        this.isConnected = true;
        this.lastCheckTime = now;
        return true;
      }
    } catch {
      this.isConnected = false;
      this.lastCheckTime = now;
    }
    return false;
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

    // Check connection if offline or cooldown elapsed
    if (!this.isConnected && (now - this.lastCheckTime > this.checkCooldownMs || this.lastCheckTime === 0)) {
      const isOnline = await this.checkConnection();
      if (!isOnline) {
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

      // Queue Guard: Check if the citizen started executing an action while this request was waiting in queue
      const isNavigating = navigationSystem.getCurrentIntention(identity.id) !== null;
      const isActivityActive = activityDurationManager.isActivityActive(identity.id);
      if (isNavigating || isActivityActive) {
        console.log(`[OLLAMA_QUEUE_GUARD][${identity.name.toUpperCase()}] Aborting queued LLM request: Action became active while queued.`);
        return null;
      }

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
    const decisionId = `DEC-${Date.now()}-${++this.decisionCounter}`;
    const activeLLM = llmConfig || (identity.id === 'ben' ? BEN_CONFIG.llm : JULIE_CONFIG.llm);

    // Pick active available model or fallback to config model
    const targetModel =
      this.availableModels.length > 0 && llmConfig?.model && this.availableModels.includes(llmConfig.model)
        ? llmConfig.model
        : this.availableModels[0] || activeLLM.model || 'qwen2.5:latest';

    const needsText = needsSummary.join('\n');
    const eventsText = recentEventsSummary.length > 0 ? recentEventsSummary.join('\n') : '- No recent unusual events.';
    const loopText = loopWarning ? `\nCRITICAL LOOP WARNING: ${loopWarning}\nDo NOT repeat recent failed actions!\n` : '';
    const lastResultText = lastActionResult ? `\nLAST ACTION RESULT: ${lastActionResult}\n` : '';
    const attentionBlock = attentionSummary ? `\nATTENTION FOCUS:\n${attentionSummary}\n` : '';

    const basePrompt = `DECISION INSTANCE: ${decisionId}
You are the autonomous AI brain of ${identity.name}, a citizen in the village of CiviGenis.
You MUST think, reason, and act strictly as ${identity.name} based on your personal traits, background, current motivational needs, and past memories.
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
    const simState = worldSimulationEngine.getState();
    const simTime = {
      day: simState.time.day,
      hour: simState.time.hour,
      minute: simState.time.minute,
      total_minutes: worldSimulationEngine.getTotalSimulationMinutes(),
    };

    console.log(`[LLM_REQUEST] agent=${identity.id} decision=${decisionId}`);

    // 1. Save LLM_REQUEST with exact prompt and context
    agentEventLogger.logLLMRequest({
      agentId: identity.id,
      agentName: identity.name,
      decisionId,
      model: targetModel,
      prompt: basePrompt,
      simulationTime: simTime,
      context: {
        current_goal: goalSummary,
        current_intention: attentionSummary || goalSummary,
        current_activity: locationName,
        location: locationName,
        relevant_world_state: {
          recent_events: recentEventsSummary,
          beliefs: beliefsSummary,
          relationships: relationshipSummary,
          attention: attentionSummary,
          immediate_event: immediateEventSummary,
        },
        relevant_memories: memoriesSummary ? memoriesSummary.split('\n') : [],
        environment: {
          nearby_citizens: nearbyCitizensSummary,
          nearby_objects: nearbyObjectsSummary,
          available_tools: toolsSummary,
          loop_warning: loopWarning,
          last_action_result: lastActionResult,
        },
      },
    });

    let rawModelResponse = '';
    let responseTimeMs = 0;

    try {
      const controller = new AbortController();
      const timeoutMs = 25000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        console.warn(`[OLLAMA_HTTP_ERROR] HTTP ${response.status} ${response.statusText}`);
        this.isConnected = false;
        this.lastCheckTime = Date.now();

        agentEventLogger.logActionFailed({
          agentId: identity.id,
          agentName: identity.name,
          decisionId,
          reason: `Ollama HTTP Error: ${response.status} ${response.statusText}`,
          location: locationName,
          simulationTime: simTime,
        });

        return null;
      }

      const responseText = await response.text();
      this.isConnected = true;
      this.lastCheckTime = Date.now();

      if (responseText && responseText.trim().length > 0) {
        try {
          const data = JSON.parse(responseText);
          rawModelResponse = data?.response || responseText;
        } catch {
          rawModelResponse = responseText;
        }
      }
    } catch (err: any) {
      responseTimeMs = Date.now() - startTime;
      console.warn(`[OLLAMA_FETCH_FAILED] ${err?.message || err}`);
      this.isConnected = false;
      this.lastCheckTime = Date.now();

      agentEventLogger.logActionFailed({
        agentId: identity.id,
        agentName: identity.name,
        decisionId,
        reason: `Ollama fetch failed: ${err?.message || err}`,
        location: locationName,
        simulationTime: simTime,
      });

      return null;
    }

    // 2. ALWAYS SAVE LLM_RESPONSE IMMEDIATELY WHEN RAW RESPONSE IS RECEIVED
    console.log(`[LLM_RESPONSE] agent=${identity.id} decision=${decisionId}`);
    console.log(`[LLM_RESPONSE] raw_length=${rawModelResponse.length}`);

    agentEventLogger.logLLMResponse({
      agentId: identity.id,
      agentName: identity.name,
      decisionId,
      model: targetModel,
      rawResponse: rawModelResponse,
      responseTimeMs,
      simulationTime: simTime,
    });

    // 3. PARSE RESPONSE INTO STRUCTURED DECISION
    try {
      const cleaned = OllamaService.stripThinkTags(rawModelResponse);
      const parsedJson = JSON.parse(cleaned) as StructuredDecision;

      if (parsedJson && typeof parsedJson === 'object') {
        const actionStr = String(parsedJson.action || parsedJson.tool || 'GO_TO').toUpperCase();
        const targetStr = parsedJson.target || parsedJson.arguments?.location || 'village_center';

        const mappedDecision: StructuredDecision = {
          decision_id: decisionId,
          goal: parsedJson.goal || 'Autonomous village routine',
          reason: parsedJson.reason || parsedJson.reasoning_summary || undefined,
          action: actionStr,
          target: targetStr,
          expected_next_action: parsedJson.expected_next_action || undefined,
          speech: parsedJson.speech || `Heading to ${targetStr} to work.`,

          // Backward compatibility mappings for internal execution
          tool: actionStr === 'GO_TO' ? 'move_to' : actionStr.toLowerCase(),
          arguments: actionStr === 'GO_TO' ? { location: targetStr } : { target: targetStr },
          reasoning_summary: parsedJson.reason || parsedJson.reasoning_summary || undefined,
          intention: parsedJson.speech || `Pursuing ${parsedJson.goal}`,
          expected_outcome: `Completed ${actionStr} at ${targetStr}`,
          confidence: 0.85,
        };

        console.log(`[LLM_DECISION] agent=${identity.id} decision=${decisionId} tool=${mappedDecision.tool}`);

        // 4. SAVE LLM_DECISION
        agentEventLogger.logLLMDecision({
          agentId: identity.id,
          agentName: identity.name,
          decisionId,
          decision: {
            tool: mappedDecision.tool,
            arguments: mappedDecision.arguments,
            intention: mappedDecision.intention,
            speech: mappedDecision.speech,
            reason: parsedJson.reason !== undefined ? parsedJson.reason : null,
            reasoning_summary: parsedJson.reasoning_summary !== undefined ? parsedJson.reasoning_summary : null,
            expected_next_action: parsedJson.expected_next_action !== undefined ? parsedJson.expected_next_action : null,
            action: mappedDecision.action,
            target: mappedDecision.target,
          },
          simulationTime: simTime,
        });

        return mappedDecision;
      }
    } catch (parseErr: any) {
      console.warn(`[LLM_PARSE_ERROR] Failed to parse JSON response for decision ${decisionId}: ${parseErr?.message}`);

      agentEventLogger.logActionFailed({
        agentId: identity.id,
        agentName: identity.name,
        decisionId,
        reason: `JSON parsing failed: ${parseErr?.message}`,
        location: locationName,
        simulationTime: simTime,
      });
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
    const speakerConfig = speakerId === 'ben' ? BEN_CONFIG : JULIE_CONFIG;
    const activeLLM = llmConfig || speakerConfig.llm;
    const targetModel =
      this.availableModels.length > 0 && llmConfig?.model && this.availableModels.includes(llmConfig.model)
        ? llmConfig.model
        : this.availableModels[0] || activeLLM.model || 'qwen2.5:latest';

    const prompt = `You are ${speakerId.toUpperCase()}, a citizen in CiviGenis.
You are currently at ${location} talking to ${listenerId.toUpperCase()} who is currently ${listenerActivity}.
Generate ONE single line of realistic, natural dialogue to say to ${listenerId.toUpperCase()}.
Do NOT include quotation marks around your dialogue. Do NOT include your name prefix.`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          prompt,
          stream: false,
          options: { temperature: 0.8, num_predict: 60 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return OllamaService.stripThinkTags(data?.response || '');
      }
    } catch {
      // Fallback dialogue
    }

    return speakerId === 'ben'
      ? `Good day, ${listenerId.toUpperCase()}! The crops are growing well today.`
      : `Hello, ${listenerId.toUpperCase()}! I'm preparing fresh bread for the village.`;
  }
}
