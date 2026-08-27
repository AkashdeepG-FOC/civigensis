import { SEMANTIC_LOCATIONS, SemanticLocation } from '../../types/locations';
import { NavigationTarget } from './NavigationSystem';
import { simulationEngine } from '../simulation/SimulationEngine';
import { CitizenId } from '../../types/citizen';
import { CITIZEN_INTERACTION_RANGE } from './InteractionConstants';
import { locationRegistry } from './LocationRegistry';

export interface DynamicEntityTarget {
  id: string;
  name: string;
  descriptionKeywords: string[];
  position: [number, number, number];
  interactionRadius: number;
}

export class TargetResolver {
  private static dynamicTargets: Map<string, DynamicEntityTarget> = new Map();

  public static registerDynamicTarget(
    id: string,
    name: string,
    descriptionKeywords: string[],
    position: [number, number, number],
    interactionRadius: number = 6
  ) {
    this.dynamicTargets.set(id.toLowerCase(), {
      id,
      name,
      descriptionKeywords: descriptionKeywords.map((k) => k.toLowerCase()),
      position,
      interactionRadius,
    });
  }

  public static clearDynamicTargets() {
    this.dynamicTargets.clear();
  }

  /**
   * Open Target Resolution Engine:
   * Maps an open target description (semantic location, citizen name, or spatial feature)
   * to live physical 3D coordinates.
   */
  public static resolveTarget(
    targetDescription: string,
    currentPos?: [number, number, number],
    citizenId?: CitizenId
  ): NavigationTarget {
    if (!targetDescription || targetDescription.trim().length === 0) {
      return this.getFallbackTarget(currentPos);
    }

    const rawLower = targetDescription.toLowerCase().trim();
    const descLower = rawLower.replace(/['_\-]/g, ' ');

    // 0. Live Citizen Target Resolution (Ben / Julie / Ravi)
    if (descLower.includes('ben') && !descLower.includes('farm') && !descLower.includes('house')) {
      try {
        const state = simulationEngine.getState();
        const benPos = state.citizens.ben.position;
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "ben"`);
        console.log(`[LOCATION] World position: x: ${benPos[0]}, y: ${benPos[1]}, z: ${benPos[2]}`);
        return {
          locationId: 'ben',
          name: 'Ben',
          position: [...benPos],
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      } catch {}
    }

    if (descLower.includes('julie') && !descLower.includes('farm') && !descLower.includes('bakery')) {
      try {
        const state = simulationEngine.getState();
        const juliePos = state.citizens.julie.position;
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "julie"`);
        console.log(`[LOCATION] World position: x: ${juliePos[0]}, y: ${juliePos[1]}, z: ${juliePos[2]}`);
        return {
          locationId: 'julie',
          name: 'Julie',
          position: [...juliePos],
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      } catch {}
    }

    if (descLower.includes('ravi') && !descLower.includes('house') && !descLower.includes('stall')) {
      try {
        const state = simulationEngine.getState();
        const raviPos = state.citizens.ravi.position;
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "ravi"`);
        console.log(`[LOCATION] World position: x: ${raviPos[0]}, y: ${raviPos[1]}, z: ${raviPos[2]}`);
        return {
          locationId: 'ravi',
          name: 'Ravi',
          position: [...raviPos],
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      } catch {}
    }

    // 1. Direct or fuzzy match against registered dynamic runtime entities
    for (const [id, entity] of this.dynamicTargets.entries()) {
      const normId = id.replace(/['_\-]/g, ' ');
      const normName = entity.name.toLowerCase().replace(/['_\-]/g, ' ');
      if (
        descLower.includes(normId) ||
        descLower.includes(normName) ||
        entity.descriptionKeywords.some((kw) => descLower.includes(kw.replace(/['_\-]/g, ' ')))
      ) {
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "${entity.id}"`);
        console.log(`[LOCATION] World position: x: ${entity.position[0]}, y: ${entity.position[1]}, z: ${entity.position[2]}`);
        return {
          locationId: entity.id,
          name: entity.name,
          position: [...entity.position],
          interactionRadius: entity.interactionRadius,
        };
      }
    }

    // 2. Delegate to authoritative LocationRegistry
    const canonicalLoc = locationRegistry.resolve(targetDescription, citizenId);
    console.log(`[LOCATION] Raw target: "${targetDescription}"`);
    console.log(`[LOCATION] Canonical target: "${canonicalLoc.id}"`);
    console.log(`[LOCATION] World position: x: ${canonicalLoc.position[0]}, y: ${canonicalLoc.position[1]}, z: ${canonicalLoc.position[2]}`);

    return {
      locationId: canonicalLoc.id,
      name: canonicalLoc.name,
      position: [...canonicalLoc.position],
      interactionRadius: canonicalLoc.interactionRadius,
    };

    // 3. Centralized Keyword matching for common concept synonyms
    if (descLower.includes('julie') && (descLower.includes('farm') || descLower.includes('bakery') || descLower.includes('house') || descLower.includes('home'))) {
      const bakeryLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'julies_bakery') || SEMANTIC_LOCATIONS[5];
      const target = { locationId: bakeryLoc.id, name: bakeryLoc.name, position: [...bakeryLoc.position] as [number, number, number], interactionRadius: bakeryLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('ben') && (descLower.includes('farm') || descLower.includes('field') || descLower.includes('wheat') || descLower.includes('crop'))) {
      const farmLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_farm') || SEMANTIC_LOCATIONS[4];
      const target = { locationId: farmLoc.id, name: farmLoc.name, position: [...farmLoc.position] as [number, number, number], interactionRadius: farmLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('farm') || descLower.includes('crop') || descLower.includes('wheat') || descLower.includes('field')) {
      const farmLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_farm' || l.id === 'wheat') || SEMANTIC_LOCATIONS[4];
      const target = { locationId: farmLoc.id, name: farmLoc.name, position: [...farmLoc.position] as [number, number, number], interactionRadius: farmLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('river') || descLower.includes('water') || descLower.includes('stream')) {
      const riverLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'river') || SEMANTIC_LOCATIONS[0];
      const target = { locationId: riverLoc.id, name: riverLoc.name, position: [...riverLoc.position] as [number, number, number], interactionRadius: riverLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('house') || descLower.includes('home') || descLower.includes('cottage') || descLower.includes('bed')) {
      const houseLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_house') || SEMANTIC_LOCATIONS[5];
      const target = { locationId: houseLoc.id, name: houseLoc.name, position: [...houseLoc.position] as [number, number, number], interactionRadius: houseLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('bakery')) {
      const bakeryLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'julies_bakery') || SEMANTIC_LOCATIONS[6];
      const target = { locationId: bakeryLoc.id, name: bakeryLoc.name, position: [...bakeryLoc.position] as [number, number, number], interactionRadius: bakeryLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    if (descLower.includes('center') || descLower.includes('market') || descLower.includes('village') || descLower.includes('well')) {
      const centerLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'village_center') || SEMANTIC_LOCATIONS[1];
      const target = { locationId: centerLoc.id, name: centerLoc.name, position: [...centerLoc.position] as [number, number, number], interactionRadius: centerLoc.interaction_radius };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${target.position[0]}, y: ${target.position[1]}, z: ${target.position[2]} (${target.name})`);
      return target;
    }

    // 4. Spatial / Directional resolution
    if (descLower.includes('north') || descLower.includes('forest')) {
      const target = { locationId: 'spatial_northern_woods', name: 'Northern Woods', position: [0, 0, -120] as [number, number, number], interactionRadius: 15 };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: 0, y: 0, z: -120 (Northern Woods)`);
      return target;
    }

    if (descLower.includes('east')) {
      const target = { locationId: 'spatial_eastern_village', name: 'Eastern Village Perimeter', position: [80, 0, 0] as [number, number, number], interactionRadius: 15 };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: 80, y: 0, z: 0 (Eastern Village)`);
      return target;
    }

    if (descLower.includes('west')) {
      const target = { locationId: 'spatial_western_hills', name: 'Western Hills', position: [-80, 0, 0] as [number, number, number], interactionRadius: 15 };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: -80, y: 0, z: 0 (Western Hills)`);
      return target;
    }

    if (descLower.includes('south')) {
      const target = { locationId: 'spatial_southern_meadow', name: 'Southern Meadow', position: [0, 0, 80] as [number, number, number], interactionRadius: 15 };
      console.log(`[AI] Destination resolved: ${targetDescription} -> x: 0, y: 0, z: 80 (Southern Meadow)`);
      return target;
    }

    const fallback = this.getFallbackTarget(currentPos);
    console.log(`[AI] Destination resolved: ${targetDescription} -> x: ${fallback.position[0]}, y: ${fallback.position[1]}, z: ${fallback.position[2]} (${fallback.name})`);
    return fallback;
  }

  public static isValidTarget(targetDescription?: string): boolean {
    if (!targetDescription || typeof targetDescription !== 'string' || targetDescription.trim().length === 0) {
      return false;
    }
    const rawLower = targetDescription.toLowerCase().trim();
    const descLower = rawLower.replace(/['_\-]/g, ' ');
    if (['ben', 'julie'].includes(descLower)) return true;

    for (const id of this.dynamicTargets.keys()) {
      if (descLower.includes(id.replace(/['_\-]/g, ' '))) return true;
    }

    for (const loc of SEMANTIC_LOCATIONS) {
      const locIdNorm = loc.id.toLowerCase().replace(/['_\-]/g, ' ');
      const locNameNorm = loc.name.toLowerCase().replace(/['_\-]/g, ' ');
      if (descLower.includes(locIdNorm) || descLower.includes(locNameNorm)) {
        return true;
      }
    }

    const keywords = ['farm', 'crop', 'wheat', 'field', 'river', 'water', 'stream', 'house', 'home', 'cottage', 'bed', 'bakery', 'center', 'market', 'village', 'north', 'forest', 'east', 'west', 'south'];
    return keywords.some((kw) => descLower.includes(kw));
  }

  private static getFallbackTarget(currentPos?: [number, number, number]): NavigationTarget {
    if (currentPos) {
      let nearestLoc: SemanticLocation = SEMANTIC_LOCATIONS[0];
      let minDistanceSq = Infinity;
      for (const loc of SEMANTIC_LOCATIONS) {
        const dx = loc.position[0] - currentPos[0];
        const dz = loc.position[2] - currentPos[2];
        const distSq = dx * dx + dz * dz;
        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          nearestLoc = loc;
        }
      }
      return {
        locationId: nearestLoc.id,
        name: nearestLoc.name,
        position: [nearestLoc.position[0], nearestLoc.position[1], nearestLoc.position[2]] as [number, number, number],
        interactionRadius: nearestLoc.interaction_radius,
      };
    }
    const defaultLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_farm') || SEMANTIC_LOCATIONS[0];
    return {
      locationId: defaultLoc.id,
      name: defaultLoc.name,
      position: [defaultLoc.position[0], defaultLoc.position[1], defaultLoc.position[2]] as [number, number, number],
      interactionRadius: defaultLoc.interaction_radius,
    };
  }
}
