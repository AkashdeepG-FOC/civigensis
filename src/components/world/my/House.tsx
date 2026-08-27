import React from 'react';

const ROOF_COLORS = ['#b54834', '#556575', '#7a4e38', '#9e3f2d', '#4a5c6d'];
const WALL_COLORS = ['#e8dcc0', '#f0e6cf', '#ddd0ab', '#e3d5b8'];

export interface HouseProps {
  position?: [number, number, number];
  rotation?: number;
  width?: number;
  depth?: number;
  wallHeight?: number;
  roofHeight?: number;
  roofColor?: string;
  wallColor?: string;
  chimney?: boolean;
  porch?: boolean;
  fence?: boolean;
}

export const House: React.FC<HouseProps> = ({
  position = [0, 0, 0],
  rotation = 0,
  width = 4.2,
  depth = 3.6,
  wallHeight = 2.5,
  roofHeight = 2.2,
  roofColor,
  wallColor,
  chimney = true,
  porch = true,
  fence = true,
}) => {
  const roof =
    roofColor ||
    ROOF_COLORS[Math.floor(Math.abs(position[0] * 3 + position[2] * 7)) % ROOF_COLORS.length];
  const wall =
    wallColor ||
    WALL_COLORS[Math.floor(Math.abs(position[0] + position[2] * 2)) % WALL_COLORS.length];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stone Foundation Base */}
      <mesh receiveShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[width + 0.2, 0.3, depth + 0.2]} />
        <meshStandardMaterial color="#646669" flatShading roughness={0.9} />
      </mesh>

      {/* Main Walls */}
      <mesh castShadow receiveShadow position={[0, wallHeight / 2 + 0.15, 0]}>
        <boxGeometry args={[width, wallHeight, depth]} />
        <meshStandardMaterial color={wall} flatShading roughness={0.8} />
      </mesh>

      {/* Timber Corner Posts & Cross Beams */}
      {[-width / 2, width / 2].map((x, xIdx) =>
        [-depth / 2, depth / 2].map((z, zIdx) => (
          <mesh key={`${xIdx}-${zIdx}`} castShadow position={[x, wallHeight / 2 + 0.15, z]}>
            <boxGeometry args={[0.22, wallHeight + 0.05, 0.22]} />
            <meshStandardMaterial color="#4a3323" flatShading roughness={1} />
          </mesh>
        ))
      )}

      {/* Roof (Pyramid / Gable) */}
      <mesh
        castShadow
        position={[0, wallHeight + roofHeight / 2 + 0.15, 0]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <coneGeometry args={[Math.SQRT2 * (Math.max(width, depth) / 2 + 0.45), roofHeight, 4]} />
        <meshStandardMaterial color={roof} flatShading roughness={0.7} />
      </mesh>

      {/* Chimney */}
      {chimney && (
        <mesh castShadow position={[width / 3, wallHeight + roofHeight * 0.7, depth / 4]}>
          <boxGeometry args={[0.5, 1.6, 0.5]} />
          <meshStandardMaterial color="#737578" flatShading roughness={1} />
        </mesh>
      )}

      {/* Front Door */}
      <mesh position={[0, 0.8, depth / 2 + 0.02]}>
        <boxGeometry args={[0.85, 1.5, 0.06]} />
        <meshStandardMaterial color="#3d2516" flatShading roughness={0.9} />
      </mesh>

      {/* Windows with glowing/reflected glass */}
      {[-width / 3, width / 3].map((x, i) => (
        <group key={i} position={[x, wallHeight * 0.65, depth / 2 + 0.02]}>
          <mesh>
            <boxGeometry args={[0.6, 0.6, 0.06]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.2} roughness={0.2} />
          </mesh>
          {/* Window Frame Cross */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.62, 0.06, 0.02]} />
            <meshStandardMaterial color="#3d2516" />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.06, 0.62, 0.02]} />
            <meshStandardMaterial color="#3d2516" />
          </mesh>
        </group>
      ))}

      {/* Porch roof & posts */}
      {porch && (
        <group position={[0, 0, depth / 2 + 0.6]}>
          <mesh castShadow position={[0, wallHeight * 0.55, 0]}>
            <boxGeometry args={[1.6, 0.1, 1.2]} />
            <meshStandardMaterial color={roof} flatShading />
          </mesh>
          {[-0.7, 0.7].map((px, idx) => (
            <mesh key={idx} castShadow position={[px, wallHeight * 0.27, 0.45]}>
              <cylinderGeometry args={[0.06, 0.06, wallHeight * 0.55, 6]} />
              <meshStandardMaterial color="#4a3323" flatShading />
            </mesh>
          ))}
        </group>
      )}

      {/* Side Log Pile (Firewood) */}
      <group position={[width / 2 + 0.6, 0.25, 0]}>
        {[0, 0.12, 0.24].map((y, yIdx) =>
          [-0.3, 0, 0.3].map((z, zIdx) => (
            <mesh key={`${yIdx}-${zIdx}`} position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.08, 0.08, 0.7, 6]} />
              <meshStandardMaterial color="#7c5535" flatShading />
            </mesh>
          ))
        )}
      </group>

      {/* Low Wooden Perimeter Fence */}
      {fence && (
        <group>
          {Array.from({ length: 8 }).map((_, i) => {
            const fx = -width / 2 - 1.2 + i * 0.9;
            return (
              <mesh key={i} castShadow position={[fx, 0.4, depth / 2 + 1.4]}>
                <boxGeometry args={[0.1, 0.8, 0.1]} />
                <meshStandardMaterial color="#5c3d28" flatShading />
              </mesh>
            );
          })}
          <mesh castShadow position={[0, 0.6, depth / 2 + 1.4]}>
            <boxGeometry args={[width + 2.4, 0.08, 0.06]} />
            <meshStandardMaterial color="#5c3d28" flatShading />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default House;
