import { CoordinateConverter } from './CoordinateConverter';
import { worldMapStore } from './WorldMapStore';

export class NavigationTests {
  public static runAllTests(): { passed: number; failed: number; logs: string[] } {
    const logs: string[] = [];
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, testName: string) => {
      if (condition) {
        passed++;
        logs.push(`✅ [PASS] ${testName}`);
      } else {
        failed++;
        logs.push(`❌ [FAIL] ${testName}`);
        console.error(`Navigation Test Failed: ${testName}`);
      }
    };

    logs.push('=== RUNNING NAVIGATION COORDINATE & PATHFINDING TESTS ===');

    // 1. Coordinate Converter Half-Open Boundary Tests
    const secNW = CoordinateConverter.worldToSector({ x: -500, y: 0, z: -500 });
    assert(secNW.sectorX === 0 && secNW.sectorZ === 0, 'World corner (-500, -500) maps to Sector (0, 0)');

    const secSE = CoordinateConverter.worldToSector({ x: 500, y: 0, z: 500 });
    assert(secSE.sectorX === 19 && secSE.sectorZ === 19, 'World corner (500, 500) maps to Sector (19, 19)');

    const secCenter = CoordinateConverter.worldToSector({ x: 0, y: 0, z: 0 });
    assert(secCenter.sectorX === 10 && secCenter.sectorZ === 10, 'World origin (0, 0) maps to Sector (10, 10)');

    const secJustBefore50 = CoordinateConverter.worldToSector({ x: 49.9, y: 0, z: 49.9 });
    assert(secJustBefore50.sectorX === 10 && secJustBefore50.sectorZ === 10, 'Half-open boundary 49.9 maps to Sector (10, 10)');

    const secAt50 = CoordinateConverter.worldToSector({ x: 50.0, y: 0, z: 50.0 });
    assert(secAt50.sectorX === 11 && secAt50.sectorZ === 11, 'Half-open boundary 50.0 maps to Sector (11, 11)');

    // 2. Reversibility & Cell Snapping Tests
    const gridOrigin = CoordinateConverter.worldToGrid({ x: -498, y: 0, z: -498 });
    assert(gridOrigin.sectorX === 0 && gridOrigin.sectorZ === 0 && gridOrigin.gridX === 0 && gridOrigin.gridZ === 0, 'World (-498, -498) maps to Sector (0,0) Cell (0,0)');

    const worldCenterCell = CoordinateConverter.gridToWorld(10, 10, 0, 0);
    assert(worldCenterCell.x === 2.5 && worldCenterCell.z === 2.5, 'Sector (10,10) Cell (0,0) center is at World (2.5, 2.5)');

    // 3. Hierarchical A* Pathfinding Test
    const mapStore = worldMapStore;
    const pathResult = mapStore.getPathfinder().findPath({ x: -18, y: 0, z: -12 }, { x: 5, y: 0, z: -16 });
    assert(pathResult.success && pathResult.waypoints.length > 0, 'A* pathfinding from ben_house to julie_bakery produces valid waypoints');

    logs.push(`=== TEST SUMMARY: ${passed} Passed, ${failed} Failed ===`);
    return { passed, failed, logs };
  }
}
