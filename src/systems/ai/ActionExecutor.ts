import { ToolResult, StructuredDecision } from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';
import { toolRegistry } from './ToolRegistry';
import { navigationSystem } from './NavigationSystem';
import { TargetResolver } from './TargetResolver';
import { activityDurationManager } from '../simulation/ActivityDurationManager';
import { worldEventBus } from '../simulation/WorldEventBus';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { agentEventLogger } from '../logging/AgentEventLogger';
import { getSemanticLocationAtPosition } from '../../types/locations';

export class ActionExecutor {
  /**
   * Dispatcher: Validates and executes a structured decision returned by LLM reasoning
   */
  public static executeDecision(
    citizenId: CitizenId,
    decision: StructuredDecision,
    currentPos: [number, number, number]
  ): ToolResult {
    const toolName = decision.tool ? decision.tool.toLowerCase() : 'wait';
    const tool = toolRegistry.getTool(toolName) || toolRegistry.getTool('wait')!;
    const args = decision.arguments || {};
    const startTime = Date.now();
    const decisionId = decision.decision_id || `DEC-${Date.now()}`;
    const locationName = getSemanticLocationAtPosition(currentPos);
    const simState = worldSimulationEngine.getState();
    const simTime = {
      day: simState.time.day,
      hour: simState.time.hour,
      minute: simState.time.minute,
      total_minutes: worldSimulationEngine.getTotalSimulationMinutes(),
    };

    // 0. Log Tool Call event before execution
    console.log(`[TOOL_CALL] agent=${citizenId} decision=${decisionId} tool=${tool.name}`);
    agentEventLogger.logToolCall({
      agentId: citizenId,
      decisionId,
      toolName: tool.name,
      toolArgs: args,
      location: locationName,
      position: currentPos,
      currentGoal: decision.goal || null,
      currentIntention: decision.intention || null,
      simulationTime: simTime,
    });

    // 1. Reality Validation Check
    const validation = tool.validate(citizenId, args, currentPos);
    if (!validation.valid) {
      console.warn(`[TOOL_VALIDATION_FAILED][${citizenId.toUpperCase()}] Tool: ${tool.name}. Reason: ${validation.reason}`);

      worldEventBus.emit('ACTION_FAILED', `${citizenId} failed tool ${tool.name}: ${validation.reason}`, {
        citizenId,
        tool: tool.name,
        reason: validation.reason,
      });

      agentEventLogger.logActionFailed({
        agentId: citizenId,
        decisionId,
        toolName: tool.name,
        reason: validation.reason,
        location: locationName,
        position: currentPos,
        simulationTime: simTime,
      });

      return {
        success: false,
        reason: validation.reason,
      };
    }

    // 2. Dispatch by Capability Category
    switch (tool.category) {
      case 'MOVEMENT': {
        const targetStr = args.location || args.target;
        if (!targetStr || typeof targetStr !== 'string' || targetStr.trim().length === 0) {
          const failureReason = 'MOVE_TO requires an explicit target.';
          worldEventBus.emit('ACTION_FAILED', `${citizenId} failed MOVE_TO: ${failureReason}`, {
            citizenId,
            tool: tool.name,
            reason: failureReason,
          });

          agentEventLogger.logActionFailed({
            agentId: citizenId,
            decisionId,
            toolName: tool.name,
            reason: failureReason,
            location: locationName,
            position: currentPos,
            simulationTime: simTime,
          });

          return {
            success: false,
            reason: failureReason,
          };
        }

        const resolvedTarget = TargetResolver.resolveTarget(targetStr, currentPos, citizenId);
        if (!resolvedTarget) {
          const failureReason = `Unknown destination "${targetStr}". No valid registered world target matches this destination.`;
          console.warn(`[ACTION_EXECUTOR][INVALID_TARGET][${citizenId.toUpperCase()}] ${failureReason}`);

          worldEventBus.emit('ACTION_FAILED', `${citizenId} failed MOVE_TO: ${failureReason}`, {
            citizenId,
            tool: tool.name,
            reason: failureReason,
          });

          agentEventLogger.logActionFailed({
            agentId: citizenId,
            decisionId,
            toolName: tool.name,
            reason: failureReason,
            location: locationName,
            position: currentPos,
            simulationTime: simTime,
          });

          return {
            success: false,
            reason: failureReason,
          };
        }

        // Check if character is ALREADY physically standing at resolvedTarget position
        const dx = resolvedTarget.position[0] - currentPos[0];
        const dz = resolvedTarget.position[2] - currentPos[2];
        const distSq = dx * dx + dz * dz;
        const isCitizenTarget = ['ben', 'julie', 'ravi'].includes(resolvedTarget.locationId);
        const arrivalRadius = isCitizenTarget ? 4.0 : Math.min(3.5, resolvedTarget.interactionRadius);

        if (distSq <= Math.pow(arrivalRadius, 2)) {
          console.log(
            `[ACTION_EXECUTOR][ARRIVED_AT_TARGET][${citizenId.toUpperCase()}] Standing within interaction range (${Math.sqrt(distSq).toFixed(1)}m) of ${resolvedTarget.name}. Arrival complete.`
          );

          agentEventLogger.logMovementCompleted({
            agentId: citizenId,
            decisionId,
            targetLocationId: resolvedTarget.locationId,
            targetName: resolvedTarget.name,
            distanceToTarget: Math.round(Math.sqrt(distSq) * 10) / 10,
            location: locationName,
            position: currentPos,
            simulationTime: simTime,
          });

          return {
            success: true,
            reason: `Arrived at ${resolvedTarget.name}`,
            data: { arrived: true },
          };
        }

        // Check if citizen is ALREADY actively navigating to the same target location
        const currentNav = navigationSystem.getCurrentIntention(citizenId);
        if (currentNav && currentNav.parsedIntent?.target === resolvedTarget.locationId) {
          console.log(`[ACTION_EXECUTOR][DUPLICATE_IGNORED][${citizenId.toUpperCase()}] Already navigating to '${resolvedTarget.locationId}'. Ignoring duplicate request.`);
          return {
            success: true,
            reason: `Already moving toward ${resolvedTarget.locationId}`,
            data: { duplicateIgnored: true },
          };
        }

        const navIntention = {
          id: `NAV-${Date.now()}`,
          intent: decision.speech || decision.intention || `Move to ${targetStr}`,
          targetDescription: targetStr,
          expectedNextAction: decision.expected_next_action,
          parsedIntent: {
            intentionText: decision.speech || decision.intention || `Move to ${targetStr}`,
            rationale: decision.reason || decision.reasoning_summary || 'Locomotion',
            targetDescription: targetStr,
            action: 'GO_TO' as any,
            target: resolvedTarget.locationId,
            rawText: `move_to ${resolvedTarget.locationId}`,
            createdAt: Date.now(),
            decisionId,
          },
          createdAt: Date.now(),
          status: 'EXECUTING' as any,
        };

        const started = navigationSystem.setIntention(navIntention, citizenId, currentPos);
        if (!started) {
          agentEventLogger.logActionFailed({
            agentId: citizenId,
            decisionId,
            toolName: tool.name,
            reason: `Failed to initialize navigation toward ${targetStr}.`,
            location: locationName,
            position: currentPos,
            simulationTime: simTime,
          });

          return {
            success: false,
            reason: `Failed to initialize navigation toward ${targetStr}.`,
          };
        }

        agentEventLogger.logMovementStarted({
          agentId: citizenId,
          decisionId,
          targetLocationId: resolvedTarget.locationId,
          targetName: resolvedTarget.name,
          location: locationName,
          position: currentPos,
          simulationTime: simTime,
        });
        break;
      }
      case 'SURVIVAL':
      case 'WORLD':
      case 'SOCIAL':
      case 'EMOTIONAL':
      case 'OBJECT':
      case 'CONFLICT':
      case 'PERCEPTION':
      case 'IDLE':
      default: {
        // All non-movement activities register a duration in activityDurationManager so they complete cleanly
        const actionType = toolName.toUpperCase() as any;
        const worldState = worldSimulationEngine.getState();
        activityDurationManager.startActivity(
          citizenId,
          actionType,
          args.target || 'self',
          worldSimulationEngine.getTotalSimulationMinutes(),
          worldState.environment.period,
          worldState.time.hour,
          `DEC-${Date.now()}`
        );
        break;
      }
    }

    // 3. Execute World State & System Mutations
    const result = tool.execute(citizenId, args, currentPos);
    const durationMs = Date.now() - startTime;

    console.log(`[TOOL_RESULT] agent=${citizenId} decision=${decisionId} success=${result.success}`);
    agentEventLogger.logToolResult({
      agentId: citizenId,
      decisionId,
      toolName: tool.name,
      success: result.success,
      reason: result.reason,
      data: result.data,
      durationMs,
      location: locationName,
      position: currentPos,
      simulationTime: simTime,
    });

    return result;
  }
}
