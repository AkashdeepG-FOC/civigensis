import {
  AgentEvent,
  AgentEventContext,
  AgentEventType,
  DecisionInfo,
  NearbyAgentInfo,
  SimulationTimeInfo,
  Vector3D,
} from '../../types/agentEvent';

export class AgentEventLogger {
  private static instance: AgentEventLogger;

  private constructor() {}

  public static getInstance(): AgentEventLogger {
    if (!AgentEventLogger.instance) {
      AgentEventLogger.instance = new AgentEventLogger();
    }
    return AgentEventLogger.instance;
  }

  /**
   * Centralized log dispatcher.
   * Safe & non-blocking: Never throws, never blocks the caller or crashes the simulation loop.
   */
  public async log(event: AgentEvent): Promise<void> {
    const formattedEvent: AgentEvent = {
      ...event,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      agent_version: event.agent_version || '1.0.0',
    };

    // 1. In browser or Node with fetch, dispatch asynchronously to the /api/events API endpoint
    if (typeof fetch !== 'undefined') {
      try {
        fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedEvent),
        }).catch((err) => {
          console.warn('[AgentEventLogger] Asynchronous fetch log warning:', err?.message || err);
        });
      } catch (err: any) {
        console.warn('[AgentEventLogger] Logging failed non-fatally:', err?.message || err);
      }
      return;
    }

    // 2. In standalone Node script environments, dynamically insert via MongoDBService
    if (typeof window === 'undefined') {
      try {
        const { mongoDBService } = await import('../../services/database/MongoDBService');
        await mongoDBService.insertEvent(formattedEvent);
      } catch (err: any) {
        console.warn('[AgentEventLogger] Direct Node log warning:', err?.message || err);
      }
    }
  }

  /**
   * Helper 1: Log LLM Request
   */
  public logLLMRequest(params: {
    agentId: string;
    agentName?: string;
    decisionId: string;
    model: string;
    prompt: string;
    context: AgentEventContext;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'LLM_REQUEST',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      context: params.context,
      llm: {
        model: params.model,
        prompt: params.prompt,
      },
    };
    this.log(event);
  }

  /**
   * Helper 2: Log LLM Response
   */
  public logLLMResponse(params: {
    agentId: string;
    agentName?: string;
    decisionId: string;
    model: string;
    rawResponse: string;
    responseTimeMs: number;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'LLM_RESPONSE',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      llm: {
        model: params.model,
        raw_response: params.rawResponse,
        response_time_ms: params.responseTimeMs,
      },
    };
    this.log(event);
  }

  /**
   * Helper 3: Log LLM Decision
   */
  public logLLMDecision(params: {
    agentId: string;
    agentName?: string;
    decisionId: string;
    decision: {
      tool?: string;
      arguments?: Record<string, any>;
      intention?: string;
      speech?: string;
      reason?: string | null;
      reasoning_summary?: string | null;
      expected_next_action?: string | null;
      action?: string;
      target?: string | null;
    };
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'LLM_DECISION',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      decision: {
        tool: params.decision.tool || params.decision.action,
        arguments: params.decision.arguments || (params.decision.target ? { location: params.decision.target } : {}),
        intention: params.decision.intention,
        speech: params.decision.speech,
        reason: params.decision.reason !== undefined ? params.decision.reason : null,
        reasoning_summary: params.decision.reasoning_summary !== undefined ? params.decision.reasoning_summary : null,
        expected_next_action: params.decision.expected_next_action !== undefined ? params.decision.expected_next_action : null,
      },
    };
    this.log(event);
  }

  /**
   * Helper 4: Log Tool Call
   */
  public logToolCall(params: {
    agentId: string;
    agentName?: string;
    decisionId?: string;
    toolName: string;
    toolArgs?: Record<string, any>;
    location?: string;
    position?: Vector3D | [number, number, number];
    nearbyAgents?: NearbyAgentInfo[];
    currentGoal?: string | null;
    currentIntention?: string | null;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const event: AgentEvent = {
      event_type: 'TOOL_CALL',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      tool_name: params.toolName,
      tool_args: params.toolArgs,
      location: params.location,
      position: pos,
      nearby_agents: params.nearbyAgents,
      current_goal: params.currentGoal || null,
      current_intention: params.currentIntention || null,
    };
    this.log(event);
  }

  /**
   * Helper 5: Log Tool Result
   */
  public logToolResult(params: {
    agentId: string;
    agentName?: string;
    decisionId?: string;
    toolName: string;
    success: boolean;
    reason: string;
    data?: any;
    durationMs?: number;
    simulationTime?: SimulationTimeInfo;
    location?: string;
    position?: Vector3D | [number, number, number];
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const event: AgentEvent = {
      event_type: 'TOOL_RESULT',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      tool_name: params.toolName,
      tool_response: {
        success: params.success,
        reason: params.reason,
        data: params.data,
      },
      location: params.location,
      position: pos,
      metadata: {
        duration_ms: params.durationMs,
        agent_version: '1.0.0',
      },
    };
    this.log(event);
  }

  /**
   * Helper 6: Log Action Failed
   */
  public logActionFailed(params: {
    agentId: string;
    agentName?: string;
    decisionId?: string;
    toolName?: string;
    reason: string;
    location?: string;
    position?: Vector3D | [number, number, number];
    simulationTime?: SimulationTimeInfo;
    metadata?: Record<string, any>;
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const event: AgentEvent = {
      event_type: 'ACTION_FAILED',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      tool_name: params.toolName,
      tool_response: {
        success: false,
        reason: params.reason,
      },
      location: params.location,
      position: pos,
      metadata: params.metadata,
    };
    this.log(event);
  }

  /**
   * Helper: Log Movement Started
   */
  public logMovementStarted(params: {
    agentId: string;
    agentName?: string;
    decisionId?: string;
    targetLocationId: string;
    targetName?: string;
    location?: string;
    position?: Vector3D | [number, number, number];
    nearbyAgents?: NearbyAgentInfo[];
    simulationTime?: SimulationTimeInfo;
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const isCitizen = ['ben', 'julie', 'ravi'].includes(params.targetLocationId);
    const event: AgentEvent = {
      event_type: 'MOVEMENT_STARTED',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      tool_name: 'move_to',
      target_agent: isCitizen ? params.targetLocationId : null,
      location: params.location,
      position: pos,
      nearby_agents: params.nearbyAgents,
      metadata: {
        target_location_id: params.targetLocationId,
        target_name: params.targetName || params.targetLocationId,
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Movement Completed
   */
  public logMovementCompleted(params: {
    agentId: string;
    agentName?: string;
    decisionId?: string;
    targetLocationId: string;
    targetName?: string;
    distanceToTarget?: number;
    location?: string;
    position?: Vector3D | [number, number, number];
    nearbyAgents?: NearbyAgentInfo[];
    simulationTime?: SimulationTimeInfo;
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const isCitizen = ['ben', 'julie', 'ravi'].includes(params.targetLocationId);
    const event: AgentEvent = {
      event_type: 'MOVEMENT_COMPLETED',
      agent_id: params.agentId,
      agent_name: params.agentName || params.agentId,
      decision_id: params.decisionId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      tool_name: 'move_to',
      target_agent: isCitizen ? params.targetLocationId : null,
      location: params.location,
      position: pos,
      nearby_agents: params.nearbyAgents,
      metadata: {
        target_location_id: params.targetLocationId,
        target_name: params.targetName || params.targetLocationId,
        distance_to_target: params.distanceToTarget,
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Conversation Started
   */
  public logConversationStarted(params: {
    conversationId: string;
    initiator: string;
    targetAgent: string;
    distance: number;
    location?: string;
    topic?: string;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'CONVERSATION_STARTED',
      agent_id: params.initiator,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      target_agent: params.targetAgent,
      location: params.location,
      metadata: {
        conversation_id: params.conversationId,
        initiator: params.initiator,
        distance: params.distance,
        topic: params.topic || 'General conversation',
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Conversation Message
   */
  public logConversationMessage(params: {
    conversationId: string;
    speaker: string;
    targetAgent: string;
    message: string;
    turn: number;
    location?: string;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'CONVERSATION_MESSAGE',
      agent_id: params.speaker,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      target_agent: params.targetAgent,
      location: params.location,
      metadata: {
        conversation_id: params.conversationId,
        speaker: params.speaker,
        message: params.message,
        turn: params.turn,
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Conversation Completed
   */
  public logConversationCompleted(params: {
    conversationId: string;
    participants: string[];
    topic?: string;
    turnCount: number;
    summary?: string;
    reason?: string;
    location?: string;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'CONVERSATION_COMPLETED',
      agent_id: params.participants[0] || 'system',
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      location: params.location,
      metadata: {
        conversation_id: params.conversationId,
        participants: params.participants,
        topic: params.topic,
        turn_count: params.turnCount,
        summary: params.summary,
        reason: params.reason || 'Conversation finished naturally',
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Memory Created
   */
  public logMemory(params: {
    agentId: string;
    memoryType: 'episodic' | 'semantic' | 'relationship' | 'reflection' | string;
    summary: string;
    participants?: string[];
    importance?: number;
    simulationTime?: SimulationTimeInfo;
    location?: string;
    position?: Vector3D | [number, number, number];
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const event: AgentEvent = {
      event_type: 'MEMORY_CREATED',
      agent_id: params.agentId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      location: params.location,
      position: pos,
      metadata: {
        memory_type: params.memoryType,
        summary: params.summary,
        participants: params.participants || [],
        importance: params.importance || 1,
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Relationship Updated
   */
  public logRelationshipUpdate(params: {
    agentId: string;
    targetAgent: string;
    previousValues?: Record<string, any>;
    newValues: Record<string, any>;
    reason?: string;
    simulationTime?: SimulationTimeInfo;
  }): void {
    const event: AgentEvent = {
      event_type: 'RELATIONSHIP_UPDATED',
      agent_id: params.agentId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      target_agent: params.targetAgent,
      metadata: {
        previous_values: params.previousValues,
        new_values: params.newValues,
        reason: params.reason || 'Social interaction update',
      },
    };
    this.log(event);
  }

  /**
   * Helper: Log Perception Snapshot
   */
  public logPerception(params: {
    agentId: string;
    location?: string;
    position?: Vector3D | [number, number, number];
    nearbyAgents?: NearbyAgentInfo[];
    weather?: string;
    temperature?: number;
    simulationTime?: SimulationTimeInfo;
    metadata?: Record<string, any>;
  }): void {
    const pos: Vector3D | undefined = Array.isArray(params.position)
      ? { x: params.position[0], y: params.position[1], z: params.position[2] }
      : params.position;

    const event: AgentEvent = {
      event_type: 'PERCEPTION',
      agent_id: params.agentId,
      timestamp: new Date(),
      simulation_time: params.simulationTime,
      location: params.location,
      position: pos,
      nearby_agents: params.nearbyAgents,
      current_weather: params.weather || null,
      temperature: params.temperature || null,
      metadata: params.metadata,
    };
    this.log(event);
  }
}

export const agentEventLogger = AgentEventLogger.getInstance();
