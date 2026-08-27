import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { worldSimulationEngine } from '../../systems/simulation/WorldSimulationEngine';

export const RainSystem: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 4000;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() * 2 - 1) * 160;     // X
      pos[i * 3 + 1] = Math.random() * 90 + 5;        // Y (height 5 to 95)
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * 160; // Z

      vel[i * 3] = 0;                           // Wind slant X
      vel[i * 3 + 1] = 40 + Math.random() * 25; // Fall speed Y
      vel[i * 3 + 2] = 0;                       // Wind slant Z
    }
    return [pos, vel];
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      color: '#93c5fd',
      size: 0.45,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const { weather } = worldSimulationEngine.getState();

    // Hide rain completely if clear or cloudy
    if (weather.type !== 'RAIN' && weather.type !== 'STORM') {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;

    const activeCount = weather.type === 'STORM' ? count : Math.floor(count * 0.55);
    geometry.setDrawRange(0, activeCount);

    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const wind = weather.windSpeed || 10;
    const fallSpeedMultiplier = weather.type === 'STORM' ? 1.4 : 1.0;

    for (let i = 0; i < activeCount; i++) {
      const idx = i * 3;
      // Fall down
      array[idx + 1] -= velocities[idx + 1] * delta * fallSpeedMultiplier;
      // Wind slant
      array[idx] += wind * 0.25 * delta;

      // Recycle raindrops reaching ground back up to top sky
      if (array[idx + 1] < 0) {
        array[idx + 1] = 85 + Math.random() * 15;
        array[idx] = (Math.random() * 2 - 1) * 160;
        array[idx + 2] = (Math.random() * 2 - 1) * 160;
      }
    }

    posAttr.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
};

export default RainSystem;
