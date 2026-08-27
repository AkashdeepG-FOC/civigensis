import React from 'react';
import Terrain, { getTerrainHeight } from './my/Terrain';
import River from './my/River';
import Bridge from './my/Bridge';
import House from './my/House';
import Farm from './my/Farm';
import VillageCenter from './my/VillageCenter';
import Forest from './my/Forest';
import Mountains from './my/Mountains';

export const WillowbrookVillage: React.FC = () => {
  const farmY = getTerrainHeight(120, -160);

  return (
    <group>
      {/* 1000m x 1000m Terrain with path vertex colors */}
      <Terrain />

      {/* S-Curved Flowing River */}
      <River width={7.5} />

      {/* Wooden Arch Bridge at main river crossing [0, 1.6, -65] */}
      <Bridge curveT={0.38} />

      {/* Northern Background Mountains & Cave Entrance */}
      <Mountains />

      {/* Village Center Market Square & Stone Well */}
      <VillageCenter position={[0, 0, 5]} />

      {/* Large 200m x 200m Farm & Barn across the river */}
      <Farm position={[120, farmY, -160]} />

      {/* 7 Large Low-Poly Village Houses (Matching Reference Layout) */}
      {/* House 1: Bottom Left Foreground Cottage */}
      <House
        position={[-22, 0, 25]}
        rotation={0.25}
        width={4.6}
        depth={3.8}
        roofColor="#ba533b"
        wallColor="#e8dcc0"
      />

      {/* House 2: Mid Left Cottage near Farm */}
      <House
        position={[-18, 0, -12]}
        rotation={-0.35}
        width={4.2}
        depth={3.5}
        roofColor="#6b4e3d"
        wallColor="#f0e6cf"
      />

      {/* House 3: Mid Top Village Center Manor */}
      <House
        position={[5, 0, -16]}
        rotation={0.15}
        width={5.0}
        depth={4.0}
        wallHeight={2.8}
        roofColor="#9e4536"
        wallColor="#ddd0ab"
      />

      {/* House 4: Bottom Center/Right Foreground Slate Roof House */}
      <House
        position={[18, 0, 22]}
        rotation={-0.3}
        width={4.5}
        depth={3.8}
        roofColor="#4a5c6d"
        wallColor="#e8dcc0"
      />

      {/* House 5: Bottom Right Foreground Grand Estate */}
      <House
        position={[38, 0, 10]}
        rotation={-0.55}
        width={5.2}
        depth={4.2}
        roofColor="#ba533b"
        wallColor="#f0e6cf"
      />

      {/* House 6: Upper Right Riverside House */}
      <House
        position={[32, 0, -28]}
        rotation={0.45}
        width={4.0}
        depth={3.4}
        roofColor="#7a4e38"
        wallColor="#ddd0ab"
      />

      {/* House 7: Upper Right Hillside Lodge */}
      <House
        position={[45, 0, -48]}
        rotation={-0.2}
        width={4.4}
        depth={3.6}
        roofColor="#556575"
        wallColor="#e8dcc0"
      />

      {/* Instanced Pine Forest, Oak Trees & Boulders across 1000m Map */}
      <Forest
        exclusions={[
          { x: 0, z: 5, r: 25 },         // Village market center
          { x: 120, z: -160, r: 110 },   // 200m x 200m Ben's Farm across the river
          { x: -22, z: 25, r: 16 },      // House 1
          { x: -18, z: -12, r: 14 },     // House 2
          { x: 5, z: -16, r: 15 },       // House 3
          { x: 18, z: 22, r: 16 },       // House 4
          { x: 38, z: 10, r: 16 },       // House 5
          { x: 32, z: -28, r: 14 },      // House 6
          { x: 45, z: -48, r: 15 },      // House 7
          { x: 45, z: 15, r: 12 },       // Bridge area
        ]}
        pineCount={800}
        oakCount={240}
        rockCount={180}
        halfSize={480}
        seed={77}
      />
    </group>
  );
};

export default WillowbrookVillage;
