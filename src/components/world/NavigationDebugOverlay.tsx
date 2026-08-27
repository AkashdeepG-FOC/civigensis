import React, { useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { worldMapStore } from '../../systems/navigation/WorldMapStore';
import { PathfindingResult } from '../../systems/navigation/types/navigationMap';
import { SECTOR_COUNT, SECTOR_SIZE, HALF_WORLD_SIZE } from '../../systems/navigation/CoordinateConverter';
import { getTerrainHeight } from './my/Terrain';

export const NavigationDebugOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(worldMapStore.getIsDebugOverlayVisible());
  const [showSectorGrid, setShowSectorGrid] = useState(worldMapStore.getShowSectorGrid());
  const [showSemanticLocations, setShowSemanticLocations] = useState(worldMapStore.getShowSemanticLocations());
  const [showPathWaypoints, setShowPathWaypoints] = useState(worldMapStore.getShowPathWaypoints());
  const [activePath, setActivePath] = useState<PathfindingResult | null>(worldMapStore.getActiveTestPath());

  useEffect(() => {
    const unsub = worldMapStore.subscribe(() => {
      setIsVisible(worldMapStore.getIsDebugOverlayVisible());
      setShowSectorGrid(worldMapStore.getShowSectorGrid());
      setShowSemanticLocations(worldMapStore.getShowSemanticLocations());
      setShowPathWaypoints(worldMapStore.getShowPathWaypoints());
      setActivePath(worldMapStore.getActiveTestPath());
    });
    return () => unsub();
  }, []);

  // 1. Build 20x20 Sector Grid Lines
  const sectorGridLines = useMemo(() => {
    const points: THREE.Vector3[] = [];

    // Horizontal lines along Z
    for (let i = 0; i <= SECTOR_COUNT; i++) {
      const z = -HALF_WORLD_SIZE + i * SECTOR_SIZE;
      for (let x = -HALF_WORLD_SIZE; x < HALF_WORLD_SIZE; x += 10) {
        const y1 = getTerrainHeight(x, z) + 0.3;
        const y2 = getTerrainHeight(x + 10, z) + 0.3;
        points.push(new THREE.Vector3(x, y1, z));
        points.push(new THREE.Vector3(x + 10, y2, z));
      }
    }

    // Vertical lines along X
    for (let i = 0; i <= SECTOR_COUNT; i++) {
      const x = -HALF_WORLD_SIZE + i * SECTOR_SIZE;
      for (let z = -HALF_WORLD_SIZE; z < HALF_WORLD_SIZE; z += 10) {
        const y1 = getTerrainHeight(x, z) + 0.3;
        const y2 = getTerrainHeight(x, z + 10) + 0.3;
        points.push(new THREE.Vector3(x, y1, z));
        points.push(new THREE.Vector3(x, y2, z + 10));
      }
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  // 2. Build Active A* Path Line
  const pathLineGeometry = useMemo(() => {
    if (!activePath || !activePath.waypoints || activePath.waypoints.length < 2) return null;
    const points = activePath.waypoints.map((w) => new THREE.Vector3(w.x, getTerrainHeight(w.x, w.z) + 0.6, w.z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [activePath]);

  if (!isVisible) return null;

  const map = worldMapStore.getMap();
  const semanticLocations = map.getAllSemanticLocations();

  return (
    <group>
      {/* 20x20 Sector Grid Lines */}
      {showSectorGrid && (
        <lineSegments geometry={sectorGridLines}>
          <lineBasicMaterial color="#38bdf8" linewidth={1.5} opacity={0.65} transparent depthWrite={false} />
        </lineSegments>
      )}

      {/* Semantic Location Markers */}
      {showSemanticLocations &&
        semanticLocations.map((loc) => {
          const y = getTerrainHeight(loc.position.x, loc.position.z);
          return (
            <group key={loc.id} position={[loc.position.x, y + 0.2, loc.position.z]}>
              <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[0.3, 0.05, 2.4, 8]} />
                <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0, 2.5, 0]}>
                <sphereGeometry args={[0.6, 12, 12]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
              </mesh>
            </group>
          );
        })}

      {/* Active A* Waypoints Line */}
      {showPathWaypoints && activePath && activePath.waypoints && activePath.waypoints.length >= 2 && (
        <group>
          {pathLineGeometry && (
            <primitive
              object={
                new THREE.Line(
                  pathLineGeometry,
                  new THREE.LineBasicMaterial({ color: '#10b981', linewidth: 4, depthWrite: false })
                )
              }
            />
          )}
          {activePath.waypoints.map((w, idx) => {
            const y = getTerrainHeight(w.x, w.z) + 0.6;
            return (
              <mesh key={idx} position={[w.x, y, w.z]}>
                <sphereGeometry args={[0.4, 8, 8]} />
                <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.9} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

