import React from 'react';

export const Ground: React.FC = () => {
  return (
    <group>
      {/* Ground mesh for shadows */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2d3748" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Grid overlay for spatial grounding */}
      <gridHelper args={[100, 50, '#4a5568', '#323c4e']} position={[0, 0, 0]} />
    </group>
  );
};
