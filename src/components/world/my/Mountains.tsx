import React, { useMemo } from 'react';
import * as THREE from 'three';

interface MountainsProps {
  position?: [number, number, number];
}

export const Mountains: React.FC<MountainsProps> = ({ position = [0, 0, 0] }) => {
  const mountainGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(80, 70, 7);
    geo.rotateY(Math.PI / 5);
    return geo;
  }, []);

  const rockMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#525861',
      flatShading: true,
      roughness: 0.9,
    });
  }, []);

  const snowMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      flatShading: true,
      roughness: 0.7,
    });
  }, []);

  return (
    <group position={position}>
      {/* Mountain Ridge Peaks in the Northern Background */}
      {[-350, -220, -90, 40, 180, 320, 450].map((x, i) => {
        const height = 65 + (Math.abs(x * 7) % 35);
        const z = -380 - (Math.abs(x * 3) % 60);
        return (
          <group key={i} position={[x, height / 2 - 5, z]}>
            {/* Base Mountain Cone */}
            <mesh geometry={mountainGeo} material={rockMat} castShadow receiveShadow scale={[1.2, height / 50, 1.2]} />
            {/* Snow Cap on higher peaks */}
            {height > 80 && (
              <mesh position={[0, height * 0.32, 0]} scale={[0.45, 0.35, 0.45]}>
                <coneGeometry args={[40, 30, 7]} />
                <primitive object={snowMat} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Mountain Tunnel / Cave Entrance (Top Right Valley as seen in screenshot) */}
      <group position={[48, 4.5, -72]} rotation={[0, -0.4, 0]}>
        {/* Cliff Arch Surround */}
        <mesh castShadow position={[0, 3, 0]}>
          <boxGeometry args={[10, 8, 6]} />
          <meshStandardMaterial color="#474d54" flatShading roughness={0.9} />
        </mesh>
        {/* Dark Tunnel Arch Entrance */}
        <mesh position={[0, 2, 2.8]}>
          <cylinderGeometry args={[2.5, 2.5, 4, 12, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color="#090d12" />
        </mesh>
      </group>

      {/* Waterfall Cliff Rocks at Outer River Source */}
      <group position={[-350, 15, -310]} rotation={[0, 0.4, 0]}>
        <mesh castShadow position={[0, 10, 0]}>
          <boxGeometry args={[25, 20, 20]} />
          <meshStandardMaterial color="#474d54" flatShading roughness={0.9} />
        </mesh>
        {/* Cascading Water Fall Sheet */}
        <mesh position={[0, 8, 10.1]} rotation={[0.1, 0, 0]}>
          <planeGeometry args={[12, 16]} />
          <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={0.5} transparent opacity={0.85} />
        </mesh>
      </group>
    </group>
  );
};

export default Mountains;
