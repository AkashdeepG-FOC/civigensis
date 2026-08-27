export interface SemanticLocation {
  id: string;
  name: string;
  type: 'water' | 'building' | 'landmark' | 'farm';
  position: [number, number, number];
  interaction_radius: number;
  water_available?: boolean;
  fishing_available?: boolean;
  drinking_water?: boolean;
}

export const VILLAGE_RIVER_LOCATION: SemanticLocation = {
  id: 'river',
  name: 'Village River',
  type: 'water',
  position: [0.0, 1.5, -65.0], // Outer northern riverbank location
  interaction_radius: 8,
  water_available: true,
  fishing_available: false,
  drinking_water: false,
};

export const VEGETABLE_SELLER_STALL_POSITION: [number, number, number] = [-5.0, 0, 7.0];
export const RAVI_HOME_POSITION: [number, number, number] = [18.0, 0, 24.5];

export const SEMANTIC_LOCATIONS: SemanticLocation[] = [
  VILLAGE_RIVER_LOCATION,
  {
    id: 'village_center',
    name: 'Village Center Market',
    type: 'landmark',
    position: [0, 0, 5],
    interaction_radius: 12,
  },
  {
    id: 'vegetable_stall',
    name: "Ravi's Vegetable Stall",
    type: 'building',
    position: VEGETABLE_SELLER_STALL_POSITION,
    interaction_radius: 8,
  },
  {
    id: 'ravis_house',
    name: "Ravi's Cottage",
    type: 'building',
    position: RAVI_HOME_POSITION,
    interaction_radius: 8,
  },
  {
    id: 'bens_farm',
    name: "Ben's Wheat Farm",
    type: 'farm',
    position: [120, 0, -160],
    interaction_radius: 35,
  },
  {
    id: 'wheat',
    name: "Ben's Wheat Field",
    type: 'farm',
    position: [120, 0, -160],
    interaction_radius: 35,
  },
  {
    id: 'bens_house',
    name: "Ben's House & Cottage",
    type: 'building',
    position: [-18, 0, -9.5],
    interaction_radius: 8,
  },
  {
    id: 'julies_bakery',
    name: "Julie's Bakery Manor",
    type: 'building',
    position: [5, 0, -13.2],
    interaction_radius: 10,
  },
];

/**
 * Calculates current semantic location name from 3D world position coordinates [x, y, z]
 */
export function getSemanticLocationAtPosition(pos: [number, number, number]): string {
  let nearestLoc: SemanticLocation | null = null;
  let minDistanceSq = Infinity;

  for (const loc of SEMANTIC_LOCATIONS) {
    const dx = loc.position[0] - pos[0];
    const dz = loc.position[2] - pos[2];
    const distSq = dx * dx + dz * dz;
    const maxRadiusSq = Math.pow(loc.interaction_radius + 6, 2); // Radius + 6m proximity buffer

    if (distSq <= maxRadiusSq && distSq < minDistanceSq) {
      minDistanceSq = distSq;
      nearestLoc = loc;
    }
  }

  if (nearestLoc) {
    return nearestLoc.name;
  }
  return 'En route in village terrain';
}
