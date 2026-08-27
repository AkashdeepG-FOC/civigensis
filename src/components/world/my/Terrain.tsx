import React, { useMemo } from 'react';
import * as THREE from 'three';
import { noise2D } from './random';
import { getDistanceToRiverCurve } from './River';

const SIZE = 1000;
const HALF_SIZE = 500;
const SEGMENTS = 160;

// Key village path points to paint dirt paths on terrain
const PATH_NODES = [
  new THREE.Vector3(0, 0, 5),      // Market center
  new THREE.Vector3(-5, 0, 2),     // Market stall 1
  new THREE.Vector3(5, 0, 1.5),    // Market stall 2
  new THREE.Vector3(-22, 0, 25),   // House 1
  new THREE.Vector3(-18, 0, -12),  // House 2
  new THREE.Vector3(5, 0, -16),    // House 3
  new THREE.Vector3(18, 0, 22),    // House 4
  new THREE.Vector3(38, 0, 10),    // House 5
  new THREE.Vector3(0, 0, -65),    // Main River Bridge Landing
  new THREE.Vector3(-35, 0, -32),  // Farm
  new THREE.Vector3(48, 0, -72),   // Cave tunnel
];

function getDistanceToPathSegment(x: number, z: number): number {
  let minSq = Infinity;
  for (let i = 0; i < PATH_NODES.length - 1; i++) {
    const p1 = PATH_NODES[i];
    const p2 = PATH_NODES[i + 1];

    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const lenSq = dx * dx + dz * dz;

    let t = lenSq === 0 ? 0 : ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq;
    t = THREE.MathUtils.clamp(t, 0, 1);

    const projX = p1.x + t * dx;
    const projZ = p1.z + t * dz;

    const dSq = (x - projX) * (x - projX) + (z - projZ) * (z - projZ);
    if (dSq < minSq) minSq = dSq;
  }
  return Math.sqrt(minSq);
}

export function getTerrainHeight(x: number, z: number): number {
  const distFromCenter = Math.sqrt(x * x + z * z);
  const flattenCenter = THREE.MathUtils.smoothstep(distFromCenter, 25, 90);

  let y = noise2D(x, z) * flattenCenter;

  // Mountain ridge rise along northern border
  if (z < -250) {
    const mFactor = THREE.MathUtils.smoothstep(-z, 250, 480);
    y += mFactor * 35.0;
  }

  // Flatten central village square
  if (distFromCenter < 25) {
    y *= 0.1;
  }

  // Flatten Ben's 200m x 200m Farm estate plateau around (120, -160)
  const distFromFarm = Math.sqrt((x - 120) * (x - 120) + (z - -160) * (z - -160));
  if (distFromFarm < 130) {
    const farmFlatten = THREE.MathUtils.smoothstep(distFromFarm, 100, 130);
    y *= farmFlatten;
  }

  // Ensure terrain height stays above 0.0 to avoid clipping into backdrop plane
  return Math.max(0.0, y);
}

export const Terrain: React.FC = () => {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors: number[] = [];

    const grassLight = new THREE.Color('#8bc267');
    const grassDark = new THREE.Color('#5a9450');
    const dirtColor = new THREE.Color('#c29b67');
    const rockColor = new THREE.Color('#646961');
    const riverbankColor = new THREE.Color('#947754'); // Subtle wet sand along outer riverbank

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      let y = getTerrainHeight(x, z);
      pos.setY(i, y);

      // Color lerp based on height, slope, and path proximity
      const tHeight = THREE.MathUtils.clamp((y + 3) / 12, 0, 1);
      let c = grassDark.clone().lerp(grassLight, tHeight);

      // Dirt path blending
      const distToPath = getDistanceToPathSegment(x, z);
      if (distToPath < 4.5) {
        const pathFactor = 1 - distToPath / 4.5;
        c.lerp(dirtColor, pathFactor * 0.85);
      }

      // High mountain rocks
      if (z < -280 || y > 15) {
        const rockFactor = THREE.MathUtils.clamp((y - 12) / 25, 0, 1);
        c.lerp(rockColor, rockFactor);
      }

      // Outer riverbank subtle grass/mud shading
      const { distance, halfWidth } = getDistanceToRiverCurve(x, z);
      if (distance < halfWidth + 2.0) {
        const bankLerp = 1 - distance / (halfWidth + 2.0);
        c.lerp(riverbankColor, THREE.MathUtils.clamp(bankLerp * 0.6, 0, 0.6));
      }

      colors.push(c.r, c.g, c.b);
    }

    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Main 1000m x 1000m Village Sculpted Terrain */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Perimeter Terrain Side Walls (4 Vertical Edge Curtains preventing under-map void - No interior top face) */}
      <group>
        {/* North Edge Wall */}
        <mesh position={[0, -15, -HALF_SIZE]} rotation={[0, 0, 0]}>
          <planeGeometry args={[SIZE, 30]} />
          <meshStandardMaterial color="#5a9450" flatShading roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* South Edge Wall */}
        <mesh position={[0, -15, HALF_SIZE]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SIZE, 30]} />
          <meshStandardMaterial color="#5a9450" flatShading roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* East Edge Wall */}
        <mesh position={[HALF_SIZE, -15, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[SIZE, 30]} />
          <meshStandardMaterial color="#5a9450" flatShading roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* West Edge Wall */}
        <mesh position={[-HALF_SIZE, -15, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[SIZE, 30]} />
          <meshStandardMaterial color="#5a9450" flatShading roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Extended Outer Horizon Ground Plane (4000m x 4000m seamless grass backdrop placed safely at Y = -1.0m) */}
      <mesh position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial color="#5a9450" roughness={0.95} metalness={0.05} polygonOffset polygonOffsetFactor={2} polygonOffsetUnits={2} />
      </mesh>
    </group>
  );
};

export default Terrain;
