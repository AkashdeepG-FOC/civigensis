export type AgentEventType =
  | 'PERCEPTION'
  | 'LLM_REQUEST'
  | 'LLM_RESPONSE'
  | 'LLM_DECISION'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'ACTION_STARTED'
  | 'ACTION_COMPLETED'
  | 'ACTION_FAILED'
  | 'MOVEMENT_STARTED'
  | 'MOVEMENT_COMPLETED'
  | 'CONVERSATION_STARTED'
  | 'CONVERSATION_MESSAGE'
  | 'CONVERSATION_COMPLETED'
  | 'STATE_UPDATE'
  | 'MEMORY_CREATED'
  | 'RELATIONSHIP_UPDATED';

export interface SimulationTimeInfo {
  day?: number;
  hour?: number;
  minute?: number;
  total_minutes?: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface NearbyAgentInfo {
  agent_id: string;
  distance: number;
}

export interface DecisionInfo {
  tool?: string;
  arguments?: Record<string, any>;
  intention?: string;
  speech?: string;
  reason?: string | null;
  reasoning_summary?: string | null;
  expected_next_action?: string | null;
  action?: string;
  target?: string | null;
}

export interface AgentEventContext {
  current_goal?: string | null;
  current_intention?: string | null;
  current_activity?: string | null;
  needs?: {
    hunger?: number;
    energy?: number;
    thirst?: number;
    curiosity?: number;
    social?: number;
    achievement?: number;
    [key: string]: number | undefined;
  };
  position?: Vector3D;
  location?: string;
  nearby_agents?: NearbyAgentInfo[];
  relevant_world_state?: Record<string, any>;
  relevant_memories?: string[];
  environment?: Record<string, any>;
}

export interface AgentEventLLMInfo {
  model?: string;
  prompt?: string;
  raw_response?: string;
  response_time_ms?: number;
}

export interface AgentEvent {
  _id?: string;
  decision_id?: string;
  agent_id: string;
  agent_name?: string;
  agent_version?: string;

  timestamp: Date | string;

  simulation_time?: SimulationTimeInfo;

  event_type: AgentEventType | string;

  tool_name?: string;
  target_agent?: string | null;

  tool_args?: Record<string, any>;
  tool_response?: {
    success?: boolean;
    reason?: string;
    data?: any;
  };

  location?: string;

  position?: Vector3D;

  nearby_agents?: NearbyAgentInfo[];

  current_weather?: string | null;
  temperature?: number | null;

  current_goal?: string | null;
  current_intention?: string | null;

  decision?: DecisionInfo;

  context?: AgentEventContext;

  llm?: AgentEventLLMInfo;

  metadata?: Record<string, any>;
}
