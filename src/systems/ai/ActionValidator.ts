import { CitizenId } from '../../types/citizen';
import { toolRegistry } from './ToolRegistry';
import { simulationEngine } from '../simulation/SimulationEngine';
import { farmingWorldState } from './FarmingWorldState';
import { CITIZEN_INTERACTION_RANGE, PHYSICAL_INTIMATE_RANGE } from './InteractionConstants';

export class ActionValidator {
  /**
   * Validates tool execution requirements against current world and physical state
   */
  public static validateAction(
    citizenId: CitizenId,
    toolName: string,
    args: Record<string, any>,
    currentPos: [number, number, number]
  ): { valid: boolean; reason: string } {
    const tool = toolRegistry.getTool(toolName.toLowerCase());
    if (!tool) {
      return { valid: false, reason: `Unknown or unregistered tool "${toolName}"` };
    }

    // 1. Specific Tool Validation Check
    const toolVal = tool.validate(citizenId, args, currentPos);
    if (!toolVal.valid) {
      return toolVal;
    }

    // 2. Resource Validation Checks
    const tLower = toolName.toLowerCase();
    if (tLower === 'water_crops') {
      const buckets = farmingWorldState.getNeeds(citizenId).waterBucket;
      if (buckets <= 0) {
        return { valid: false, reason: 'Water bucket is empty. Collect water at river first.' };
      }
    } else if (tLower === 'eat') {
      const stock = farmingWorldState.getNeeds(citizenId).foodStock;
      if (stock <= 0) {
        return { valid: false, reason: 'Food stock is depleted.' };
      }
    }

    return { valid: true, reason: 'Action is physically valid' };
  }
}
