import React, { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldSimulationEngine } from '../../systems/simulation/WorldSimulationEngine';

const cloudGeo = new THREE.DodecahedronGeometry(14, 1);
const cloudMat = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  flatShading: true,
  roughness: 0.9,
  transparent: true,
  opacity: 0.85,
});

export const CloudSystem: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudCount = 80;

  // Initialize random cloud positions & scale
  const cloudData = useMemo(() => {
    const data = [];
    for (let i = 0; i < cloudCount; i++) {
      const x = (Math.random() * 2 - 1) * 450;
      const z = (Math.random() * 2 - 1) * 450;
      const y = 110 + Math.random() * 45;
      const scaleX = 1.2 + Math.random() * 1.8;
      const scaleY = 0.6 + Math.random() * 0.5;
      const scaleZ = 1.0 + Math.random() * 1.4;
      data.push({ x, y, z, scaleX, scaleY, scaleZ });
    }
    return data;
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    cloudData.forEach((c, i) => {
      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [cloudData]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const { weather, environment } = worldSimulationEngine.getState();
    const windSpeed = weather.windSpeed || 8;

    const dummy = new THREE.Object3D();
    const matrix = new THREE.Matrix4();

    cloudData.forEach((c, i) => {
      // Drift clouds according to wind speed
      c.x += delta * windSpeed * 0.4;
      if (c.x > 500) c.x = -500;

      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.set(c.scaleX, c.scaleY, c.scaleZ);
      dummy.updateMatrix();
      meshRef.current?.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;

    // Adjust cloud visibility / dark storm tint based on weather
    if (cloudMat) {
      if (weather.type === 'STORM') {
        cloudMat.color.set('#334155');
        cloudMat.opacity = 0.95;
      } else if (weather.type === 'RAIN') {
        cloudMat.color.set('#64748b');
        cloudMat.opacity = 0.9;
      } else {
        cloudMat.color.set(environment.period === 'NIGHT' ? '#1e293b' : '#ffffff');
        cloudMat.opacity = 0.85;
      }
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[cloudGeo, cloudMat, cloudCount]}
      castShadow={false}
      receiveShadow={false}
    />
  );
};

export default CloudSystem;
