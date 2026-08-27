import React from 'react';

interface VillageCenterProps {
  position?: [number, number, number];
}

export const VillageCenter: React.FC<VillageCenterProps> = ({ position = [0, 0, 5] }) => {
  return (
    <group position={position}>
      {/* Central Stone Well */}
      <group position={[0, 0, 0]}>
        {/* Stone Base */}
        <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
          <cylinderGeometry args={[1.0, 1.1, 0.9, 12]} />
          <meshStandardMaterial color="#646669" flatShading roughness={0.9} />
        </mesh>
        {/* Inner Water Hole */}
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.75, 0.75, 0.1, 12]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} />
        </mesh>
        {/* Wooden Support Posts */}
        {[-0.85, 0.85].map((x, idx) => (
          <mesh key={idx} castShadow position={[x, 1.35, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 1.8, 6]} />
            <meshStandardMaterial color="#5c3d28" flatShading />
          </mesh>
        ))}
        {/* Cross beam & Pulley */}
        <mesh castShadow position={[0, 2.2, 0]}>
          <boxGeometry args={[1.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#5c3d28" flatShading />
        </mesh>
        {/* Conical Wooden Roof */}
        <mesh castShadow position={[0, 2.65, 0]}>
          <coneGeometry args={[1.35, 0.8, 6]} />
          <meshStandardMaterial color="#78350f" flatShading roughness={0.9} />
        </mesh>
      </group>

      {/* Market Stall 1 (Red & White Striped Canopy) */}
      <group position={[-5, 0, 2]} rotation={[0, 0.4, 0]}>
        {/* Counter */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[2.2, 1.0, 1.0]} />
          <meshStandardMaterial color="#78350f" flatShading roughness={0.9} />
        </mesh>
        {/* Corner Posts */}
        {[-1.0, 1.0].map((x, xIdx) =>
          [-0.45, 0.45].map((z, zIdx) => (
            <mesh key={`${xIdx}-${zIdx}`} castShadow position={[x, 1.5, z]}>
              <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          ))
        )}
        {/* Canopy Roof */}
        <mesh castShadow position={[0, 2.45, 0]}>
          <boxGeometry args={[2.4, 0.15, 1.3]} />
          <meshStandardMaterial color="#dc2626" flatShading />
        </mesh>
        {/* Crates on display */}
        <mesh castShadow position={[-0.5, 1.12, 0]}>
          <boxGeometry args={[0.5, 0.25, 0.4]} />
          <meshStandardMaterial color="#d97706" flatShading />
        </mesh>
        <mesh castShadow position={[0.4, 1.12, 0.1]}>
          <boxGeometry args={[0.4, 0.25, 0.35]} />
          <meshStandardMaterial color="#b45309" flatShading />
        </mesh>

        {/* Fresh Vegetable Display Items */}
        {/* Red Tomatoes */}
        {[-0.6, -0.4, -0.5].map((x, i) => (
          <mesh key={`tomato-${i}`} castShadow position={[x, 1.3, (i % 2) * 0.1 - 0.05]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
        ))}
        {/* Orange Carrots */}
        {[-0.1, 0.0, 0.1].map((x, i) => (
          <mesh key={`carrot-${i}`} castShadow position={[x, 1.28, 0]} rotation={[0.2, 0, 0.4]}>
            <coneGeometry args={[0.04, 0.22, 6]} />
            <meshStandardMaterial color="#f97316" roughness={0.5} />
          </mesh>
        ))}
        {/* Yellow/Brown Potatoes */}
        {[0.3, 0.45, 0.55].map((x, i) => (
          <mesh key={`potato-${i}`} castShadow position={[x, 1.3, 0.08 - i * 0.05]}>
            <sphereGeometry args={[0.07, 8, 6]} />
            <meshStandardMaterial color="#a16207" roughness={0.8} />
          </mesh>
        ))}
        {/* White/Purple Onions */}
        {[-0.2, 0.2].map((x, i) => (
          <mesh key={`onion-${i}`} castShadow position={[x, 1.28, 0.15]}>
            <sphereGeometry args={[0.065, 8, 8]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Market Stall 2 (Blue & White Striped Canopy) */}
      <group position={[5.2, 0, 1.5]} rotation={[0, -0.5, 0]}>
        {/* Counter */}
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[2.2, 1.0, 1.0]} />
          <meshStandardMaterial color="#78350f" flatShading roughness={0.9} />
        </mesh>
        {/* Posts */}
        {[-1.0, 1.0].map((x, xIdx) =>
          [-0.45, 0.45].map((z, zIdx) => (
            <mesh key={`${xIdx}-${zIdx}`} castShadow position={[x, 1.5, z]}>
              <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          ))
        )}
        {/* Canopy Roof */}
        <mesh castShadow position={[0, 2.45, 0]}>
          <boxGeometry args={[2.4, 0.15, 1.3]} />
          <meshStandardMaterial color="#2563eb" flatShading />
        </mesh>
        {/* Barrels */}
        <mesh castShadow position={[-0.6, 1.25, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.5, 8]} />
          <meshStandardMaterial color="#92400e" flatShading />
        </mesh>
      </group>

      {/* Market Stall 3 (Green Canopy) */}
      <group position={[2, 0, 6.5]} rotation={[0, 3.1, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <boxGeometry args={[2.0, 1.0, 0.9]} />
          <meshStandardMaterial color="#78350f" flatShading roughness={0.9} />
        </mesh>
        {[-0.9, 0.9].map((x, xIdx) =>
          [-0.4, 0.4].map((z, zIdx) => (
            <mesh key={`${xIdx}-${zIdx}`} castShadow position={[x, 1.5, z]}>
              <cylinderGeometry args={[0.05, 0.05, 2.0, 6]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          ))
        )}
        <mesh castShadow position={[0, 2.45, 0]}>
          <boxGeometry args={[2.2, 0.15, 1.1]} />
          <meshStandardMaterial color="#16a34a" flatShading />
        </mesh>
      </group>

      {/* Wooden Signpost */}
      <group position={[-2.5, 0, 4]}>
        <mesh castShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.0, 6]} />
          <meshStandardMaterial color="#5c3d28" flatShading />
        </mesh>
        <mesh castShadow position={[0.4, 1.6, 0]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.04]} />
          <meshStandardMaterial color="#92400e" flatShading />
        </mesh>
        <mesh castShadow position={[-0.4, 1.3, 0]} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[0.8, 0.2, 0.04]} />
          <meshStandardMaterial color="#92400e" flatShading />
        </mesh>
      </group>

      {/* Street Lampposts */}
      {[-6, 6].map((x, idx) => (
        <group key={idx} position={[x, 0, -3]}>
          <mesh castShadow position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
            <meshStandardMaterial color="#262626" />
          </mesh>
          <mesh position={[0, 2.8, 0]}>
            <boxGeometry args={[0.3, 0.35, 0.3]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export default VillageCenter;
