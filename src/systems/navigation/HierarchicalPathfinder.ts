import { WorldMap } from './WorldMap';
import { SectorGraph } from './SectorGraph';
import { LocalAStar } from './LocalAStar';
import { CoordinateConverter } from './CoordinateConverter';
import { WorldPosition, PathfindingResult } from './types/navigationMap';
import { getTerrainHeight } from '../../components/world/my/Terrain';
import { getBridgeTransform } from '../../components/world/my/Bridge';

export class HierarchicalPathfinder {
  private map: WorldMap;
  private sectorGraph: SectorGraph;
  private localAStar: LocalAStar;

  constructor(map: WorldMap) {
    this.map = map;
    this.sectorGraph = new SectorGraph(map);
    this.localAStar = new LocalAStar(map);
  }

  /**
   * Main entry point to find a path from start position to destination location ID or target position
   */
  public findPath(
    startPos: WorldPosition | [number, number, number],
    target: string | WorldPosition | [number, number, number]
  ): PathfindingResult {
    let destPos: WorldPosition;

    if (typeof target === 'string') {
      const loc = this.map.getSemanticLocation(target);
      if (!loc) {
        destPos = { x: 0, y: 0, z: 5 };
      } else {
        destPos = loc.position;
      }
    } else if (Array.isArray(target)) {
      destPos = { x: target[0], y: target[1], z: target[2] };
    } else {
      destPos = target;
    }

    const sx = Array.isArray(startPos) ? startPos[0] : startPos.x;
    const sy = Array.isArray(startPos) ? startPos[1] : startPos.y;
    const sz = Array.isArray(startPos) ? startPos[2] : startPos.z;

    console.log(`[NAV] Current position: x: ${sx.toFixed(1)}, y: ${sy.toFixed(1)}, z: ${sz.toFixed(1)}`);
    console.log(`[NAV] Destination world position: x: ${destPos.x.toFixed(1)}, y: ${destPos.y.toFixed(1)}, z: ${destPos.z.toFixed(1)}`);

    // Find nearest walkable cell nodes for start and destination positions
    const startCell = this.map.findNearestWalkableCell(startPos);
    const destCell = this.map.findNearestWalkableCell(destPos);

    if (!startCell) {
      console.warn(`[NAV ERROR] No walkable start node near character position (${sx.toFixed(1)}, ${sz.toFixed(1)})`);
    } else {
      console.log(`[NAV] Nearest start node: x: ${startCell.worldPos.x.toFixed(1)}, y: ${startCell.worldPos.y.toFixed(1)}, z: ${startCell.worldPos.z.toFixed(1)}`);
    }

    if (!destCell) {
      console.warn(`[NAV ERROR] No walkable destination node near destination position (${destPos.x.toFixed(1)}, ${destPos.z.toFixed(1)})`);
    } else {
      console.log(`[NAV] Nearest destination node: x: ${destCell.worldPos.x.toFixed(1)}, y: ${destCell.worldPos.y.toFixed(1)}, z: ${destCell.worldPos.z.toFixed(1)}`);
    }

    console.log(`[NAV] Running A*`);

    const startGrid = startCell
      ? CoordinateConverter.worldToGrid([startCell.worldPos.x, startCell.worldPos.y, startCell.worldPos.z])
      : CoordinateConverter.worldToGrid(startPos);

    const destGrid = destCell
      ? CoordinateConverter.worldToGrid([destCell.worldPos.x, destCell.worldPos.y, destCell.worldPos.z])
      : CoordinateConverter.worldToGrid(destPos);

    // 1. High-Level Sector Route Pass
    const sectorRoute = this.sectorGraph.findSectorRoute(
      { sectorX: startGrid.sectorX, sectorZ: startGrid.sectorZ },
      { sectorX: destGrid.sectorX, sectorZ: destGrid.sectorZ }
    );

    if (sectorRoute) {
      const allowedSectors = new Set<string>();
      sectorRoute.forEach((s) => allowedSectors.add(`${s.sectorX}_${s.sectorZ}`));

      const waypoints = this.localAStar.findCellPath(startGrid, destGrid, allowedSectors);

      if (waypoints && waypoints.length > 0) {
        waypoints[waypoints.length - 1] = { ...destPos };

        let distance = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
          const p1 = waypoints[i];
          const p2 = waypoints[i + 1];
          const dx = p2.x - p1.x;
          const dz = p2.z - p1.z;
          distance += Math.sqrt(dx * dx + dz * dz);
        }

        console.log(`[NAV] Path found: ${waypoints.length} nodes (Cell A* Sector Corridor)`);

        return {
          success: true,
          waypoints,
          distance: Math.round(distance * 10) / 10,
          sectorPath: sectorRoute,
        };
      }
    }

    // 3. Fallback Open-World Direct Waypoint Corridor with Bridge Crossing
    return this.generateDirectFallbackPath(startPos, destPos);
  }

  private generateDirectFallbackPath(
    startPos: WorldPosition | [number, number, number],
    destPos: WorldPosition
  ): PathfindingResult {
    const sx = Array.isArray(startPos) ? startPos[0] : startPos.x;
    const sz = Array.isArray(startPos) ? startPos[2] : startPos.z;

    const dx = destPos.x - sx;
    const dz = destPos.z - sz;
    const dist = Math.sqrt(dx * dx + dz * dz);

    const waypoints: WorldPosition[] = [];

    // Query bridge position dynamically from Bridge component transform
    const bridgeTransform = getBridgeTransform(0.38);
    const bridgeX = bridgeTransform.position[0];
    const bridgeZ = bridgeTransform.position[2];

    // River crossing check (river is at z = -65)
    const isStartSouth = sz > -55;
    const isDestNorth = destPos.z < -75;
    const isStartNorth = sz < -75;
    const isDestSouth = destPos.z > -55;
    const crossesRiver = (isStartSouth && isDestNorth) || (isStartNorth && isDestSouth);

    if (crossesRiver) {
      if (isStartSouth) {
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, -50), z: -50 });
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, bridgeZ) + 0.35, z: bridgeZ });
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, -80), z: -80 });
      } else {
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, -80), z: -80 });
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, bridgeZ) + 0.35, z: bridgeZ });
        waypoints.push({ x: bridgeX, y: getTerrainHeight(bridgeX, -50), z: -50 });
      }

      const lastW = waypoints[waypoints.length - 1];
      const d2x = destPos.x - lastW.x;
      const d2z = destPos.z - lastW.z;
      const dist2 = Math.sqrt(d2x * d2x + d2z * d2z);
      const steps2 = Math.max(2, Math.ceil(dist2 / 15.0));

      for (let i = 1; i <= steps2; i++) {
        const t = i / steps2;
        const wx = lastW.x + d2x * t;
        const wz = lastW.z + d2z * t;
        waypoints.push({ x: wx, y: getTerrainHeight(wx, wz), z: wz });
      }
    } else {
      const stepCount = Math.max(2, Math.ceil(dist / 15.0));
      for (let i = 1; i <= stepCount; i++) {
        const t = i / stepCount;
        const wx = sx + dx * t;
        const wz = sz + dz * t;
        waypoints.push({ x: wx, y: getTerrainHeight(wx, wz), z: wz });
      }
    }

    console.log(`[NAV] Path found: ${waypoints.length} nodes (Bridge River Detour: ${crossesRiver ? 'YES' : 'NO'}, ${dist.toFixed(1)}m)`);

    return {
      success: true,
      waypoints,
      distance: Math.round(dist * 10) / 10,
    };
  }
}
