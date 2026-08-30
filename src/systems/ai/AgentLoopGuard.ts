export interface LocationHistoryItem {
  location: string;
  timestamp: number;
}

export interface ToolHistoryItem {
  tool: string;
  arguments: Record<string, any>;
  success: boolean;
  timestamp: number;
}

export class AgentLoopGuard {
  private locationHistory: LocationHistoryItem[] = [];
  private toolHistory: ToolHistoryItem[] = [];
  private maxHistory: number = 10;
  private consecutiveSameToolCount: number = 0;
  private consecutiveSameDestCount: number = 0;
  private consecutiveSocialCount: number = 0;

  private static SOCIAL_TOOLS = [
    'talk',
    'respond_to_citizen',
    'ask',
    'compliment',
    'flirt',
    'insult',
    'greet',
    'apologize',
    'forgive',
  ];

  public recordLocation(location: string) {
    const last = this.locationHistory[0];
    if (!last || last.location !== location) {
      this.locationHistory.unshift({ location, timestamp: Date.now() });
      if (this.locationHistory.length > this.maxHistory) {
        this.locationHistory.pop();
      }
    }
  }

  public recordToolCall(tool: string, args: Record<string, any>, success: boolean) {
    const toolLower = (tool || '').toLowerCase();
    const isSocial = AgentLoopGuard.SOCIAL_TOOLS.includes(toolLower);

    const last = this.toolHistory[0];
    const lastToolLower = last ? (last.tool || '').toLowerCase() : '';
    const lastWasSocial = AgentLoopGuard.SOCIAL_TOOLS.includes(lastToolLower);

    if (isSocial && lastWasSocial) {
      this.consecutiveSocialCount++;
    } else if (isSocial) {
      this.consecutiveSocialCount = 1;
    } else {
      this.consecutiveSocialCount = 0;
    }

    if (last && last.tool === tool && JSON.stringify(last.arguments) === JSON.stringify(args)) {
      this.consecutiveSameToolCount++;
    } else {
      this.consecutiveSameToolCount = 1;
    }

    this.toolHistory.unshift({ tool, arguments: args, success, timestamp: Date.now() });
    if (this.toolHistory.length > this.maxHistory) {
      this.toolHistory.pop();
    }
  }

  /**
   * Detects potential oscillations or loops and generates constructive prompt warnings for LLM reasoning
   */
  public checkForLoopWarnings(): string | null {
    // 0. Detect consecutive social dialogue loop
    if (this.consecutiveSocialCount >= 3) {
      return `CONVERSATION LOOP WARNING: You have executed social interaction tools ${this.consecutiveSocialCount} times in a row. You MUST conclude the conversation immediately with a polite farewell in your "speech" (e.g., "I need to get back to work now, see you later!") and choose a NON-SOCIAL action like "GO_TO", "HARVEST_CROP", "EAT", or "REST".`;
    }

    // 1. Detect location oscillation (e.g., A -> B -> A -> B)
    if (this.locationHistory.length >= 4) {
      const loc0 = this.locationHistory[0].location;
      const loc1 = this.locationHistory[1].location;
      const loc2 = this.locationHistory[2].location;
      const loc3 = this.locationHistory[3].location;

      if (loc0 === loc2 && loc1 === loc3 && loc0 !== loc1) {
        return `REPEATED MOVEMENT OSCILLATION DETECTED between "${loc0}" and "${loc1}". You have shuttled back and forth without achieving a new outcome. Please re-evaluate your current goal or change your strategy rather than travelling between these locations again.`;
      }
    }

    // 2. Detect repeated same tool execution failure
    if (this.consecutiveSameToolCount >= 2 && this.toolHistory[0] && !this.toolHistory[0].success) {
      const lastTool = this.toolHistory[0];
      return `REPEATED TOOL FAILURE: Tool "${lastTool.tool}" failed ${this.consecutiveSameToolCount} times in a row. Stop repeating this tool and try a different approach or address the missing prerequisite first.`;
    }

    // 3. Detect consecutive identical tool executions
    if (this.consecutiveSameToolCount >= 3) {
      const lastTool = this.toolHistory[0];
      return `POTENTIAL ACTION STAGNATION: Tool "${lastTool.tool}" executed ${this.consecutiveSameToolCount} consecutive times. Consider whether your goal is completed or if you should shift to a different activity.`;
    }

    return null;
  }

  public reset() {
    this.locationHistory = [];
    this.toolHistory = [];
    this.consecutiveSameToolCount = 0;
    this.consecutiveSameDestCount = 0;
    this.consecutiveSocialCount = 0;
  }
}
