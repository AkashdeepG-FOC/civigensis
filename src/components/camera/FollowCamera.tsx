import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';

interface FollowCameraProps {
  targetPosition: [number, number, number];
}

export const FollowCamera: React.FC<FollowCameraProps> = ({ targetPosition }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const prevTargetRef = useRef<Vector3>(
    new Vector3(targetPosition[0], targetPosition[1] + 1.2, targetPosition[2])
  );

  useFrame(() => {
    if (controlsRef.current) {
      const newTarget = new Vector3(
        targetPosition[0],
        targetPosition[1] + 1.2,
        targetPosition[2]
      );

      // Shift camera along with character position change while maintaining current orbit rotation & zoom
      const deltaPos = newTarget.clone().sub(prevTargetRef.current);
      if (deltaPos.lengthSq() > 0.000001) {
        controlsRef.current.object.position.add(deltaPos);
        controlsRef.current.target.copy(newTarget);
        prevTargetRef.current.copy(newTarget);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[targetPosition[0], targetPosition[1] + 1.2, targetPosition[2]]}
      minDistance={1.5}
      maxDistance={350}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2 - 0.12}
      enableDamping
      dampingFactor={0.08}
    />
  );
};

export default FollowCamera;
