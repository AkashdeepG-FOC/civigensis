import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { worldSimulationEngine } from '../../systems/simulation/WorldSimulationEngine';

export const Environment: React.FC = () => {
  const { scene } = useThree();
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const fogRef = useRef<THREE.Fog>(null);

  useFrame((_, delta) => {
    // 1. Advance simulation minutes continuously
    worldSimulationEngine.update(delta);

    const { environment } = worldSimulationEngine.getState();

    // 2. DYNAMICALLY UPDATE SCENE BACKGROUND SKY (No purple!)
    scene.background = new THREE.Color(environment.skyColor);

    // 3. Update Sun Light (Position, Intensity, Color)
    if (sunLightRef.current) {
      sunLightRef.current.position.set(...environment.sunPosition);
      sunLightRef.current.intensity = environment.sunlight;
      sunLightRef.current.color.set(environment.sunColor);
    }

    // 4. Update Moon Light
    if (moonLightRef.current) {
      moonLightRef.current.position.set(...environment.moonPosition);
      moonLightRef.current.intensity = environment.moonLight;
    }

    // 5. Update Ambient Fill Light
    if (hemiLightRef.current) {
      hemiLightRef.current.intensity = environment.ambientLight;
    }

    // 6. Update Distance Fog
    if (fogRef.current) {
      fogRef.current.color.set(environment.fogColor);
      fogRef.current.near = THREE.MathUtils.lerp(fogRef.current.near, environment.fogDistance.near, delta * 4);
      fogRef.current.far = THREE.MathUtils.lerp(fogRef.current.far, environment.fogDistance.far, delta * 4);
    }
  });

  const { environment } = worldSimulationEngine.getState();

  return (
    <>
      {/* Dynamic Distance Fog */}
      <fog
        ref={fogRef}
        attach="fog"
        args={[environment.fogColor, environment.fogDistance.near, environment.fogDistance.far]}
      />

      {/* Ambient Hemisphere Light */}
      <hemisphereLight
        ref={hemiLightRef}
        args={['#dbeafe', '#334155', environment.ambientLight]}
      />

      {/* Main Directional Sun Light with crisp shadows */}
      <directionalLight
        ref={sunLightRef}
        position={environment.sunPosition}
        intensity={environment.sunlight}
        color={environment.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={650}
        shadow-camera-left={-250}
        shadow-camera-right={250}
        shadow-camera-top={250}
        shadow-camera-bottom={-250}
        shadow-bias={-0.0001}
        shadow-normalBias={0.04}
      />

      {/* Subtle Moon Light active during night */}
      <directionalLight
        ref={moonLightRef}
        position={environment.moonPosition}
        intensity={environment.moonLight}
        color="#cbd5e1"
        castShadow={false}
      />
    </>
  );
};

export default Environment;
