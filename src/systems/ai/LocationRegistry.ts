import { CitizenId } from '../../types/citizen';
import { SEMANTIC_LOCATIONS } from '../../types/locations';

export interface CanonicalLocation {
  id: string;
  name: string;
  position: [number, number, number];
  interactionRadius: number;
}

export class LocationRegistry {
  private static instance: LocationRegistry;

  private locations: Map<string, CanonicalLocation> = new Map();

  constructor() {
    this.registerDefaultLocations();
  }

  public static getInstance(): LocationRegistry {
    if (!LocationRegistry.instance) {
      LocationRegistry.instance = new LocationRegistry();
    }
    return LocationRegistry.instance;
  }

  private registerDefaultLocations() {
    // Populate locations directly from authoritative SEMANTIC_LOCATIONS
    SEMANTIC_LOCATIONS.forEach((loc) => {
      let canonicalId = loc.id;
      if (canonicalId === 'julies_bakery') canonicalId = 'julies_farm';
      if (canonicalId === 'wheat') canonicalId = 'wheat_field';

      this.locations.set(canonicalId, {
        id: canonicalId,
        name: loc.name,
        position: [...loc.position],
        interactionRadius: loc.interaction_radius,
      });
    });

    // Ensure all canonical aliases exist
    if (!this.locations.has('bens_farm')) {
      this.locations.set('bens_farm', {
        id: 'bens_farm',
        name: "Ben's Wheat Farm",
        position: [120, 0, -160],
        interactionRadius: 35,
      });
    }

    if (!this.locations.has('julies_farm')) {
      this.locations.set('julies_farm', {
        id: 'julies_farm',
        name: "Julie's Farm & Bakery Manor",
        position: [5, 0, -13.2],
        interactionRadius: 10,
      });
    }

    if (!this.locations.has('wheat_field')) {
      this.locations.set('wheat_field', {
        id: 'wheat_field',
        name: "Ben's Wheat Field",
        position: [120, 0, -160],
        interactionRadius: 35,
      });
    }

    if (!this.locations.has('market')) {
      this.locations.set('market', {
        id: 'market',
        name: 'Village Center Market',
        position: [0, 0, 5],
        interactionRadius: 12,
      });
    }

    if (!this.locations.has('well')) {
      this.locations.set('well', {
        id: 'well',
        name: 'Village Stone Well',
        position: [0, 0, 5],
        interactionRadius: 12,
      });
    }
  }

  /**
   * Pure normalization layer: Converts ANY raw LLM or string input into a canonical ID
   */
  public normalizeLocationName(input?: string, citizenId?: CitizenId): string {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return citizenId === 'julie' ? 'julies_farm' : 'bens_farm';
    }

    const raw = input.toLowerCase().trim();
    const clean = raw.replace(/['_\-]/g, ' ');

    // Citizen Target Matching
    if (clean.includes('ben') && !clean.includes('farm') && !clean.includes('house')) return 'ben';
    if (clean.includes('julie') && !clean.includes('farm') && !clean.includes('bakery')) return 'julie';
    if (clean.includes('ravi') && !clean.includes('house') && !clean.includes('stall')) return 'ravi';

    // Julie's Farm / Bakery
    if (clean.includes('julie') && (clean.includes('farm') || clean.includes('bakery') || clean.includes('manor'))) {
      return 'julies_farm';
    }
    if (clean.includes('bakery')) return 'julies_farm';

    // Ben's Farm / Wheat Field
    if (clean.includes('ben') && (clean.includes('farm') || clean.includes('field') || clean.includes('wheat') || clean.includes('crop'))) {
      return 'bens_farm';
    }
    if (clean.includes('wheat') || clean.includes('crop field') || clean.includes('wheat field')) {
      return 'wheat_field';
    }
    if (clean.includes('farm')) return 'bens_farm';

    // Village Center / Market / Well
    if (clean.includes('center') || clean.includes('market') || clean.includes('well') || clean.includes('village')) {
      return 'village_center';
    }

    // River / Water
    if (clean.includes('river') || clean.includes('water') || clean.includes('stream') || clean.includes('basin')) {
      return 'river';
    }

    // Home / Cottage
    if (clean.includes('home') || clean.includes('house') || clean.includes('cottage') || clean.includes('bed')) {
      if (clean.includes('julie')) return 'julies_farm';
      if (clean.includes('ravi')) return 'ravis_house';
      if (clean.includes('ben')) return 'bens_house';
      return citizenId === 'julie' ? 'julies_farm' : 'bens_house';
    }

    // Ravi's Cottage & Stall
    if (clean.includes('ravi') && clean.includes('house')) return 'ravis_house';
    if (clean.includes('stall') || clean.includes('vegetable')) return 'vegetable_stall';

    // Spatial / Directional
    if (clean.includes('north') || clean.includes('forest')) return 'spatial_northern_woods';
    if (clean.includes('east')) return 'spatial_eastern_village';
    if (clean.includes('west')) return 'spatial_western_hills';
    if (clean.includes('south')) return 'spatial_southern_meadow';

    return 'village_center';
  }

  /**
   * Resolves a raw target string or canonical ID to a CanonicalLocation with world coordinates
   */
  public resolve(input?: string, citizenId?: CitizenId): CanonicalLocation {
    const canonicalId = this.normalizeLocationName(input, citizenId);

    if (this.locations.has(canonicalId)) {
      return this.locations.get(canonicalId)!;
    }

    // Fallback match against semantic locations
    const found = SEMANTIC_LOCATIONS.find((l) => l.id === canonicalId || l.id.includes(canonicalId));
    if (found) {
      return {
        id: canonicalId,
        name: found.name,
        position: [...found.position],
        interactionRadius: found.interaction_radius,
      };
    }

    const defaultLoc = this.locations.get('village_center') || {
      id: 'village_center',
      name: 'Village Center Market',
      position: [0, 0, 5],
      interactionRadius: 12,
    };

    return defaultLoc;
  }

  public getAllLocations(): CanonicalLocation[] {
    return Array.from(this.locations.values());
  }
}

export const locationRegistry = LocationRegistry.getInstance();
