import { WorldMap } from './WorldMap';
import { CardinalDirection } from './types/navigationMap';
import { SECTOR_COUNT } from './CoordinateConverter';

export interface SectorNode {
  sectorX: number;
  sectorZ: number;
}

export class SectorGraph {
  private map: WorldMap;

  constructor(map: WorldMap) {
    this.map = map;
  }

  /**
   * Finds high-level route of sectors from start to destination using A* with boundary portal validation
   */
  public findSectorRoute(
    startSector: SectorNode,
    destSector: SectorNode
  ): SectorNode[] | null {
    if (startSector.sectorX === destSector.sectorX && startSector.sectorZ === destSector.sectorZ) {
      return [startSector];
    }

    const openSet: SectorNode[] = [startSector];
    const cameFrom: Map<string, SectorNode> = new Map();

    const gScore: Map<string, number> = new Map();
    const fScore: Map<string, number> = new Map();

    const startKey = this.nodeKey(startSector);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(startSector, destSector));

    while (openSet.length > 0) {
      // Pick node in openSet with lowest fScore
      let currentIdx = 0;
      let current = openSet[0];
      let minF = fScore.get(this.nodeKey(current)) ?? Infinity;

      for (let i = 1; i < openSet.length; i++) {
        const score = fScore.get(this.nodeKey(openSet[i])) ?? Infinity;
        if (score < minF) {
          minF = score;
          current = openSet[i];
          currentIdx = i;
        }
      }

      const currentKey = this.nodeKey(current);

      if (current.sectorX === destSector.sectorX && current.sectorZ === destSector.sectorZ) {
        // Reconstruct sector path
        const path: SectorNode[] = [current];
        let currKey = currentKey;
        while (cameFrom.has(currKey)) {
          const prev = cameFrom.get(currKey)!;
          path.unshift(prev);
          currKey = this.nodeKey(prev);
        }
        return path;
      }

      openSet.splice(currentIdx, 1);

      const neighbors = this.getConnectedNeighbors(current);

      for (const neighbor of neighbors) {
        const neighborKey = this.nodeKey(neighbor);
        const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;

        if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, destSector));

          if (!openSet.some((n) => n.sectorX === neighbor.sectorX && n.sectorZ === neighbor.sectorZ)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null; // No open portal path between sectors
  }

  private getConnectedNeighbors(node: SectorNode): SectorNode[] {
    const sector = this.map.getSector(node.sectorX, node.sectorZ);
    if (!sector) return [];

    const neighbors: SectorNode[] = [];
    const directions: { dir: CardinalDirection; dx: number; dz: number }[] = [
      { dir: 'N', dx: 0, dz: -1 },
      { dir: 'S', dx: 0, dz: 1 },
      { dir: 'E', dx: 1, dz: 0 },
      { dir: 'W', dx: -1, dz: 0 },
    ];

    for (const d of directions) {
      const portal = sector.portals[d.dir];
      if (portal && portal.isOpen) {
        const nx = node.sectorX + d.dx;
        const nz = node.sectorZ + d.dz;
        if (nx >= 0 && nx < SECTOR_COUNT && nz >= 0 && nz < SECTOR_COUNT) {
          neighbors.push({ sectorX: nx, sectorZ: nz });
        }
      }
    }

    return neighbors;
  }

  private heuristic(a: SectorNode, b: SectorNode): number {
    return Math.abs(a.sectorX - b.sectorX) + Math.abs(a.sectorZ - b.sectorZ);
  }

  private nodeKey(node: SectorNode): string {
    return `${node.sectorX}_${node.sectorZ}`;
  }
}
