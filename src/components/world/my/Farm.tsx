import React, { useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';

const cropGeo = new THREE.BoxGeometry(0.45, 0.55, 0.45);
const wheatMat = new THREE.MeshStandardMaterial({ color: '#eab308', flatShading: true, roughness: 0.9 });
const vegMat = new THREE.MeshStandardMaterial({ color: '#65a30d', flatShading: true, roughness: 0.9 });

interface CropFieldProps {
  origin?: [number, number];
  rows?: number;
  cols?: number;
  isWheat?: boolean;
}

const CropField: React.FC<CropFieldProps> = ({
  origin = [0, 0],
  rows = 8,
  cols = 16,
  isWheat = true,
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spacing = 0.65;
  const count = rows * cols;

  useLayoutEffect(() => {
    if (!ref.current) return;
    const dummy = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = origin[0] + c * spacing;
        const z = origin[1] + r * spacing;
        const jitterY = (Math.sin(r * 2 + c * 3) * 0.05) + 0.28;
        dummy.position.set(x, jitterY, z);
        dummy.rotation.y = (r + c) * 0.4;
        dummy.scale.set(0.9 + (r % 3) * 0.1, 0.8 + (c % 2) * 0.3, 0.9 + (r % 2) * 0.1);
        dummy.updateMatrix();
        ref.current.setMatrixAt(i++, dummy.matrix);
      }
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [origin, rows, cols]);

  return (
    <instancedMesh
      ref={ref}
      args={[cropGeo, isWheat ? wheatMat : vegMat, count]}
      castShadow
      receiveShadow
    />
  );
};

interface FarmProps {
  position?: [number, number, number];
}

export const Farm: React.FC<FarmProps> = ({ position = [120, 0, -160] }) => {
  return (
    <group position={position}>
      {/* Main Red Barn */}
      <group position={[25, 0, -25]}>
        {/* Foundation */}
        <mesh receiveShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[12.2, 0.6, 15.2]} />
          <meshStandardMaterial color="#646669" flatShading roughness={0.9} />
        </mesh>
        {/* Main Walls */}
        <mesh castShadow receiveShadow position={[0, 3.8, 0]}>
          <boxGeometry args={[12.0, 6.4, 15.0]} />
          <meshStandardMaterial color="#b91c1c" flatShading roughness={0.8} />
        </mesh>
        {/* Roof */}
        <mesh castShadow position={[0, 8.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[11.5, 4.4, 4]} />
          <meshStandardMaterial color="#451a03" flatShading roughness={0.9} />
        </mesh>
        {/* Barn Door */}
        <mesh position={[0, 3.0, 7.55]}>
          <boxGeometry args={[4.5, 4.8, 0.1]} />
          <meshStandardMaterial color="#fef3c7" flatShading />
        </mesh>
      </group>

      {/* Tall Grain Silo */}
      <group position={[45, 0, -35]}>
        <mesh castShadow receiveShadow position={[0, 7.0, 0]}>
          <cylinderGeometry args={[3.2, 3.2, 14.0, 16]} />
          <meshStandardMaterial color="#9ca3af" flatShading roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh castShadow position={[0, 15.0, 0]}>
          <coneGeometry args={[3.4, 3.2, 16]} />
          <meshStandardMaterial color="#6b7280" flatShading roughness={0.4} metalness={0.4} />
        </mesh>
      </group>

      {/* Secondary Farmer Cottage / Tool Shed */}
      <group position={[-35, 0, -25]}>
        <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
          <boxGeometry args={[8.0, 5.0, 10.0]} />
          <meshStandardMaterial color="#d97706" flatShading roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 6.0, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[7.2, 3.0, 4]} />
          <meshStandardMaterial color="#7f1d1d" flatShading roughness={0.9} />
        </mesh>
      </group>

      {/* Wooden Fence Posts along farm bounds */}
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const fx = Math.cos(angle) * 75;
        const fz = Math.sin(angle) * 75;
        return (
          <mesh key={i} castShadow position={[fx, 0.8, fz]}>
            <boxGeometry args={[0.4, 1.6, 0.4]} />
            <meshStandardMaterial color="#5c3d28" flatShading />
          </mesh>
        );
      })}

      {/* Field Plot 1: Large Northern Golden Wheat Soil Bed & Crops */}
      <group position={[-50, 0, -50]}>
        <mesh receiveShadow position={[7.5, 0.01, 3.8]}>
          <boxGeometry args={[17, 0.02, 9]} />
          <meshStandardMaterial color="#6e4d25" roughness={0.95} flatShading />
        </mesh>
        <CropField origin={[0, 0]} rows={12} cols={24} isWheat={true} />
      </group>

      {/* Field Plot 2: Central Golden Wheat Field Soil Bed & Crops */}
      <group position={[-50, 0, 0]}>
        <mesh receiveShadow position={[7.5, 0.01, 3.8]}>
          <boxGeometry args={[17, 0.02, 9]} />
          <meshStandardMaterial color="#6e4d25" roughness={0.95} flatShading />
        </mesh>
        <CropField origin={[0, 0]} rows={12} cols={24} isWheat={true} />
      </group>

      {/* Field Plot 3: Southern Golden Wheat Field Soil Bed & Crops */}
      <group position={[-50, 0, 50]}>
        <mesh receiveShadow position={[7.5, 0.01, 3.8]}>
          <boxGeometry args={[17, 0.02, 9]} />
          <meshStandardMaterial color="#6e4d25" roughness={0.95} flatShading />
        </mesh>
        <CropField origin={[0, 0]} rows={12} cols={24} isWheat={true} />
      </group>

      {/* Field Plot 4: Eastern Vegetable Plot */}
      <group position={[10, 0, 20]}>
        <mesh receiveShadow position={[5.8, 0.01, 2.5]}>
          <boxGeometry args={[13, 0.02, 6]} />
          <meshStandardMaterial color="#4a371c" roughness={0.95} flatShading />
        </mesh>
        <CropField origin={[0, 0]} rows={8} cols={18} isWheat={false} />
      </group>
    </group>
  );
};

export default Farm;
