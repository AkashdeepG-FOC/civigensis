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
   * Strip thinking tags, markdown code blocks, speaker prefixes, and extract JSON substring
   */
  public static stripThinkTags(rawText: string): string {
    if (!rawText) return '';

    let cleaned = rawText;
    // 1. Remove thinking tags <think>...</think>
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
    if (cleaned.includes('<think>')) {
      cleaned = cleaned.split('<think>').pop() || cleaned;
    }
    cleaned = cleaned.replace(/<\/think>/gi, '');

    // 2. Remove markdown code fence blocks like ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1');

    // 3. Remove speaker prefixes like "Ben says:"
    cleaned = cleaned.replace(/^(?:Ben|Julie|Ravi)(?:\s+says)?:?\s*/i, '');
    cleaned = cleaned.trim().replace(/^["']|["']$/g, '');

    // 4. Extract outer JSON object if extra conversational text surrounds it
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned;
  }

  /**
   * Attempt JSON parsing with automatic repair heuristics for truncated/trailing-comma JSON outputs
   */
  public static tryParseOrRepairJson(cleaned: string): StructuredDecision | null {
    try {
      return JSON.parse(cleaned) as StructuredDecision;
    } catch (e1) {
      // Repair 1: Remove trailing commas before closing braces/brackets
      let repaired = cleaned.replace(/,\s*([\}\]])/g, '$1');
      try {
        return JSON.parse(repaired) as StructuredDecision;
      } catch (e2) {
        // Repair 2: If unclosed string/object due to truncation, append closing quotes/braces
        let testRep = repaired.trim();
        if (!testRep.endsWith('}')) {
          if (testRep.endsWith('"')) {
            testRep += '}';
          } else {
            testRep += '"}';
          }
          try {
            return JSON.parse(testRep) as StructuredDecision;
          } catch (e3) {}
        }
        return null;
      }
    }
  }

  public static async generateAutonomousDecisionWithContext(
    coreMemory: any,
    workingMemory: any,
    worldFacts: any[],
    relevantMemoriesText: string,
    recentEvents: any[],
    newEventText: string,
    locationName: string,
    decisionId: string
  ): Promise<StructuredDecision | null> {
    const identity = coreMemory.identity;
    const targetModel = this.availableModels[0] || 'qwen2.5:latest';

    const soulText = (coreMemory.coreBeliefs || []).map((b: string) => `- CORE BELIEF: "${b}"`).join('\n');
    const worldFactsText = worldFacts.map((f) => `- WORLD FACT [${f.category}]: ${f.fact} = ${JSON.stringify(f.value || '')}`).join('\n');
    const recentEventsText = recentEvents.map((e) => `- ${e.event} (${e.timestamp})`).join('\n');

    const prompt = `DECISION INSTANCE: ${decisionId}
You are the autonomous AI brain of ${identity.name}, ${identity.profession} in the village of CiviGenis.
You MUST think, reason, and act strictly as ${identity.name} based on your personal traits, background, current working memory, world facts, and memories.

CORE MEMORY (IDENTITY & EXISTENTIAL BELIEFS):
- Name: ${identity.name} (${identity.id})
- Profession: ${identity.profession}
- Background: ${identity.background}
${soulText}

WORKING MEMORY (CURRENT ACTIVE SITUATION):
- Goal: ${workingMemory.goal}
- Reason: ${workingMemory.reason}
- Intention: ${workingMemory.intention}
- Immediate Behavior: ${workingMemory.immediate_behavior}
- Target: ${workingMemory.target}
- Expected Next Behavior: ${workingMemory.next}
- Location: ${locationName}

AUTHORITATIVE WORLD FACTS:
${worldFactsText || '- No special world facts.'}

RELEVANT EPISODIC MEMORIES:
${relevantMemoriesText}

RECENT EVENTS HISTORY:
${recentEventsText || '- No recent events.'}

*** NEW TRIGGER EVENT ***
"${newEventText}"

DECISION INSTRUCTIONS:
Describe what ${identity.name} naturally wants to do in response to this event while maintaining behavioral continuity.
Do NOT restrict yourself to a fixed list of actions. Express your immediate behavior naturally in plain English.

Return strictly raw JSON format matching this schema:
{
  "goal": "<overarching goal>",
  "reason": "<reasoning for this decision>",
  "intention": "<active intention>",
  "immediate_behavior": "<natural language description of immediate action>",
  "target": "<target location or citizen>",
  "next": "<expected next behavior>",
  "speech": "<natural first-person spoken sentence>"
}`;

    const startTime = Date.now();
    console.log(`[LLM_REQUEST_SENT][${identity.name.toUpperCase()}] Model: ${targetModel}, DecisionId: ${decisionId}`);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: targetModel,
          system: 'You are an autonomous character decision engine. Respond ONLY with valid raw JSON matching the requested schema. Do NOT write <think> tags or extra text.',
          prompt,
          format: 'json',
          stream: false,
          options: { temperature: 0.7, num_predict: 512 },
        }),
      });

      const responseTimeMs = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const rawResponse = OllamaService.stripThinkTags(data?.response || '');
        const parsed = OllamaService.tryParseOrRepairJson(rawResponse);
        if (parsed) {
          return {
            decision_id: decisionId,
            goal: parsed.goal || workingMemory.goal,
            reason: parsed.reason || parsed.reasoning_summary,
            intention: parsed.intention || parsed.speech || parsed.goal,
            immediate_behavior: parsed.immediate_behavior || parsed.action || 'Continue current task',
            target: parsed.target || workingMemory.target,
            next: parsed.next || parsed.expected_next_action || 'Re-evaluate next step',
            speech: parsed.speech || parsed.intention,
          };
        }
      }
    } catch (err) {
      console.warn(`[OllamaService][${identity.name.toUpperCase()}] LLM fetch failed for event: "${newEventText}"`, err);
    }

    return null;
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
    immediateEventSummary: string | null = null,
    soulEntriesSummary: string = '- No explicit soul entries.',
    memorySummaries: string = '- No consolidated summaries.'
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
        immediateEventSummary,
        soulEntriesSummary,
        memorySummaries
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
    immediateEventSummary: string | null = null,
    soulEntriesSummary: string = '- No explicit soul entries.',
    memorySummaries: string = '- No consolidated summaries.'
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
    const immediateEventBlock = immediateEventSummary
      ? immediateEventSummary.includes('Requires Response: NO')
        ? `\n*** CONVERSATION CONCLUDED ***\n${immediateEventSummary}\nYour conversation session has reached its turn limit. You MUST conclude the chat now! Say a polite farewell in your "speech" (e.g. "I have to get back to my work now, see you later!") and select a NON-SOCIAL action (such as "GO_TO", "HARVEST_CROP", "EAT", "REST"). Do NOT select TALK or RESPOND_TO_CITIZEN.\n`
        : `\n*** INCOMING CONVERSATION MESSAGE ***\n${immediateEventSummary}\nAnother citizen has directly spoken to you! You can choose action "TALK" or "RESPOND_TO_CITIZEN" to reply, OR if you feel the conversation is complete or have pressing work/survival needs, choose another action (such as "GO_TO", "HARVEST_CROP", "EAT", "REST") and say a polite farewell in your "speech" (e.g. "I have to get back to work now, see you later!").\n`
      : '';

    const basePrompt = `DECISION INSTANCE: ${decisionId}
You are the autonomous AI brain of ${identity.name}, a citizen in the village of CiviGenis.
You MUST think, reason, and act strictly as ${identity.name} based on your personal traits, background, current motivational needs, and past memories.

SOUL ENTRIES (EXISTENTIAL CORE CONVICTIONS - NEVER ERSED):
${soulEntriesSummary}

IDENTITY & PERSONALITY:
- Name: ${identity.name} (${identity.id})
- Profession: ${identity.profession}
- Background: ${identity.background}
- Personality: Work Initiative (${identity.personality.workInitiative}), Social (${identity.personality.socialTendency}), Exploration (${identity.personality.explorationTendency}).

CURRENT WORLD STATE:
- Location: ${locationName}
${immediateEventBlock}${attentionBlock}${loopText}${lastResultText}
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

LONG-TERM CONSOLIDATED MEMORY SUMMARIES:
${memorySummaries}

RELATIONSHIP CONTEXT:
${relationshipSummary}

AVAILABLE UNCONSTRAINED TOOLS:
${toolsSummary}

RECENT EVENTS:
${eventsText}

VALID TARGET LOCATIONS / CITIZENS (Choose ONLY from this list):
- ben (Ben - Citizen)
- julie (Julie - Citizen)
- ravi (Ravi - Citizen)
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
3. Choose an internal ACTION from: ["GO_TO", "TALK", "RESPOND_TO_CITIZEN", "COLLECT_WATER", "WATER_CROP", "HARVEST_CROP", "EAT", "REST", "INSPECT", "EXPLORE", "WAIT", "ADD_SOUL_ENTRY", "SELF_CARE", "WRITE_JOURNAL_ENTRY", "PROPOSE_COMMUNITY_RULE", "VOTE_ON_RULE", "PROPOSE_TRADE"].
4. Choose a valid TARGET from the valid targets list above (use citizen name "ben" or "julie" if talking to a citizen).
5. Choose an EXPECTED_NEXT_ACTION if this action is part of a multi-step task (e.g., if action is GO_TO river, expected_next_action is COLLECT_WATER).
6. Provide a natural, contextual, first-person SPEECH sentence expressing what you are thinking/doing or saying. Do NOT write raw tool names as speech.

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
      const timeoutMs = 60000; // Increased to 60s to prevent prematurely aborting slow local reasoning models like DeepSeek-R1
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(`[STAGE 1: LLM_REQUEST_SENT][${identity.name.toUpperCase()}] Model: ${targetModel}, DecisionId: ${decisionId}`);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: targetModel,
          system: 'You are an autonomous character decision engine. Respond ONLY with valid raw JSON matching the requested schema. Do NOT write <think> tags or extra text.',
          prompt: basePrompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.7,
            top_k: 40,
            top_p: 0.95,
            num_predict: 512, // Increased to 512 tokens to prevent mid-JSON string truncation
          },
        }),
      });

      clearTimeout(timeoutId);
      responseTimeMs = Date.now() - startTime;

      if (!response.ok) {
        console.warn(`[STAGE 2: LLM_RESPONSE_HTTP_ERROR][${identity.name.toUpperCase()}] HTTP ${response.status} ${response.statusText}`);
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
      const isAbort = err?.name === 'AbortError' || String(err).includes('aborted');
      const errReason = isAbort
        ? `LLM Request timed out after 60s (${err?.message || err})`
        : `Ollama fetch failed: ${err?.message || err}`;

      console.warn(`[STAGE 2: LLM_FETCH_FAILED][${identity.name.toUpperCase()}] ${errReason}`);
      this.isConnected = false;
      this.lastCheckTime = Date.now();

      agentEventLogger.logActionFailed({
        agentId: identity.id,
        agentName: identity.name,
        decisionId,
        reason: errReason,
        location: locationName,
        simulationTime: simTime,
      });

      return null;
    }

    // 2. ALWAYS SAVE LLM_RESPONSE IMMEDIATELY WHEN RAW RESPONSE IS RECEIVED
    console.log(`[STAGE 2: LLM_RESPONSE_RECEIVED][${identity.name.toUpperCase()}] DecisionId: ${decisionId}, Time: ${responseTimeMs}ms, Length: ${rawModelResponse.length} chars`);

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
      const parsedJson = OllamaService.tryParseOrRepairJson(cleaned);

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
          arguments: (() => {
            const toolLower = actionStr === 'GO_TO' ? 'move_to' : actionStr.toLowerCase();
            const argsObj: Record<string, any> = actionStr === 'GO_TO' ? { location: targetStr } : { target: targetStr };
            if (['talk', 'respond_to_citizen', 'ask', 'greet', 'compliment', 'flirt'].includes(toolLower)) {
              argsObj.message = parsedJson.speech || parsedJson.intention || `Interacting with ${targetStr}`;
            }
            return argsObj;
          })(),
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
