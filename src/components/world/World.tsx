import React, { Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment } from './Environment';
import { WillowbrookVillage } from './WillowbrookVillage';
import { CloudSystem } from './CloudSystem';
import { RainSystem } from './RainSystem';
import { Ben } from '../characters/Ben';
import { Julie } from '../characters/Julie';
import { Ravi } from '../characters/Ravi';
import { FollowCamera } from '../camera/FollowCamera';
import { NavigationDebugOverlay } from './NavigationDebugOverlay';
import { SimulationState } from '../../types/citizen';
import { simulationEngine } from '../../systems/simulation/SimulationEngine';

interface WorldContentProps {
  simState: SimulationState;
  viewMode: 'overview' | 'follow';
}

const WorldContent: React.FC<WorldContentProps> = ({ simState, viewMode }) => {
  const { camera } = useThree();
  const activeCitizen = simState.citizens[simState.activeCitizenId] || simState.citizens.ben;

  useFrame((_, delta) => {
    // Compute current horizontal camera angle relative to active character (camera-relative/gyro movement)
    const dx = camera.position.x - activeCitizen.position[0];
    const dz = camera.position.z - activeCitizen.position[2];
    const cameraAngleY = Math.atan2(dx, dz);

    simulationEngine.update(delta, cameraAngleY);
  });

  return (
    <>
      <Environment />
      <CloudSystem />
      <RainSystem />

      {/* Untouched Willowbrook Village 3D Environment */}
      <WillowbrookVillage />

      {/* 3D Navigation Debug Grid & Path Visualizer */}
      <NavigationDebugOverlay />

      <Suspense fallback={null}>
        <Ben state={simState.citizens.ben} isSelected={simState.activeCitizenId === 'ben'} />
        <Julie state={simState.citizens.julie} isSelected={simState.activeCitizenId === 'julie'} />
        <Ravi state={simState.citizens.ravi} isSelected={simState.activeCitizenId === 'ravi'} />
      </Suspense>

      {viewMode === 'follow' ? (
        <FollowCamera targetPosition={activeCitizen.position} />
      ) : (
        <OrbitControls
          target={[0, 2, 0]}
          minDistance={10}
          maxDistance={500}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI / 2 - 0.12}
          enableDamping
          dampingFactor={0.05}
        />
      )}
    </>
  );
};

interface WorldProps {
  simState: SimulationState;
  viewMode: 'overview' | 'follow';
}

export const World: React.FC<WorldProps> = ({ simState, viewMode }) => {
  return (
    <Canvas
      shadows
      camera={{ position: [45, 35, 55], fov: 55, near: 0.5, far: 1800 }}
      gl={{ logarithmicDepthBuffer: true, antialias: true }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <WorldContent simState={simState} viewMode={viewMode} />
    </Canvas>
  );
};

export default World;
