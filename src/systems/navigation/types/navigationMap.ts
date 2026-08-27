export type TerrainType =
  | 'WALKABLE'
  | 'ROAD'
  | 'FARM'
  | 'GRASS'
  | 'FOREST'
  | 'WATER'
  | 'BUILDING'
  | 'BLOCKED';

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface NavCell {
  gridX: number;
  gridZ: number;
  worldPos: WorldPosition;
  walkable: boolean;
  terrain: TerrainType;
  cost: number;
  slopeAngleDeg?: number;
  obstacleInfo?: string;
}

export type CardinalDirection = 'N' | 'S' | 'E' | 'W';

export interface SectorPortal {
  direction: CardinalDirection;
  targetSectorX: number;
  targetSectorZ: number;
  cellIndices: number[]; // Cell indices along shared edge (0..9)
  isOpen: boolean;
}

export interface WorldSector {
  sectorX: number; // 0..19
  sectorZ: number; // 0..19
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  center: WorldPosition;
  cells: NavCell[][]; // 10x10 array [gridZ][gridX]
  portals: Record<CardinalDirection, SectorPortal>;
  walkable: boolean;
}

export interface SemanticLocationItem {
  id: string;
  name: string;
  type: 'farm' | 'water' | 'building' | 'landmark' | 'forest' | 'house' | 'road' | 'other';
  position: WorldPosition;
  sector: {
    sectorX: number;
    sectorZ: number;
  };
  interactionRadius?: number;
  connectedLocations?: string[];
}

export interface MapData {
  version: string;
  worldSize: number;     // 1000
  sectorCount: number;   // 20
  sectorSize: number;    // 50
  cellSize: number;      // 5
  semanticLocations: SemanticLocationItem[];
  sectors: {
    sectorX: number;
    sectorZ: number;
    cells: {
      gridX: number;
      gridZ: number;
      walkable: boolean;
      terrain: TerrainType;
      cost: number;
      obstacleInfo?: string;
    }[];
  }[];
}

export interface PathfindingResult {
  success: boolean;
  waypoints: WorldPosition[];
  distance: number;
  sectorPath?: { sectorX: number; sectorZ: number }[];
  error?: string;
}
