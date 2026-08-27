import {
  WorldSector,
  NavCell,
  SemanticLocationItem,
  TerrainType,
  MapData,
  CardinalDirection,
  WorldPosition,
} from './types/navigationMap';
import {
  CoordinateConverter,
  SECTOR_COUNT,
  CELLS_PER_SECTOR,
} from './CoordinateConverter';
import { isPointInRiverWater } from '../../components/world/my/River';
import { isPointOnBridge } from '../../components/world/my/Bridge';
import { getDetectedGroundHeight } from '../physics/GroundPhysics';
import defaultMapRaw from './map/defaultMap.json';

export class WorldMap {
  private sectors: WorldSector[][] = []; // [sectorZ][sectorX]
  private semanticLocations: Map<string, SemanticLocationItem> = new Map();

  constructor(initialData?: MapData) {
    this.initializeSectors(initialData);
  }

  /**
   * Initializes 20x20 sectors and 10x10 cells with walkability and terrain details
   */
  private initializeSectors(initialData?: MapData) {
    const rawMapData: MapData = initialData || (defaultMapRaw as any);

    // Load semantic locations
    this.semanticLocations.clear();
    if (rawMapData.semanticLocations) {
      rawMapData.semanticLocations.forEach((loc) => {
        this.semanticLocations.set(loc.id, { ...loc });
      });
    }

    // Build custom override lookup table if sectors are present in saved JSON
    const overrideMap: Map<string, { walkable: boolean; terrain: TerrainType; cost: number; obstacleInfo?: string }> = new Map();
    if (rawMapData.sectors) {
      rawMapData.sectors.forEach((sec) => {
        sec.cells.forEach((cell) => {
          const key = `${sec.sectorX}_${sec.sectorZ}_${cell.gridX}_${cell.gridZ}`;
          overrideMap.set(key, {
            walkable: cell.walkable,
            terrain: cell.terrain,
            cost: cell.cost,
            obstacleInfo: cell.obstacleInfo,
          });
        });
      });
    }

    // Build 20x20 Sector Grid
    this.sectors = [];
    for (let sz = 0; sz < SECTOR_COUNT; sz++) {
      const row: WorldSector[] = [];
      for (let sx = 0; sx < SECTOR_COUNT; sx++) {
        const bounds = CoordinateConverter.sectorToWorld(sx, sz);
        const center = {
          x: bounds.centerX,
          y: 0,
          z: bounds.centerZ,
        };

        const cells: NavCell[][] = [];
        let hasWalkableCell = false;

        for (let gz = 0; gz < CELLS_PER_SECTOR; gz++) {
          const cellRow: NavCell[] = [];
          for (let gx = 0; gx < CELLS_PER_SECTOR; gx++) {
            const worldPos = CoordinateConverter.gridToWorld(sx, sz, gx, gz);
            const overrideKey = `${sx}_${sz}_${gx}_${gz}`;
            const override = overrideMap.get(overrideKey);

            const groundInfo = getDetectedGroundHeight(worldPos.x, worldPos.z);
            worldPos.y = groundInfo.groundY;

            let terrain: TerrainType = 'GRASS';
            let walkable = true;
            let cost = 1.0;
            let obstacleInfo: string | undefined = undefined;

            if (override) {
              terrain = override.terrain;
              walkable = override.walkable;
              cost = override.cost;
              obstacleInfo = override.obstacleInfo;
            } else {
              if (groundInfo.hitType === 'BRIDGE') {
                terrain = 'ROAD';
                walkable = true;
                cost = 0.8;
              } else if (groundInfo.hitType === 'WATER') {
                terrain = 'WATER';
                walkable = false;
                cost = 10.0;
              } else if (groundInfo.hitType === 'CLIFF' || !groundInfo.isWalkable) {
                terrain = 'BLOCKED';
                walkable = false;
                cost = Infinity;
                obstacleInfo = `Steep Slope (${groundInfo.slopeAngleDeg}°)`;
              } else {
                terrain = 'GRASS';
                walkable = true;
                cost = 1.0;
              }
            }

            if (walkable) hasWalkableCell = true;

            cellRow.push({
              gridX: gx,
              gridZ: gz,
              worldPos,
              walkable,
              terrain,
              cost,
              slopeAngleDeg: groundInfo.slopeAngleDeg,
              obstacleInfo,
            });
          }
          cells.push(cellRow);
        }

        row.push({
          sectorX: sx,
          sectorZ: sz,
          bounds,
          center,
          cells,
          portals: {
            N: { direction: 'N', targetSectorX: sx, targetSectorZ: sz - 1, cellIndices: [], isOpen: false },
            S: { direction: 'S', targetSectorX: sx, targetSectorZ: sz + 1, cellIndices: [], isOpen: false },
            E: { direction: 'E', targetSectorX: sx + 1, targetSectorZ: sz, cellIndices: [], isOpen: false },
            W: { direction: 'W', targetSectorX: sx - 1, targetSectorZ: sz, cellIndices: [], isOpen: false },
          },
          walkable: hasWalkableCell,
        });
      }
      this.sectors.push(row);
    }

    // Compute boundary portals between adjacent sectors
    this.recalculateAllPortals();
  }

  /**
   * Recalculates North/South/East/West boundary portals for all sectors
   */
  public recalculateAllPortals() {
    for (let sz = 0; sz < SECTOR_COUNT; sz++) {
      for (let sx = 0; sx < SECTOR_COUNT; sx++) {
        const sector = this.sectors[sz][sx];

        // North boundary (gridZ = 0 vs sz-1 gridZ = 9)
        if (sz > 0) {
          const openIndices: number[] = [];
          for (let gx = 0; gx < CELLS_PER_SECTOR; gx++) {
            const thisCell = sector.cells[0][gx];
            const otherCell = this.sectors[sz - 1][sx].cells[CELLS_PER_SECTOR - 1][gx];
            if (thisCell.walkable && otherCell.walkable) {
              openIndices.push(gx);
            }
          }
          sector.portals.N = {
            direction: 'N',
            targetSectorX: sx,
            targetSectorZ: sz - 1,
            cellIndices: openIndices,
            isOpen: openIndices.length > 0,
          };
        }

        // South boundary (gridZ = 9 vs sz+1 gridZ = 0)
        if (sz < SECTOR_COUNT - 1) {
          const openIndices: number[] = [];
          for (let gx = 0; gx < CELLS_PER_SECTOR; gx++) {
            const thisCell = sector.cells[CELLS_PER_SECTOR - 1][gx];
            const otherCell = this.sectors[sz + 1][sx].cells[0][gx];
            if (thisCell.walkable && otherCell.walkable) {
              openIndices.push(gx);
            }
          }
          sector.portals.S = {
            direction: 'S',
            targetSectorX: sx,
            targetSectorZ: sz + 1,
            cellIndices: openIndices,
            isOpen: openIndices.length > 0,
          };
        }

        // West boundary (gridX = 0 vs sx-1 gridX = 9)
        if (sx > 0) {
          const openIndices: number[] = [];
          for (let gz = 0; gz < CELLS_PER_SECTOR; gz++) {
            const thisCell = sector.cells[gz][0];
            const otherCell = this.sectors[sz][sx - 1].cells[gz][CELLS_PER_SECTOR - 1];
            if (thisCell.walkable && otherCell.walkable) {
              openIndices.push(gz);
            }
          }
          sector.portals.W = {
            direction: 'W',
            targetSectorX: sx - 1,
            targetSectorZ: sz,
            cellIndices: openIndices,
            isOpen: openIndices.length > 0,
          };
        }

        // East boundary (gridX = 9 vs sx+1 gridX = 0)
        if (sx < SECTOR_COUNT - 1) {
          const openIndices: number[] = [];
          for (let gz = 0; gz < CELLS_PER_SECTOR; gz++) {
            const thisCell = sector.cells[gz][CELLS_PER_SECTOR - 1];
            const otherCell = this.sectors[sz][sx + 1].cells[gz][0];
            if (thisCell.walkable && otherCell.walkable) {
              openIndices.push(gz);
            }
          }
          sector.portals.E = {
            direction: 'E',
            targetSectorX: sx + 1,
            targetSectorZ: sz,
            cellIndices: openIndices,
            isOpen: openIndices.length > 0,
          };
        }
      }
    }
  }

  public getSector(sectorX: number, sectorZ: number): WorldSector | null {
    if (
      isNaN(sectorX) ||
      isNaN(sectorZ) ||
      sectorX < 0 ||
      sectorX >= SECTOR_COUNT ||
      sectorZ < 0 ||
      sectorZ >= SECTOR_COUNT
    ) {
      return null;
    }
    return this.sectors[sectorZ]?.[sectorX] || null;
  }

  public getCell(sectorX: number, sectorZ: number, gridX: number, gridZ: number): NavCell | null {
    const sector = this.getSector(sectorX, sectorZ);
    if (!sector || isNaN(gridX) || isNaN(gridZ)) return null;
    if (gridX < 0 || gridX >= CELLS_PER_SECTOR || gridZ < 0 || gridZ >= CELLS_PER_SECTOR) {
      return null;
    }
    return sector.cells[gridZ]?.[gridX] || null;
  }

  public getSemanticLocation(id: string): SemanticLocationItem | undefined {
    return this.semanticLocations.get(id);
  }

  public getAllSemanticLocations(): SemanticLocationItem[] {
    return Array.from(this.semanticLocations.values());
  }

  public setSemanticLocation(location: SemanticLocationItem) {
    this.semanticLocations.set(location.id, { ...location });
  }

  public removeSemanticLocation(id: string) {
    this.semanticLocations.delete(id);
  }

  public setCellTerrain(
    sectorX: number,
    sectorZ: number,
    gridX: number,
    gridZ: number,
    terrain: TerrainType,
    walkable: boolean,
    cost?: number
  ) {
    const cell = this.getCell(sectorX, sectorZ, gridX, gridZ);
    if (!cell) return;

    cell.terrain = terrain;
    cell.walkable = walkable;

    if (cost !== undefined) {
      cell.cost = cost;
    } else {
      switch (terrain) {
        case 'ROAD': cell.cost = 0.8; break;
        case 'GRASS': cell.cost = 1.0; break;
        case 'FARM': cell.cost = 1.8; break;
        case 'FOREST': cell.cost = 2.5; break;
        case 'WATER': cell.cost = 10.0; break;
        case 'BUILDING': cell.cost = Infinity; break;
        case 'BLOCKED': cell.cost = Infinity; break;
        default: cell.cost = 1.0; break;
      }
    }

    // Recalculate portals for affected sector and neighbors
    this.recalculateAllPortals();
  }

  /**
   * Finds the nearest walkable navigation cell on the grid for a given world position [x, y, z] or WorldPosition
   */
  public findNearestWalkableCell(pos: WorldPosition | [number, number, number]): NavCell | null {
    const worldX = Array.isArray(pos) ? pos[0] : pos.x;
    const worldZ = Array.isArray(pos) ? pos[2] : pos.z;

    const grid = CoordinateConverter.worldToGrid(pos);
    const targetSector = this.getSector(grid.sectorX, grid.sectorZ);

    if (targetSector && targetSector.walkable) {
      const directCell = targetSector.cells[grid.gridZ]?.[grid.gridX];
      if (directCell && directCell.walkable) {
        return directCell;
      }
    }

    // Search surrounding sectors within search radius
    let minDistanceSq = Infinity;
    let bestCell: NavCell | null = null;
    const searchRadius = 3;

    const startSz = Math.max(0, grid.sectorZ - searchRadius);
    const endSz = Math.min(SECTOR_COUNT - 1, grid.sectorZ + searchRadius);
    const startSx = Math.max(0, grid.sectorX - searchRadius);
    const endSx = Math.min(SECTOR_COUNT - 1, grid.sectorX + searchRadius);

    for (let sz = startSz; sz <= endSz; sz++) {
      for (let sx = startSx; sx <= endSx; sx++) {
        const sector = this.sectors[sz]?.[sx];
        if (!sector || !sector.walkable) continue;

        for (let gz = 0; gz < CELLS_PER_SECTOR; gz++) {
          for (let gx = 0; gx < CELLS_PER_SECTOR; gx++) {
            const cell = sector.cells[gz][gx];
            if (cell.walkable) {
              const dx = cell.worldPos.x - worldX;
              const dz = cell.worldPos.z - worldZ;
              const distSq = dx * dx + dz * dz;
              if (distSq < minDistanceSq) {
                minDistanceSq = distSq;
                bestCell = cell;
              }
            }
          }
        }
      }
    }

    return bestCell;
  }

  public exportMapData(): MapData {
    const sectorsData: MapData['sectors'] = [];

    for (let sz = 0; sz < SECTOR_COUNT; sz++) {
      for (let sx = 0; sx < SECTOR_COUNT; sx++) {
        const sector = this.sectors[sz][sx];
        const cellData: MapData['sectors'][0]['cells'] = [];

        for (let gz = 0; gz < CELLS_PER_SECTOR; gz++) {
          for (let gx = 0; gx < CELLS_PER_SECTOR; gx++) {
            const cell = sector.cells[gz][gx];
            cellData.push({
              gridX: cell.gridX,
              gridZ: cell.gridZ,
              walkable: cell.walkable,
              terrain: cell.terrain,
              cost: cell.cost,
              obstacleInfo: cell.obstacleInfo,
            });
          }
        }

        sectorsData.push({
          sectorX: sx,
          sectorZ: sz,
          cells: cellData,
        });
      }
    }

    return {
      version: '1.0.0',
      worldSize: 1000,
      sectorCount: SECTOR_COUNT,
      sectorSize: 50,
      cellSize: 5,
      semanticLocations: this.getAllSemanticLocations(),
      sectors: sectorsData,
    };
  }
}
