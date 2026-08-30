import { StructuredDecision } from '../../types/citizenAgent';
import { TargetResolver } from './TargetResolver';

export interface ResolvedBehavior {
  tool: string;
  arguments: Record<string, any>;
  target: string;
  isMovementRequired: boolean;
  resolvedLocation: string;
}

export class BehaviorResolver {
  /**
   * Resolves open-ended natural language immediate_behavior into executable simulation parameters
   */
  public static resolve(
    decision: StructuredDecision,
    currentLocation: string
  ): ResolvedBehavior {
    const behaviorText = (decision.immediate_behavior || '').toLowerCase();
    const targetText = (decision.target || '').toLowerCase();
    const goalText = (decision.goal || '').toLowerCase();
    const intentionText = (decision.intention || decision.speech || '').toLowerCase();

    const combinedText = `${behaviorText} ${targetText} ${goalText} ${intentionText}`;

    // 1. Identify Target Location or Citizen
    let target = decision.target || 'village_center';
    let resolvedLocation = currentLocation;

    const resolvedTargetObj = TargetResolver.resolveTarget(target) || TargetResolver.resolveTarget(behaviorText);
    if (resolvedTargetObj) {
      target = resolvedTargetObj.locationId;
      resolvedLocation = resolvedTargetObj.locationId;
    }

    // 2. Classify Capability / Tool from Natural Language Intent or explicit decision fields
    let tool = (decision.tool || decision.action || '').toLowerCase();
    let isMovementRequired = false;
    const args: Record<string, any> = { ...decision.arguments, target, location: target };

    // If decision did not provide an explicit tool or tool is generic, classify from text
    if (!tool || tool === 'wait' || tool === 'go_to') {
      if (
        behaviorText.includes('go to') ||
        behaviorText.includes('head to') ||
        behaviorText.includes('travel') ||
        behaviorText.includes('move to') ||
        behaviorText.includes('return to') ||
        behaviorText.includes('walk to') ||
        behaviorText.includes('take the bread to') ||
        behaviorText.includes('cover the bread and move')
      ) {
        tool = 'move_to';
        args.location = target;
        isMovementRequired = true;
      }
      // Social / Dialogue Intent
      else if (
        behaviorText.includes('talk') ||
        behaviorText.includes('speak') ||
        behaviorText.includes('ask') ||
        behaviorText.includes('tell') ||
        behaviorText.includes('greet') ||
        behaviorText.includes('converse')
      ) {
        tool = 'talk';
        args.target = target.includes('ben') ? 'ben' : target.includes('julie') ? 'julie' : target;
        args.message = decision.speech || decision.intention || decision.immediate_behavior;
      }
      // Farming Work Intent
      else if (combinedText.includes('harvest')) {
        tool = 'harvest_crops';
        args.location = 'bens_farm';
      } else if (combinedText.includes('water crop') || combinedText.includes('irrigate')) {
        tool = 'water_crops';
        args.location = 'bens_farm';
      } else if (combinedText.includes('collect water') || combinedText.includes('fetch water')) {
        tool = 'collect_water';
        args.location = 'river';
      }
      // Survival / Rest Intent
      else if (combinedText.includes('eat') || combinedText.includes('meal') || combinedText.includes('food')) {
        tool = 'eat';
      } else if (combinedText.includes('rest') || combinedText.includes('sleep') || combinedText.includes('nap')) {
        tool = 'rest';
      }
      // Inspection / Exploration Intent
      else if (combinedText.includes('inspect') || combinedText.includes('check')) {
        tool = 'inspect';
      } else if (combinedText.includes('explore') || combinedText.includes('patrol')) {
        tool = 'explore';
      } else {
        tool = 'wait';
      }
    }

    if (tool === 'move_to' || tool === 'go_to') {
      isMovementRequired = true;
    }

    return {
      tool,
      arguments: args,
      target,
      isMovementRequired,
      resolvedLocation,
    };
  }
}
