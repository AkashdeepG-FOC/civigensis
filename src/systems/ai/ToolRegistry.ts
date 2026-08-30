import { ToolCategory, ToolResult } from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';
import { farmingWorldState } from './FarmingWorldState';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { getSemanticLocationAtPosition } from '../../types/locations';
import { socialInteractionSystem } from './SocialInteractionSystem';
import { objectInteractionSystem } from './ObjectInteractionSystem';
import { conflictSystem } from './ConflictSystem';
import { TargetResolver } from './TargetResolver';


export type ToolValidator = (
  citizenId: CitizenId,
  args: Record<string, any>,
  currentPos: [number, number, number]
) => { valid: boolean; reason: string };

export type ToolHandler = (
  citizenId: CitizenId,
  args: Record<string, any>,
  currentPos: [number, number, number]
) => ToolResult;

export interface RegisteredTool {
  name: string;
  category: ToolCategory;
  description: string;
  argumentsSchema: string;
  validate: ToolValidator;
  execute: ToolHandler;
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, RegisteredTool> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public registerTool(tool: RegisteredTool) {
    this.tools.set(tool.name.toLowerCase(), tool);
  }

  public getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name.toLowerCase());
  }

  public getAllTools(): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsPromptSummary(): string {
    return Array.from(this.tools.values())
      .map((t) => `- "${t.name}" (${t.category}): ${t.description}. Arguments: ${t.argumentsSchema}`)
      .join('\n');
  }

  private registerDefaultTools() {
    // ==========================================
    // 1. MOVEMENT CAPABILITIES
    // ==========================================
this.registerTool({
  name: 'move_to',
  category: 'MOVEMENT',

  description:
    'Move to an explicitly specified semantic location or citizen. ' +
    'The target must be provided by the decision system. ' +
    'This capability starts navigation; physical arrival is handled by the navigation/action system.',

  argumentsSchema:
    '{"location": "explicit_target_location_or_citizen"}',

  validate: (citizenId, args, currentPos) => {
    // --------------------------------------------------
    // NEVER INVENT A TARGET
    // --------------------------------------------------
    const target = args?.location ?? args?.target;

    if (!target || typeof target !== 'string' || target.trim().length === 0) {
      return {
        valid: false,
        reason: 'MOVE_TO requires an explicit target. No destination was provided.',
      };
    }

    const normalizedTarget = target.trim().toLowerCase();

    // --------------------------------------------------
    // DON'T ALLOW MOVING TO SELF
    // --------------------------------------------------
    if (
      (citizenId === 'ben' && normalizedTarget === 'ben') ||
      (citizenId === 'julie' && normalizedTarget === 'julie')
    ) {
      return {
        valid: false,
        reason: 'Citizen cannot move to their own position as a target.',
      };
    }

    // --------------------------------------------------
    // VALIDATE TARGET RESOLUTION
    // --------------------------------------------------
    if (!TargetResolver.isValidTarget(target)) {
      return {
        valid: false,
        reason: `Unknown or unresolvable movement target "${target}".`,
      };
    }

    return {
      valid: true,
      reason: `Movement target "${normalizedTarget}" is valid.`,
    };
  },

  execute: (citizenId, args) => {
    const target = args?.location ?? args?.target;

    // This should never happen because validate() runs first.
    // Keep the guard anyway.
    if (!target || typeof target !== 'string') {
      return {
        success: false,
        reason: 'Movement failed: no target was supplied.',
        memoryDescription: 'Attempted movement without a valid destination.',
      };
    }

    const destination = target.trim().toLowerCase();

    // IMPORTANT:
    //
    // This does NOT claim that the citizen has arrived.
    // It only reports that the navigation request was accepted.
    //
    // ActionExecutor / NavigationSystem must keep the action
    // in EXECUTING state until physical arrival.

    return {
      success: true,
      reason: `Navigation request accepted for ${destination}. Awaiting physical arrival.`,
      memoryDescription: undefined,
      timeSpentMinutes: 0,
    };
  },
});

    this.registerTool({
      name: 'explore',
      category: 'MOVEMENT',
      description: 'Wander and explore an area to inspect environment and discover opportunities',
      argumentsSchema: '{"area": "area_description_string"}',
      validate: () => ({ valid: true, reason: 'Area valid.' }),
      execute: (citizenId, args) => ({
        success: true,
        reason: `Exploring area: ${args.area || 'surrounding area'}`,
        memoryDescription: `Explored ${args.area || 'surrounding area'}`,
        timeSpentMinutes: 0.2,
      }),
    });

    this.registerTool({
      name: 'follow',
      category: 'MOVEMENT',
      description: 'Follow another citizen as they move around the village',
      argumentsSchema: '{"target": "citizen_id_string"}',
      validate: (citizenId, args, currentPos) => socialInteractionSystem.validateSocialInteraction(citizenId, 'follow', args, currentPos),
      execute: (citizenId, args) => {
        const otherId = args.target || (citizenId === 'ben' ? 'julie' : 'ben');
        return {
          success: true,
          reason: `Began following ${otherId}`,
          memoryDescription: `Followed ${otherId}`,
          timeSpentMinutes: 0.2,
        };
      },
    });

    this.registerTool({
      name: 'flee',
      category: 'MOVEMENT',
      description: 'Flee quickly away from threat, danger, or confrontation',
      argumentsSchema: '{"from": "threat_description_or_citizen"}',
      validate: () => ({ valid: true, reason: 'Can flee anytime.' }),
      execute: (citizenId, args, currentPos) => conflictSystem.executeConflict(citizenId, 'flee', args, currentPos),
    });

    this.registerTool({
      name: 'approach',
      category: 'MOVEMENT',
      description: 'Approach a citizen or object to get closer before interacting',
      argumentsSchema: '{"target": "target_name_string"}',
      validate: () => ({ valid: true, reason: 'Valid approach target.' }),
      execute: (citizenId, args) => ({
        success: true,
        reason: `Approached ${args.target || 'target'}`,
        memoryDescription: `Approached ${args.target || 'target'}`,
      }),
    });

    // ==========================================
    // 2. PERCEPTION CAPABILITIES
    // ==========================================
    this.registerTool({
      name: 'observe',
      category: 'PERCEPTION',
      description: 'Pause and observe immediate surroundings, weather, or citizen activity',
      argumentsSchema: '{}',
      validate: () => ({ valid: true, reason: 'Always valid.' }),
      execute: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        const world = worldSimulationEngine.getState();
        return {
          success: true,
          reason: `Observed ${loc}. Weather: ${world.weather.type}, Temp: ${world.weather.temperature}°C, Rain: ${world.weather.rainRate}mm/min.`,
          memoryDescription: `Observed surroundings at ${loc}`,
          timeSpentMinutes: 0.1,
        };
      },
    });

    this.registerTool({
      name: 'inspect',
      category: 'PERCEPTION',
      description: 'Inspect a specific object, crop field, building, or inventory item in detail',
      argumentsSchema: '{"target": "target_name_string"}',
      validate: (citizenId, args) => {
        if (!args || !args.target) args.target = 'surrounding area';
        return { valid: true, reason: 'Valid inspection target.' };
      },
      execute: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        return {
          success: true,
          reason: `Inspected ${args.target} at ${loc}.`,
          memoryDescription: `Inspected ${args.target} at ${loc}`,
          timeSpentMinutes: 0.1,
        };
      },
    });

    this.registerTool({
      name: 'watch',
      category: 'PERCEPTION',
      description: 'Quietly watch another citizen or activity from a distance',
      argumentsSchema: '{"target": "citizen_or_object_string"}',
      validate: () => ({ valid: true, reason: 'Always valid.' }),
      execute: (citizenId, args) => ({
        success: true,
        reason: `Watching ${args.target || 'surroundings'}`,
        memoryDescription: `Watched ${args.target || 'surroundings'}`,
        timeSpentMinutes: 0.1,
      }),
    });

    this.registerTool({
      name: 'listen',
      category: 'PERCEPTION',
      description: 'Listen closely to ambient sounds or conversations in the area',
      argumentsSchema: '{}',
      validate: () => ({ valid: true, reason: 'Always valid.' }),
      execute: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        return {
          success: true,
          reason: `Listened quietly at ${loc}. Heard ambient sounds of village.`,
          memoryDescription: `Listened at ${loc}`,
          timeSpentMinutes: 0.1,
        };
      },
    });

    // ==========================================
    // 3. SOCIAL CAPABILITIES
    // ==========================================
    const socialActions = ['talk', 'respond_to_citizen', 'ask', 'greet', 'help', 'invite', 'trade'];
    socialActions.forEach((act) => {
      this.registerTool({
        name: act,
        category: 'SOCIAL',
        description: `Perform ${act} with a nearby citizen`,
        argumentsSchema: '{"target": "citizen_id", "message": "speech_text"}',
        validate: (citizenId, args, currentPos) => socialInteractionSystem.validateSocialInteraction(citizenId, act, args, currentPos),
        execute: (citizenId, args, currentPos) => socialInteractionSystem.executeSocialInteraction(citizenId, act, args, currentPos),
      });
    });

    // ==========================================
    // 4. EMOTIONAL / RELATIONSHIP CAPABILITIES
    // ==========================================
    const emotionalActions = ['compliment', 'insult', 'apologize', 'forgive', 'flirt', 'hug', 'kiss', 'reject', 'avoid'];
    emotionalActions.forEach((act) => {
      this.registerTool({
        name: act,
        category: 'EMOTIONAL',
        description: `Express ${act} towards another citizen`,
        argumentsSchema: '{"target": "citizen_id", "reason": "reason_string"}',
        validate: (citizenId, args, currentPos) => socialInteractionSystem.validateSocialInteraction(citizenId, act, args, currentPos),
        execute: (citizenId, args, currentPos) => socialInteractionSystem.executeSocialInteraction(citizenId, act, args, currentPos),
      });
    });

    // ==========================================
    // 5. CONFLICT CAPABILITIES
    // ==========================================
    const conflictActions = ['confront', 'argue', 'fight', 'defend', 'threaten'];
    conflictActions.forEach((act) => {
      this.registerTool({
        name: act,
        category: 'CONFLICT',
        description: `Engage in ${act} against another citizen`,
        argumentsSchema: '{"target": "citizen_id", "reason": "conflict_reason"}',
        validate: (citizenId, args, currentPos) => conflictSystem.validateConflict(citizenId, act, args, currentPos),
        execute: (citizenId, args, currentPos) => conflictSystem.executeConflict(citizenId, act, args, currentPos),
      });
    });

    // ==========================================
    // 6. OBJECT / WORLD INTERACTION CAPABILITIES
    // ==========================================
    const objectActions = ['pick_up', 'drop', 'give', 'take', 'steal', 'use', 'open', 'close', 'build'];
    objectActions.forEach((act) => {
      this.registerTool({
        name: act,
        category: 'OBJECT',
        description: `Perform ${act} on a world item, object, or citizen inventory`,
        argumentsSchema: '{"target": "item_or_citizen", "item": "item_id"}',
        validate: (citizenId, args, currentPos) => objectInteractionSystem.validateObjectInteraction(citizenId, act, args, currentPos),
        execute: (citizenId, args, currentPos) => objectInteractionSystem.executeObjectInteraction(citizenId, act, args, currentPos),
      });
    });

    // ==========================================
    // 7. SURVIVAL CAPABILITIES (Preserved)
    // ==========================================
    this.registerTool({
      name: 'eat',
      category: 'SURVIVAL',
      description: 'Consume food from inventory to satisfy hunger and restore energy',
      argumentsSchema: '{}',
      validate: (citizenId) => {
        const needs = farmingWorldState.getNeeds(citizenId);
        if (needs.foodStock <= 0) {
          return { valid: false, reason: 'No food stock available in inventory.' };
        }
        return { valid: true, reason: 'Food available.' };
      },
      execute: (citizenId) => {
        const res = farmingWorldState.eatFood(citizenId);
        return {
          success: res.success,
          reason: res.reason,
          memoryDescription: res.success ? 'Ate food to satisfy hunger' : 'Attempted to eat but had no food',
          timeSpentMinutes: 0.2,
        };
      },
    });

    this.registerTool({
      name: 'rest',
      category: 'SURVIVAL',
      description: 'Rest or sleep to recover energy',
      argumentsSchema: '{}',
      validate: () => ({ valid: true, reason: 'Can rest anytime.' }),
      execute: (citizenId) => {
        farmingWorldState.restAtHome(citizenId);
        return {
          success: true,
          reason: 'Rested and recovered energy',
          memoryDescription: 'Rested to recover energy',
          timeSpentMinutes: 0.3,
        };
      },
    });

    // ==========================================
    // 8. WORLD & FARMING CAPABILITIES (Preserved)
    // ==========================================
    this.registerTool({
      name: 'collect_water',
      category: 'WORLD',
      description: 'Fill water buckets at the river basin',
      argumentsSchema: '{}',
      validate: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        if (loc !== 'river') {
          return { valid: false, reason: `Must be at river to collect water (currently at ${loc}).` };
        }
        if (!farmingWorldState.river.waterAvailable) {
          return { valid: false, reason: 'River is dry or unavailable.' };
        }
        return { valid: true, reason: 'River available.' };
      },
      execute: (citizenId) => {
        const ok = farmingWorldState.collectWaterFromRiver(citizenId);
        return {
          success: ok,
          reason: ok ? 'Collected water buckets from river' : 'Failed to collect water from dry river',
          memoryDescription: ok ? 'Filled water buckets at river' : 'River water collection failed',
          timeSpentMinutes: 0.2,
        };
      },
    });

    this.registerTool({
      name: 'water_crops',
      category: 'WORLD',
      description: 'Irrigate wheat crops using carried water buckets',
      argumentsSchema: '{}',
      validate: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        if (loc !== 'wheat' && loc !== 'bens_farm') {
          return { valid: false, reason: `Must be at the farm to water crops (currently at ${loc}).` };
        }
        const needs = farmingWorldState.getNeeds(citizenId);
        if (needs.waterBucket <= 0) {
          return { valid: false, reason: 'No water buckets carried. Need to collect water first.' };
        }
        const world = worldSimulationEngine.getState();
        if (world.weather.rainRate >= 0.5) {
          return { valid: false, reason: `Natural rain is already watering crops (${world.weather.rainRate}mm/min).` };
        }
        return { valid: true, reason: 'Valid watering condition.' };
      },
      execute: (citizenId) => {
        const ok = farmingWorldState.waterWheatCrop(citizenId);
        return {
          success: ok,
          reason: ok ? 'Watered crops successfully' : 'Failed to water crops',
          memoryDescription: ok ? 'Irrigated wheat crops' : 'Crop watering failed',
          timeSpentMinutes: 0.2,
        };
      },
    });

    this.registerTool({
      name: 'harvest_crops',
      category: 'WORLD',
      description: 'Reap mature wheat crops at the farm',
      argumentsSchema: '{}',
      validate: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        if (loc !== 'wheat' && loc !== 'bens_farm') {
          return { valid: false, reason: `Must be at the farm to harvest crops (currently at ${loc}).` };
        }
        const crop = farmingWorldState.wheatCrop;
        if (!crop.isMature) {
          return { valid: false, reason: `Crops are not mature yet (Growth: ${Math.round(crop.growth)}%).` };
        }
        return { valid: true, reason: 'Crops mature.' };
      },
      execute: (citizenId) => {
        const ok = farmingWorldState.harvestWheatCrop(citizenId);
        return {
          success: ok,
          reason: ok ? 'Harvested mature wheat crops' : 'Failed to harvest crops',
          memoryDescription: ok ? 'Harvested mature wheat crops' : 'Harvesting failed',
          timeSpentMinutes: 0.25,
        };
      },
    });

    this.registerTool({
      name: 'repair',
      category: 'WORLD',
      description: 'Repair damaged fence, tools, or structure',
      argumentsSchema: '{"target": "target_structure_string"}',
      validate: (citizenId, args) => {
        if (!args || !args.target) args.target = 'fence';
        return { valid: true, reason: 'Valid repair target.' };
      },
      execute: (citizenId, args) => ({
        success: true,
        reason: `Repaired ${args.target || 'fence'}`,
        memoryDescription: `Repaired ${args.target || 'fence'}`,
        timeSpentMinutes: 0.2,
      }),
    });

    // ==========================================
    // 9. IDLE & COGNITIVE CAPABILITIES
    // ==========================================
    this.registerTool({
      name: 'add_soul_entry',
      category: 'COGNITIVE',
      description: 'Record an immutable core conviction, belief, or existential identity anchor (never summarized)',
      argumentsSchema: '{"conviction": "core_belief_text"}',
      validate: (citizenId, args) => {
        if (!args || !args.conviction || typeof args.conviction !== 'string') {
          return { valid: false, reason: 'add_soul_entry requires a conviction string.' };
        }
        return { valid: true, reason: 'Valid conviction entry.' };
      },
      execute: (citizenId, args) => {
        import('./CitizenAIBrain').then(({ benAIBrain, julieAIBrain }) => {
          const brain = citizenId === 'ben' ? benAIBrain : julieAIBrain;
          brain.agent.memorySystem.addSoulEntry(args.conviction);
        }).catch(() => {});
        return {
          success: true,
          reason: `Recorded soul entry: "${args.conviction}"`,
          memoryDescription: `Established core identity anchor: "${args.conviction}"`,
          timeSpentMinutes: 0.1,
        };
      },
    });

    this.registerTool({
      name: 'self_care',
      category: 'COGNITIVE',
      description: 'Consolidate cognitive load by batching and summarizing past episodic memories (at home)',
      argumentsSchema: '{}',
      validate: (citizenId, args, currentPos) => {
        const loc = getSemanticLocationAtPosition(currentPos);
        const isHome = loc === 'home' || (citizenId === 'ben' ? loc === 'bens_house' : loc === 'julies_farm' || loc === 'julies_bakery');
        if (!isHome) {
          return { valid: false, reason: 'self_care must be performed at your home location. Use move_to first.' };
        }
        return { valid: true, reason: 'At home location for cognitive self-care.' };
      },
      execute: (citizenId) => {
        import('./CitizenAIBrain').then(({ benAIBrain, julieAIBrain }) => {
          const brain = citizenId === 'ben' ? benAIBrain : julieAIBrain;
          brain.agent.memorySystem.performSelfCareSummarization();
        }).catch(() => {});
        return {
          success: true,
          reason: 'Performed cognitive self-care',
          memoryDescription: 'Performed cognitive self-care and memory summarization',
          timeSpentMinutes: 0.2,
        };
      },
    });


    this.registerTool({
      name: 'write_journal_entry',
      category: 'COGNITIVE',
      description: 'Write a reflective diary entry about recent events, feelings, and community observations',
      argumentsSchema: '{"content": "journal_entry_text", "mood": "reflective"}',
      validate: (citizenId, args) => {
        if (!args || !args.content) return { valid: false, reason: 'Journal entry requires content text.' };
        return { valid: true, reason: 'Valid journal entry.' };
      },
      execute: (citizenId, args) => ({
        success: true,
        reason: `Wrote journal entry: "${args.content.substring(0, 40)}..."`,
        memoryDescription: `Recorded reflection in personal journal: "${args.content}"`,
        timeSpentMinutes: 0.15,
      }),
    });

    // ==========================================
    // 10. GOVERNANCE & ECONOMY CAPABILITIES
    // ==========================================
    this.registerTool({
      name: 'propose_community_rule',
      category: 'GOVERNANCE',
      description: 'Propose a new binding community rule, project initiative, or law for the village',
      argumentsSchema: '{"title": "proposal_title", "description": "proposal_details"}',
      validate: (citizenId, args) => {
        if (!args || !args.title || !args.description) {
          return { valid: false, reason: 'propose_community_rule requires title and description.' };
        }
        return { valid: true, reason: 'Valid community proposal.' };
      },
      execute: (citizenId, args) => ({
        success: true,
        reason: `Proposed community rule: "${args.title}"`,
        memoryDescription: `Submitted village governance proposal: "${args.title}"`,
        timeSpentMinutes: 0.2,
      }),
    });

    this.registerTool({
      name: 'vote_on_rule',
      category: 'GOVERNANCE',
      description: 'Cast a vote on an active community proposal (vote: FOR or AGAINST)',
      argumentsSchema: '{"proposalId": "id_or_title", "vote": "FOR", "rationale": "reason_text"}',
      validate: (citizenId, args) => {
        if (!args || !args.vote) return { valid: false, reason: 'vote_on_rule requires a vote choice.' };
        return { valid: true, reason: 'Valid vote.' };
      },
      execute: (citizenId, args) => ({
        success: true,
        reason: `Voted ${args.vote} on proposal "${args.proposalId || 'active proposal'}"`,
        memoryDescription: `Cast vote ${args.vote} on community rule: ${args.rationale || ''}`,
        timeSpentMinutes: 0.1,
      }),
    });

    this.registerTool({
      name: 'propose_trade',
      category: 'ECONOMY',
      description: 'Propose an item or resource trade exchange with another citizen',
      argumentsSchema: '{"target": "julie", "offer": "wheat", "request": "bread"}',
      validate: (citizenId, args) => {
        if (!args || !args.target || !args.offer) return { valid: false, reason: 'Trade requires target and offer.' };
        return { valid: true, reason: 'Valid trade proposal.' };
      },
      execute: (citizenId, args) => ({
        success: true,
        reason: `Proposed trade to ${args.target}: offering ${args.offer} for ${args.request || 'something in return'}`,
        memoryDescription: `Offered trade to ${args.target}: ${args.offer}`,
        timeSpentMinutes: 0.15,
      }),
    });

    this.registerTool({
      name: 'wait',
      category: 'IDLE',
      description: 'Wait and observe without taking physical action',
      argumentsSchema: '{"reason": "reason_for_waiting"}',
      validate: () => ({ valid: true, reason: 'Always valid.' }),
      execute: (citizenId, args) => ({
        success: true,
        reason: `Waiting: ${args.reason || 'Observing situation'}`,
        memoryDescription: `Waited: ${args.reason || 'Observing environment'}`,
        timeSpentMinutes: 0.05,
      }),
    });
  }
}

export const toolRegistry = ToolRegistry.getInstance();
