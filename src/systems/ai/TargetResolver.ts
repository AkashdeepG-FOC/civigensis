import { SEMANTIC_LOCATIONS } from '../../types/locations';
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
   * Target Resolution Engine:
   * Maps a target description (semantic location, citizen name, or dynamic entity)
   * to live physical 3D coordinates. Returns null for invalid or unregistered targets.
   */
  public static resolveTarget(
    targetDescription: string,
    currentPos?: [number, number, number],
    citizenId?: CitizenId
  ): NavigationTarget | null {
    if (!targetDescription || typeof targetDescription !== 'string' || targetDescription.trim().length === 0) {
      return null;
    }

    const rawLower = targetDescription.toLowerCase().trim();
    const descLower = rawLower.replace(/['_\-]/g, ' ');

    const directionalTerms = [
      'north',
      'south',
      'east',
      'west',
      'forest',
      'spatial northern woods',
      'spatial eastern village',
      'spatial western hills',
      'spatial southern meadow',
      'spatial_northern_woods',
      'spatial_eastern_village',
      'spatial_western_hills',
      'spatial_southern_meadow',
    ];

    // 0. Live Citizen Target Resolution (Ben / Julie / Ravi)
    if (descLower === 'ben' || descLower === 'go to ben' || (descLower.includes('ben') && !descLower.includes('farm') && !descLower.includes('house') && !descLower.includes('wheat') && !descLower.includes('field') && !descLower.includes('crop'))) {
      let benPos: [number, number, number] | null = null;
      try {
        const state = simulationEngine.getState();
        if (state?.citizens?.ben?.position) {
          benPos = [...state.citizens.ben.position];
        }
      } catch {}

      if (benPos || descLower === 'ben' || descLower === 'go to ben') {
        const finalPos = benPos || [120, 0, -160];
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "ben"`);
        console.log(`[LOCATION] World position: x: ${finalPos[0]}, y: ${finalPos[1]}, z: ${finalPos[2]}`);
        return {
          locationId: 'ben',
          name: 'Ben',
          position: finalPos,
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      }
    }

    if (descLower === 'julie' || descLower === 'go to julie' || (descLower.includes('julie') && !descLower.includes('farm') && !descLower.includes('bakery') && !descLower.includes('house') && !descLower.includes('manor'))) {
      let juliePos: [number, number, number] | null = null;
      try {
        const state = simulationEngine.getState();
        if (state?.citizens?.julie?.position) {
          juliePos = [...state.citizens.julie.position];
        }
      } catch {}

      if (juliePos || descLower === 'julie' || descLower === 'go to julie') {
        const finalPos = juliePos || [5, 0, -13.2];
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "julie"`);
        console.log(`[LOCATION] World position: x: ${finalPos[0]}, y: ${finalPos[1]}, z: ${finalPos[2]}`);
        return {
          locationId: 'julie',
          name: 'Julie',
          position: finalPos,
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      }
    }

    if (descLower === 'ravi' || descLower === 'go to ravi' || (descLower.includes('ravi') && !descLower.includes('house') && !descLower.includes('stall') && !descLower.includes('cottage'))) {
      let raviPos: [number, number, number] | null = null;
      try {
        const state = simulationEngine.getState();
        if (state?.citizens?.ravi?.position) {
          raviPos = [...state.citizens.ravi.position];
        }
      } catch {}

      if (raviPos || descLower === 'ravi' || descLower === 'go to ravi') {
        const finalPos = raviPos || [18, 0, 24.5];
        console.log(`[LOCATION] Raw target: "${targetDescription}"`);
        console.log(`[LOCATION] Canonical target: "ravi"`);
        console.log(`[LOCATION] World position: x: ${finalPos[0]}, y: ${finalPos[1]}, z: ${finalPos[2]}`);
        return {
          locationId: 'ravi',
          name: 'Ravi',
          position: finalPos,
          interactionRadius: CITIZEN_INTERACTION_RANGE,
        };
      }
    }

    // 1. Direct or fuzzy match against registered dynamic runtime entities
    for (const [id, entity] of this.dynamicTargets.entries()) {
      const normId = id.toLowerCase().replace(/['_\-]/g, ' ');
      const normName = entity.name.toLowerCase().replace(/['_\-]/g, ' ');
      if (
        descLower.includes(normId) ||
        descLower.includes(normName) ||
        entity.descriptionKeywords.some((kw) => descLower.includes(kw.toLowerCase().replace(/['_\-]/g, ' ')))
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

    // Explicit directional command check: "go north", "north", etc. are NOT valid destinations unless registered as dynamic target
    if (directionalTerms.some((term) => descLower === term || descLower === `go ${term}`)) {
      return null;
    }

    // 2. Keyword / Synonym matching for authoritative registered world targets
    if (descLower.includes('julie') && (descLower.includes('farm') || descLower.includes('bakery') || descLower.includes('house') || descLower.includes('home') || descLower.includes('manor'))) {
      const bakeryLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'julies_bakery');
      if (bakeryLoc) {
        return {
          locationId: bakeryLoc.id,
          name: bakeryLoc.name,
          position: [...bakeryLoc.position] as [number, number, number],
          interactionRadius: bakeryLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('ben') && (descLower.includes('farm') || descLower.includes('field') || descLower.includes('wheat') || descLower.includes('crop') || descLower.includes('house') || descLower.includes('home') || descLower.includes('cottage'))) {
      if (descLower.includes('house') || descLower.includes('home') || descLower.includes('cottage')) {
        const houseLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_house');
        if (houseLoc) {
          return {
            locationId: houseLoc.id,
            name: houseLoc.name,
            position: [...houseLoc.position] as [number, number, number],
            interactionRadius: houseLoc.interaction_radius,
          };
        }
      }
      const farmLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_farm' || l.id === 'wheat');
      if (farmLoc) {
        return {
          locationId: farmLoc.id,
          name: farmLoc.name,
          position: [...farmLoc.position] as [number, number, number],
          interactionRadius: farmLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('farm') || descLower.includes('crop') || descLower.includes('wheat') || descLower.includes('field')) {
      const farmLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_farm' || l.id === 'wheat');
      if (farmLoc) {
        return {
          locationId: farmLoc.id,
          name: farmLoc.name,
          position: [...farmLoc.position] as [number, number, number],
          interactionRadius: farmLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('river') || descLower.includes('water') || descLower.includes('stream')) {
      const riverLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'river');
      if (riverLoc) {
        return {
          locationId: riverLoc.id,
          name: riverLoc.name,
          position: [...riverLoc.position] as [number, number, number],
          interactionRadius: riverLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('house') || descLower.includes('home') || descLower.includes('cottage') || descLower.includes('bed')) {
      if (descLower.includes('ravi')) {
        const raviHouseLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'ravis_house');
        if (raviHouseLoc) {
          return {
            locationId: raviHouseLoc.id,
            name: raviHouseLoc.name,
            position: [...raviHouseLoc.position] as [number, number, number],
            interactionRadius: raviHouseLoc.interaction_radius,
          };
        }
      }
      const houseLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'bens_house');
      if (houseLoc) {
        return {
          locationId: houseLoc.id,
          name: houseLoc.name,
          position: [...houseLoc.position] as [number, number, number],
          interactionRadius: houseLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('bakery')) {
      const bakeryLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'julies_bakery');
      if (bakeryLoc) {
        return {
          locationId: bakeryLoc.id,
          name: bakeryLoc.name,
          position: [...bakeryLoc.position] as [number, number, number],
          interactionRadius: bakeryLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('center') || descLower.includes('market') || descLower.includes('well') || descLower.includes('village center')) {
      const centerLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'village_center');
      if (centerLoc) {
        return {
          locationId: centerLoc.id,
          name: centerLoc.name,
          position: [...centerLoc.position] as [number, number, number],
          interactionRadius: centerLoc.interaction_radius,
        };
      }
    }

    if (descLower.includes('stall')) {
      const stallLoc = SEMANTIC_LOCATIONS.find((l) => l.id === 'vegetable_stall');
      if (stallLoc) {
        return {
          locationId: stallLoc.id,
          name: stallLoc.name,
          position: [...stallLoc.position] as [number, number, number],
          interactionRadius: stallLoc.interaction_radius,
        };
      }
    }

    // 3. Exact ID / Name matching against SEMANTIC_LOCATIONS
    for (const loc of SEMANTIC_LOCATIONS) {
      const locIdNorm = loc.id.toLowerCase().replace(/['_\-]/g, ' ');
      const locNameNorm = loc.name.toLowerCase().replace(/['_\-]/g, ' ');
      if (descLower === locIdNorm || descLower === locNameNorm || descLower === `go to ${locIdNorm}` || descLower === `go to ${locNameNorm}`) {
        return {
          locationId: loc.id,
          name: loc.name,
          position: [...loc.position] as [number, number, number],
          interactionRadius: loc.interaction_radius,
        };
      }
    }

    // 4. Match against LocationRegistry canonical locations
    const allRegLocs = locationRegistry.getAllLocations();
    for (const regLoc of allRegLocs) {
      const regIdNorm = regLoc.id.toLowerCase().replace(/['_\-]/g, ' ');
      const regNameNorm = regLoc.name.toLowerCase().replace(/['_\-]/g, ' ');
      if (descLower === regIdNorm || descLower === regNameNorm || descLower.includes(regIdNorm) || descLower.includes(regNameNorm)) {
        return {
          locationId: regLoc.id,
          name: regLoc.name,
          position: [...regLoc.position] as [number, number, number],
          interactionRadius: regLoc.interactionRadius,
        };
      }
    }

    // Invalid target description - no registered world target matched.
    return null;
  }

  public static isValidTarget(targetDescription?: string): boolean {
    if (!targetDescription || typeof targetDescription !== 'string' || targetDescription.trim().length === 0) {
      return false;
    }
    return this.resolveTarget(targetDescription) !== null;
  }
}
