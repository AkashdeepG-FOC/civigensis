import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from './Terrain';
import { isPointOnBridge } from './Bridge';

export const BASE_RIVER_WIDTH = 12.0;

// Catmull-Rom curve stretching across outer northern landscape (outside the village settlement)
const CURVE_POINTS = [
  new THREE.Vector3(-220, 12.0, -280), // Northwest mountain stream origin
  new THREE.Vector3(-140, 5.0, -170),
  new THREE.Vector3(-80, 2.2, -95),
  new THREE.Vector3(-30, 1.4, -70),
  new THREE.Vector3(0, 1.2, -65),     // Outer northern riverbank spot [0, 1.5, -65]
  new THREE.Vector3(40, 1.3, -68),
  new THREE.Vector3(85, 1.4, -55),
  new THREE.Vector3(140, 1.1, -20),
  new THREE.Vector3(220, 0.8, 40),
  new THREE.Vector3(380, 0.5, 120),    // Exits southeast border
];

export const riverCurve = new THREE.CatmullRomCurve3(CURVE_POINTS);

// Pre-sample points along outer river curve for distance & navigation calculations
const NUM_RIVER_SAMPLES = 200;
export const sampledRiverPoints: { point: THREE.Vector3; halfWidth: number; t: number }[] = [];

for (let i = 0; i <= NUM_RIVER_SAMPLES; i++) {
  const t = i / NUM_RIVER_SAMPLES;
  const point = riverCurve.getPointAt(t);
  const width = BASE_RIVER_WIDTH * (1 + t * 0.5); // 12m to 18m wide!
  sampledRiverPoints.push({ point, halfWidth: width / 2, t });
}

export function getDistanceToRiverCurve(x: number, z: number): {
  distance: number;
  halfWidth: number;
  t: number;
  riverY: number;
  closestPoint: THREE.Vector3;
} {
  let minSq = Infinity;
  let bestSample = sampledRiverPoints[0];

  for (let i = 0; i < sampledRiverPoints.length; i++) {
    const s = sampledRiverPoints[i];
    const dx = x - s.point.x;
    const dz = z - s.point.z;
    const dSq = dx * dx + dz * dz;
    if (dSq < minSq) {
      minSq = dSq;
      bestSample = s;
    }
  }

  return {
    distance: Math.sqrt(minSq),
    halfWidth: bestSample.halfWidth,
    t: bestSample.t,
    riverY: bestSample.point.y,
    closestPoint: bestSample.point,
  };
}

export function isPointInRiverWater(x: number, z: number): boolean {
  if (isPointOnBridge(x, z)) return false;
  const { distance, halfWidth } = getDistanceToRiverCurve(x, z);
  return distance < halfWidth - 0.5;
}

export function getRiverWaterSurfaceHeight(x: number, z: number): number {
  return getTerrainHeight(x, z) + 0.25;
}

interface RiverProps {
  width?: number;
}

export const River: React.FC<RiverProps> = ({ width = BASE_RIVER_WIDTH }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const { geometry, initialYPositions } = useMemo(() => {
    const segments = 200;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = riverCurve.getPointAt(t);
      const tangent = riverCurve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Dynamic width expanding from 12m to 18m downstream
      const currentWidth = width * (1 + t * 0.5);

      const left = point.clone().addScaledVector(normal, currentWidth / 2);
      const right = point.clone().addScaledVector(normal, -currentWidth / 2);
      const center = point.clone();

      // Elevate water Y surface +0.25m above terrain height to prevent clipping/z-fighting
      const leftY = getTerrainHeight(left.x, left.z) + 0.22;
      const rightY = getTerrainHeight(right.x, right.z) + 0.22;
      const centerY = getTerrainHeight(center.x, center.z) + 0.25;

      // 3-vertex cross section (Left, Center, Right) for smooth 3D terrain conformity
      positions.push(
        left.x, leftY, left.z,
        center.x, centerY, center.z,
        right.x, rightY, right.z
      );

      uvs.push(0, t * 15, 0.5, t * 15, 1, t * 15);

      if (i < segments) {
        const row1 = i * 3;
        const row2 = (i + 1) * 3;

        // Triangles for Left-Center quad
        indices.push(row1, row1 + 1, row2);
        indices.push(row1 + 1, row2 + 1, row2);

        // Triangles for Center-Right quad
        indices.push(row1 + 1, row1 + 2, row2 + 1);
        indices.push(row1 + 2, row2 + 2, row2 + 1);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const yVals = new Float32Array(positions.length / 3);
    for (let i = 0; i < yVals.length; i++) {
      yVals[i] = positions[i * 3 + 1];
    }

    return { geometry: geo, initialYPositions: yVals };
  }, [width]);

  // Animated low-poly water wave flow
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.elapsedTime;
      const posAttr = meshRef.current.geometry.attributes.position;

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vz = posAttr.getZ(i);
        const baseY = initialYPositions[i];
        const wave = Math.sin(time * 2.2 + vx * 0.25 + vz * 0.25) * 0.05;
        posAttr.setY(i, baseY + wave);
      }
      posAttr.needsUpdate = true;
    }

    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.22 + Math.sin(clock.elapsedTime * 1.5) * 0.06;
    }
  });

  // Low-poly bank rocks & vegetation along outer river edges
  const bankDecorations = useMemo(() => {
    const decos: { pos: [number, number, number]; scale: number; rot: number; type: 'rock' | 'reed' }[] = [];
    const sampleIndices = [15, 35, 60, 85, 110, 135, 160, 185];

    sampleIndices.forEach((idx, i) => {
      const t = idx / 200;
      const pt = riverCurve.getPointAt(t);
      const tan = riverCurve.getTangentAt(t);
      const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const currentWidth = width * (1 + t * 0.5);

      const side = i % 2 === 0 ? 1 : -1;
      const pos = pt.clone().addScaledVector(norm, side * (currentWidth / 2 + 1.0));
      pos.y = getTerrainHeight(pos.x, pos.z) + 0.3;

      decos.push({
        pos: [pos.x, pos.y, pos.z],
        scale: 0.8 + (i % 3) * 0.4,
        rot: i * 0.7,
        type: i % 3 === 0 ? 'reed' : 'rock',
      });
    });

    return decos;
  }, [width]);

  const debugCenterY = getTerrainHeight(0, -65) + 3.2;

  return (
    <group>
      {/* Bold 12m-18m Low-Poly Water Surface Mesh (Elevated Y = terrain + 0.25) */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          ref={matRef}
          color="#0284c7"
          emissive="#0369a1"
          emissiveIntensity={0.25}
          roughness={0.1}
          metalness={0.2}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>

      {/* Temporary Floating Debug Label above the river */}
    

      {/* Accessible Riverbank Marker & Landing at [0, 1.2, -65] */}
      <group position={[0, getTerrainHeight(0, -65) + 0.1, -65]}>
        <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.5, 2.8, 0.3, 8]} />
          <meshStandardMaterial color="#78716c" flatShading roughness={0.9} />
        </mesh>
      </group>

      {/* Low-Poly Bank Rocks & Reeds along outer river course */}
      {bankDecorations.map((d, i) => (
        <group key={i} position={d.pos} rotation={[0, d.rot, 0]} scale={d.scale}>
          {d.type === 'rock' ? (
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color="#64748b" flatShading roughness={0.9} />
            </mesh>
          ) : (
            <group>
              <mesh position={[0, 0.5, 0]} castShadow>
                <coneGeometry args={[0.25, 1.0, 5]} />
                <meshStandardMaterial color="#16a34a" flatShading />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

export default River;
