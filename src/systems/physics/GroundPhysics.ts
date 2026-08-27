import { getTerrainHeight } from '../../components/world/my/Terrain';
import { isPointInRiverWater, getRiverWaterSurfaceHeight } from '../../components/world/my/River';
import { isPointOnBridge, getBridgeDeckHeight } from '../../components/world/my/Bridge';

export const MAX_WALKABLE_SLOPE_DEG = 35.0; // 35 degrees max slope limit

export interface GroundQueryResult {
  groundY: number;
  slopeAngleDeg: number;
  slopeGradient: number;
  isWalkable: boolean;
  hitType: 'LAND' | 'BRIDGE' | 'WATER' | 'CLIFF';
}

/**
 * Calculates local terrain slope gradient and angle in degrees at (x, z)
 */
export function getTerrainSlope(x: number, z: number, sampleDistance = 0.5): { angleDeg: number; gradient: number } {
  const h = getTerrainHeight(x, z);
  const hX = getTerrainHeight(x + sampleDistance, z);
  const hZ = getTerrainHeight(x, z + sampleDistance);

  const dhdx = (hX - h) / sampleDistance;
  const dhdz = (hZ - h) / sampleDistance;

  const gradient = Math.sqrt(dhdx * dhdx + dhdz * dhdz);
  const angleRad = Math.atan(gradient);
  const angleDeg = (angleRad * 180) / Math.PI;

  return { angleDeg, gradient };
}

/**
 * Unified ground height resolver across land terrain, bridge surfaces, and river water.
 */
export function getDetectedGroundHeight(x: number, z: number): GroundQueryResult {
  const onBridge = isPointOnBridge(x, z);
  const inWater = isPointInRiverWater(x, z);

  if (onBridge) {
    const bridgeY = getBridgeDeckHeight(x, z);
    return {
      groundY: bridgeY,
      slopeAngleDeg: 2.0, // Arched bridge low slope
      slopeGradient: 0.035,
      isWalkable: true,
      hitType: 'BRIDGE',
    };
  }

  if (inWater) {
    const waterY = getRiverWaterSurfaceHeight(x, z);
    return {
      groundY: waterY - 0.45,
      slopeAngleDeg: 0,
      slopeGradient: 0,
      isWalkable: true,
      hitType: 'WATER',
    };
  }

  // Land terrain evaluation
  const landY = getTerrainHeight(x, z);
  const { angleDeg, gradient } = getTerrainSlope(x, z);

  const isSteep = angleDeg > MAX_WALKABLE_SLOPE_DEG || z < -280;
  const isWalkable = !isSteep;

  return {
    groundY: landY,
    slopeAngleDeg: Math.round(angleDeg * 10) / 10,
    slopeGradient: Math.round(gradient * 100) / 100,
    isWalkable,
    hitType: isSteep ? 'CLIFF' : 'LAND',
  };
}
