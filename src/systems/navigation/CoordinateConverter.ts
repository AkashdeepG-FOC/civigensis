import { WorldPosition } from './types/navigationMap';
import { getTerrainHeight } from '../../components/world/my/Terrain';

export const WORLD_SIZE = 1000;
export const HALF_WORLD_SIZE = 500;
export const SECTOR_COUNT = 20;
export const SECTOR_SIZE = 50;
export const CELLS_PER_SECTOR = 10;
export const CELL_SIZE = 5;

export class CoordinateConverter {
  /**
   * Converts world position (x, y, z) into sector coordinate (sectorX, sectorZ)
   * Using half-open ranges: [-500, -450), ..., [450, 500]
   */
  public static worldToSector(pos: WorldPosition | [number, number, number]): { sectorX: number; sectorZ: number } {
    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const z = Array.isArray(pos) ? pos[2] : pos.z;

    // Shift world [-500, +500] into positive [0, 1000]
    const shiftedX = x + HALF_WORLD_SIZE;
    const shiftedZ = z + HALF_WORLD_SIZE;

    let sectorX = Math.floor(shiftedX / SECTOR_SIZE);
    let sectorZ = Math.floor(shiftedZ / SECTOR_SIZE);

    // Clamp boundaries for edge cases at exactly +500
    sectorX = Math.max(0, Math.min(SECTOR_COUNT - 1, sectorX));
    sectorZ = Math.max(0, Math.min(SECTOR_COUNT - 1, sectorZ));

    return { sectorX, sectorZ };
  }

  /**
   * Calculates world bounds (minX, maxX, minZ, maxZ) and center position for a given sector
   */
  public static sectorToWorld(sectorX: number, sectorZ: number): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerZ: number;
  } {
    const minX = -HALF_WORLD_SIZE + sectorX * SECTOR_SIZE;
    const maxX = minX + SECTOR_SIZE;

    const minZ = -HALF_WORLD_SIZE + sectorZ * SECTOR_SIZE;
    const maxZ = minZ + SECTOR_SIZE;

    const centerX = minX + SECTOR_SIZE / 2;
    const centerZ = minZ + SECTOR_SIZE / 2;

    return { minX, maxX, minZ, maxZ, centerX, centerZ };
  }

  /**
   * Converts world position into sector coordinates and local cell grid indices (gridX, gridZ)
   */
  public static worldToGrid(pos: WorldPosition | [number, number, number]): {
    sectorX: number;
    sectorZ: number;
    gridX: number;
    gridZ: number;
  } {
    const { sectorX, sectorZ } = this.worldToSector(pos);
    const { minX, minZ } = this.sectorToWorld(sectorX, sectorZ);

    const x = Array.isArray(pos) ? pos[0] : pos.x;
    const z = Array.isArray(pos) ? pos[2] : pos.z;

    const localX = x - minX;
    const localZ = z - minZ;

    let gridX = Math.floor(localX / CELL_SIZE);
    let gridZ = Math.floor(localZ / CELL_SIZE);

    gridX = Math.max(0, Math.min(CELLS_PER_SECTOR - 1, gridX));
    gridZ = Math.max(0, Math.min(CELLS_PER_SECTOR - 1, gridZ));

    return { sectorX, sectorZ, gridX, gridZ };
  }

  /**
   * Converts sector & local grid cell indices into 3D world center coordinate {x, y, z}
   */
  public static gridToWorld(
    sectorX: number,
    sectorZ: number,
    gridX: number,
    gridZ: number
  ): WorldPosition {
    const { minX, minZ } = this.sectorToWorld(sectorX, sectorZ);

    const x = minX + gridX * CELL_SIZE + CELL_SIZE / 2;
    const z = minZ + gridZ * CELL_SIZE + CELL_SIZE / 2;
    const y = getTerrainHeight(x, z);

    return { x, y, z };
  }
}
