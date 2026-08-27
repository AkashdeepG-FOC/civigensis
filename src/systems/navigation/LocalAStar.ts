import { WorldMap } from './WorldMap';
import { NavCell, WorldPosition } from './types/navigationMap';
import { CoordinateConverter } from './CoordinateConverter';

export interface GridNode {
  sectorX: number;
  sectorZ: number;
  gridX: number;
  gridZ: number;
}

export class LocalAStar {
  private map: WorldMap;

  constructor(map: WorldMap) {
    this.map = map;
  }

  /**
   * Performs 8-directional A* pathfinding across local cells
   */
  public findCellPath(
    start: GridNode,
    dest: GridNode,
    allowedSectors?: Set<string>
  ): WorldPosition[] | null {
    const startCell = this.map.getCell(start.sectorX, start.sectorZ, start.gridX, start.gridZ);
    const destCell = this.map.getCell(dest.sectorX, dest.sectorZ, dest.gridX, dest.gridZ);

    if (!startCell || !destCell) return null;

    // Fast-path: start and dest are identical cell
    if (
      start.sectorX === dest.sectorX &&
      start.sectorZ === dest.sectorZ &&
      start.gridX === dest.gridX &&
      start.gridZ === dest.gridZ
    ) {
      return [destCell.worldPos];
    }

    const openSet: GridNode[] = [start];
    const cameFrom: Map<string, GridNode> = new Map();

    const gScore: Map<string, number> = new Map();
    const fScore: Map<string, number> = new Map();

    const startKey = this.nodeKey(start);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(start, dest));

    const maxIterations = 2000;
    let iterations = 0;

    while (openSet.length > 0 && iterations++ < maxIterations) {
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

      if (
        current.sectorX === dest.sectorX &&
        current.sectorZ === dest.sectorZ &&
        current.gridX === dest.gridX &&
        current.gridZ === dest.gridZ
      ) {
        // Reconstruct waypoints
        const waypoints: WorldPosition[] = [];
        let curr: GridNode | undefined = current;
        while (curr) {
          const cell = this.map.getCell(curr.sectorX, curr.sectorZ, curr.gridX, curr.gridZ);
          if (cell) {
            waypoints.unshift({ ...cell.worldPos });
          }
          const cKey = this.nodeKey(curr);
          curr = cameFrom.get(cKey);
        }
        return waypoints;
      }

      openSet.splice(currentIdx, 1);

      const neighbors = this.getNeighbors(current, allowedSectors);

      for (const neighbor of neighbors) {
        const neighborCell = this.map.getCell(
          neighbor.sectorX,
          neighbor.sectorZ,
          neighbor.gridX,
          neighbor.gridZ
        );
        if (!neighborCell || !neighborCell.walkable) continue;

        const neighborKey = this.nodeKey(neighbor);
        const isDiagonal =
          neighbor.sectorX !== current.sectorX ||
          neighbor.sectorZ !== current.sectorZ ||
          neighbor.gridX !== current.gridX && neighbor.gridZ !== current.gridZ;

        const stepCost = (isDiagonal ? 1.414 : 1.0) * neighborCell.cost;
        const tentativeG = (gScore.get(currentKey) ?? Infinity) + stepCost;

        if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeG);
          fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, dest));

          if (!openSet.some((n) => this.nodeKey(n) === neighborKey)) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null; // No path found
  }

  private getNeighbors(node: GridNode, allowedSectors?: Set<string>): GridNode[] {
    const neighbors: GridNode[] = [];
    const deltas = [
      { dx: 0, dz: -1 }, // North
      { dx: 0, dz: 1 },  // South
      { dx: 1, dz: 0 },  // East
      { dx: -1, dz: 0 }, // West
      { dx: -1, dz: -1 }, // NW
      { dx: 1, dz: -1 },  // NE
      { dx: -1, dz: 1 },  // SW
      { dx: 1, dz: 1 },   // SE
    ];

    const currentCell = this.map.getCell(node.sectorX, node.sectorZ, node.gridX, node.gridZ);
    if (!currentCell) return [];

    const { x, y, z } = currentCell.worldPos;

    for (const d of deltas) {
      const targetWorldX = x + d.dx * 5;
      const targetWorldZ = z + d.dz * 5;

      const targetGrid = CoordinateConverter.worldToGrid({ x: targetWorldX, y, z: targetWorldZ });
      const secKey = `${targetGrid.sectorX}_${targetGrid.sectorZ}`;

      if (allowedSectors && !allowedSectors.has(secKey)) {
        continue;
      }

      const targetCell = this.map.getCell(
        targetGrid.sectorX,
        targetGrid.sectorZ,
        targetGrid.gridX,
        targetGrid.gridZ
      );

      if (targetCell && targetCell.walkable) {
        neighbors.push(targetGrid);
      }
    }

    return neighbors;
  }

  private heuristic(a: GridNode, b: GridNode): number {
    const posA = CoordinateConverter.gridToWorld(a.sectorX, a.sectorZ, a.gridX, a.gridZ);
    const posB = CoordinateConverter.gridToWorld(b.sectorX, b.sectorZ, b.gridX, b.gridZ);

    const dx = posA.x - posB.x;
    const dz = posA.z - posB.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  private nodeKey(node: GridNode): string {
    return `${node.sectorX}_${node.sectorZ}_${node.gridX}_${node.gridZ}`;
  }
}
