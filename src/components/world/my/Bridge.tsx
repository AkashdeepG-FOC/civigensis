import React, { useMemo } from 'react';
import * as THREE from 'three';
import { riverCurve } from './River';
import { getTerrainHeight } from './Terrain';

export const DEFAULT_BRIDGE_CURVE_T = 0.38;
export const BRIDGE_LENGTH = 22.0;
export const BRIDGE_WIDTH = 4.0;

export function getBridgeTransform(curveT: number = DEFAULT_BRIDGE_CURVE_T) {
  const pt = riverCurve.getPointAt(curveT);
  const tan = riverCurve.getTangentAt(curveT);
  const angle = Math.atan2(tan.x, tan.z) + Math.PI / 2;
  const bankY = getTerrainHeight(pt.x, pt.z);
  const baseY = bankY + 0.35;
  return { pt, tan, angle, bankY, baseY, position: [pt.x, baseY, pt.z] as [number, number, number] };
}

export function isPointOnBridge(x: number, z: number, curveT: number = DEFAULT_BRIDGE_CURVE_T): boolean {
  const { pt, angle } = getBridgeTransform(curveT);
  const dx = x - pt.x;
  const dz = z - pt.z;

  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  const localX = dx * cosA - dz * sinA;
  const localZ = dx * sinA + dz * cosA;

  return Math.abs(localZ) <= BRIDGE_LENGTH / 2 + 1.2 && Math.abs(localX) <= BRIDGE_WIDTH / 2 + 0.5;
}

export function getBridgeDeckHeight(x: number, z: number, curveT: number = DEFAULT_BRIDGE_CURVE_T): number {
  const { pt, angle, baseY } = getBridgeTransform(curveT);
  const dx = x - pt.x;
  const dz = z - pt.z;

  const cosA = Math.cos(-angle);
  const sinA = Math.sin(-angle);

  const localZ = dx * sinA + dz * cosA;
  const halfLen = BRIDGE_LENGTH / 2;
  const tOff = Math.min(1, Math.max(-1, localZ / halfLen));
  const archY = (1 - tOff * tOff) * 1.0;

  return baseY + archY + 0.18;
}

interface BridgeProps {
  curveT?: number;
}

export const Bridge: React.FC<BridgeProps> = ({ curveT = DEFAULT_BRIDGE_CURVE_T }) => {
  const { position, angle } = useMemo(() => {
    return getBridgeTransform(curveT);
  }, [curveT]);

  const length = BRIDGE_LENGTH;
  const halfLen = length / 2;
  const plankCount = 36;

  return (
    <group position={position} rotation={[0, angle, 0]}>
      {/* Arched Planks Deck spanning high across the river */}
      {Array.from({ length: plankCount }).map((_, i) => {
        const off = (i / (plankCount - 1) - 0.5) * length;
        const tOff = off / halfLen;
        const archY = (1 - tOff * tOff) * 1.0;
        return (
          <mesh key={i} castShadow receiveShadow position={[0, archY, off]}>
            <boxGeometry args={[3.4, 0.18, length / plankCount + 0.08]} />
            <meshStandardMaterial color="#8a6540" flatShading roughness={0.9} />
          </mesh>
        );
      })}

      {/* Side Handrails & Balusters following the arch */}
      {[-1.7, 1.7].map((x, idx) => (
        <group key={idx}>
          {/* Main top rail segments following curve slope */}
          {Array.from({ length: plankCount - 1 }).map((_, i) => {
            const off1 = (i / (plankCount - 1) - 0.5) * length;
            const off2 = ((i + 1) / (plankCount - 1) - 0.5) * length;
            const midOff = (off1 + off2) / 2;
            const tOff = midOff / halfLen;
            const archY = (1 - tOff * tOff) * 1.0;
            const slope = (-2 * tOff * 1.0) / halfLen;
            const rotX = Math.atan(slope);

            return (
              <mesh key={i} castShadow position={[x, archY + 0.7, midOff]} rotation={[rotX, 0, 0]}>
                <boxGeometry args={[0.16, 0.14, length / plankCount + 0.1]} />
                <meshStandardMaterial color="#6b4a35" flatShading roughness={0.9} />
              </mesh>
            );
          })}

          {/* Vertical baluster posts */}
          {Array.from({ length: 18 }).map((_, i) => {
            const off = (i / 17 - 0.5) * length;
            const tOff = off / halfLen;
            const archY = (1 - tOff * tOff) * 1.0;
            return (
              <mesh key={i} castShadow position={[x, archY + 0.35, off]}>
                <cylinderGeometry args={[0.07, 0.07, 0.65, 6]} />
                <meshStandardMaterial color="#5c3d28" flatShading />
              </mesh>
            );
          })}
        </group>
      ))}

      {/* Stone Support Pillars reaching down into the riverbed */}
      {[-halfLen + 2.0, -halfLen * 0.4, 0, halfLen * 0.4, halfLen - 2.0].map((z, i) => {
        const tOff = z / halfLen;
        const archY = (1 - tOff * tOff) * 1.0;
        const height = archY + 3.0;
        return (
          <mesh key={i} castShadow receiveShadow position={[0, archY - height / 2 + 0.1, z]}>
            <cylinderGeometry args={[0.5, 0.7, height, 8]} />
            <meshStandardMaterial color="#57595d" flatShading roughness={0.9} />
          </mesh>
        );
      })}

      {/* Lantern Posts at Bridge Ends */}
      {[-1.75, 1.75].map((x, xIdx) =>
        [-halfLen, halfLen].map((z, zIdx) => (
          <group key={`${xIdx}-${zIdx}`} position={[x, 0.6, z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
              <meshStandardMaterial color="#333333" />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.22, 0.28, 0.22]} />
              <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.9} />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
};

export default Bridge;


