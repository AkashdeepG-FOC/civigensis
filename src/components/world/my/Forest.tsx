import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { mulberry32, scatterPoints, ExclusionCircle } from './random';
import { getTerrainHeight } from './Terrain';
import { getDistanceToRiverCurve } from './River';

const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6);
const pineFoliageGeo = new THREE.ConeGeometry(1.4, 3.2, 7);
const oakFoliageGeo = new THREE.DodecahedronGeometry(1.6, 1);
const rockGeo = new THREE.DodecahedronGeometry(1.0, 1);

const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c3d28', flatShading: true, roughness: 1 });
const pineFoliageMat = new THREE.MeshStandardMaterial({ color: '#2e663b', flatShading: true, roughness: 1 });
const oakFoliageMat = new THREE.MeshStandardMaterial({ color: '#558b2f', flatShading: true, roughness: 1 });
const rockMat = new THREE.MeshStandardMaterial({ color: '#6e7073', flatShading: true, roughness: 0.9 });

interface ForestProps {
  exclusions?: ExclusionCircle[];
  pineCount?: number;
  oakCount?: number;
  rockCount?: number;
  halfSize?: number;
  seed?: number;
}

export const Forest: React.FC<ForestProps> = ({
  exclusions = [
    { x: 0, z: 0, r: 45 },      // Central village
    { x: -35, z: -32, r: 35 },  // Farm
    { x: -22, z: 25, r: 18 },   // House 1
    { x: 18, z: 22, r: 18 },    // House 4
    { x: 38, z: 10, r: 18 },    // House 5
  ],
  pineCount = 750,
  oakCount = 250,
  rockCount = 200,
  halfSize = 480,
  seed = 42,
}) => {
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineFoliageRef = useRef<THREE.InstancedMesh>(null);
  const oakTrunkRef = useRef<THREE.InstancedMesh>(null);
  const oakFoliageRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const { pines, oaks, rocks } = useMemo(() => {
    const rng = mulberry32(seed);
    const pinePts = scatterPoints(pineCount, halfSize, exclusions, rng);
    const oakPts = scatterPoints(oakCount, halfSize / 2, exclusions, rng);
    const rockPts = scatterPoints(rockCount, halfSize, exclusions, rng);

    const pinesData = pinePts
      .filter(([x, z]) => getDistanceToRiverCurve(x, z).distance >= 10.0)
      .map(([x, z]) => {
        const y = getTerrainHeight(x, z);
        const scale = 0.8 + rng() * 1.1;
        const rot = rng() * Math.PI * 2;
        return { x, y, z, scale, rot };
      });

    const oaksData = oakPts
      .filter(([x, z]) => getDistanceToRiverCurve(x, z).distance >= 10.0)
      .map(([x, z]) => {
        const y = getTerrainHeight(x, z);
        const scale = 0.7 + rng() * 0.8;
        const rot = rng() * Math.PI * 2;
        return { x, y, z, scale, rot };
      });

    const rocksData = rockPts
      .filter(([x, z]) => getDistanceToRiverCurve(x, z).distance >= 10.0)
      .map(([x, z]) => {
        const y = getTerrainHeight(x, z);
        const scale = 0.5 + rng() * 1.5;
        const rot = rng() * Math.PI * 2;
        return { x, y, z, scale, rot };
      });

    return { pines: pinesData, oaks: oaksData, rocks: rocksData };
  }, [exclusions, pineCount, oakCount, rockCount, halfSize, seed]);

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    // Pine Trees
    pines.forEach((t, i) => {
      if (!pineTrunkRef.current || !pineFoliageRef.current) return;
      dummy.position.set(t.x, t.y + 0.8 * t.scale, t.z);
      dummy.rotation.set(0, t.rot, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      pineTrunkRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, t.y + 2.3 * t.scale, t.z);
      dummy.updateMatrix();
      pineFoliageRef.current.setMatrixAt(i, dummy.matrix);
    });

    if (pineTrunkRef.current) pineTrunkRef.current.instanceMatrix.needsUpdate = true;
    if (pineFoliageRef.current) pineFoliageRef.current.instanceMatrix.needsUpdate = true;

    // Oak Trees
    oaks.forEach((t, i) => {
      if (!oakTrunkRef.current || !oakFoliageRef.current) return;
      dummy.position.set(t.x, t.y + 0.7 * t.scale, t.z);
      dummy.rotation.set(0, t.rot, 0);
      dummy.scale.setScalar(t.scale);
      dummy.updateMatrix();
      oakTrunkRef.current.setMatrixAt(i, dummy.matrix);

      dummy.position.set(t.x, t.y + 2.0 * t.scale, t.z);
      dummy.updateMatrix();
      oakFoliageRef.current.setMatrixAt(i, dummy.matrix);
    });

    if (oakTrunkRef.current) oakTrunkRef.current.instanceMatrix.needsUpdate = true;
    if (oakFoliageRef.current) oakFoliageRef.current.instanceMatrix.needsUpdate = true;

    // Rocks & Boulders
    rocks.forEach((r, i) => {
      if (!rockRef.current) return;
      dummy.position.set(r.x, r.y + 0.3 * r.scale, r.z);
      dummy.rotation.set(r.rot, r.rot * 1.5, 0);
      dummy.scale.set(r.scale, r.scale * 0.7, r.scale * 1.2);
      dummy.updateMatrix();
      rockRef.current.setMatrixAt(i, dummy.matrix);
    });

    if (rockRef.current) rockRef.current.instanceMatrix.needsUpdate = true;
  }, [pines, oaks, rocks]);

  return (
    <group>
      <instancedMesh ref={pineTrunkRef} args={[trunkGeo, trunkMat, pines.length]} castShadow receiveShadow />
      <instancedMesh ref={pineFoliageRef} args={[pineFoliageGeo, pineFoliageMat, pines.length]} castShadow receiveShadow />
      <instancedMesh ref={oakTrunkRef} args={[trunkGeo, trunkMat, oaks.length]} castShadow receiveShadow />
      <instancedMesh ref={oakFoliageRef} args={[oakFoliageGeo, oakFoliageMat, oaks.length]} castShadow receiveShadow />
      <instancedMesh ref={rockRef} args={[rockGeo, rockMat, rocks.length]} castShadow receiveShadow />
    </group>
  );
};

export default Forest;
