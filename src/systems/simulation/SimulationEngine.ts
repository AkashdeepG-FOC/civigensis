import { CitizenId, SimulationState, AnimationState } from '../../types/citizen';
import { getTerrainHeight } from '../../components/world/my/Terrain';
import { isPointInRiverWater, getRiverWaterSurfaceHeight } from '../../components/world/my/River';
import { isPointOnBridge, getBridgeDeckHeight } from '../../components/world/my/Bridge';
import { getDetectedGroundHeight, GroundQueryResult } from '../physics/GroundPhysics';
import { worldMapStore } from '../navigation/WorldMapStore';
import { CoordinateConverter } from '../navigation/CoordinateConverter';
import { benAIBrain, julieAIBrain } from '../ai/BenAIBrain';
import { farmingWorldState } from '../ai/FarmingWorldState';
import { worldSimulationEngine } from './WorldSimulationEngine';

import { raviNPCBrain } from '../npc/RaviNPCBrain';
import { RAVI_HOME_POSITION } from '../../types/locations';

export type SimulationListener = (state: SimulationState) => void;

class SimulationEngine {
  private state: SimulationState = {
    activeCitizenId: 'ben',
    citizens: {
      ben: {
        id: 'ben',
        position: [-2, getTerrainHeight(-2, 0), 0],
        rotationY: 0,
        speed: 0,
        animState: 'IDLE',
      },
      julie: {
        id: 'julie',
        position: [2, getTerrainHeight(2, 0), 0],
        rotationY: 0,
        speed: 0,
        animState: 'IDLE',
      },
      ravi: {
        id: 'ravi',
        position: [RAVI_HOME_POSITION[0], getTerrainHeight(RAVI_HOME_POSITION[0], RAVI_HOME_POSITION[2]), RAVI_HOME_POSITION[2]],
        rotationY: 0,
        speed: 0,
        animState: 'IDLE',
      },
    },
  };

  private listeners: Set<SimulationListener> = new Set();
  private keys: Record<string, boolean> = {};

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
    benAIBrain.setControlMode('AI');
    julieAIBrain.setControlMode('AI');
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;

    // Developer hotkeys 1..8 for direct manual animation testing
    const activeId = this.state.activeCitizenId;
    if (e.key === '1') this.setAnimState(activeId, 'IDLE');
    if (e.key === '2') this.setAnimState(activeId, 'WALK');
    if (e.key === '3') this.setAnimState(activeId, 'RUN');
    if (e.key === '4') this.setAnimState(activeId, 'SWIM');
    if (e.key === '5') this.setAnimState(activeId, 'TREAD_WATER');
    if (e.key === '6') this.setAnimState(activeId, 'WATER_CROP');
    if (e.key === '7') this.setAnimState(activeId, 'HARVEST_CROP');
    if (e.key === '8') this.setAnimState(activeId, 'PLANT_CROP');
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SimulationState {
    return this.state;
  }

  public setActiveCitizen(id: CitizenId) {
    this.state = {
      ...this.state,
      activeCitizenId: id,
    };
    this.notify();
  }

  public setAnimState(id: CitizenId, animState: AnimationState) {
    const targetCitizen = this.state.citizens[id];
    if (!targetCitizen) return;

    this.state = {
      ...this.state,
      citizens: {
        ...this.state.citizens,
        [id]: {
          ...targetCitizen,
          animState,
          speed: animState === 'RUN' ? 4.5 : animState === 'WALK' || animState === 'SWIM' ? 1.8 : 0,
        },
      },
    };
    this.notify();
  }

  /**
   * Update citizen movement relative to camera angle / gyro heading with water detection & float height snapping
   * @param delta Frame time delta in seconds
   * @param cameraAngleY Camera horizontal yaw angle (in radians) looking from camera to active citizen
   */
  public update(delta: number, cameraAngleY: number = 0) {
    const activeId = this.state.activeCitizenId;
    const activeCitizen = this.state.citizens[activeId];

    // Authoritative simulation clock integration
    const simDeltaMinutes = worldSimulationEngine.getState().isPaused ? 0 : worldSimulationEngine.lastSimDeltaMinutes;
    const timeStr = worldSimulationEngine.getFormattedTime(true);

    // 1. Tick physiological needs for Ben and Julie based on simulation clock delta
    farmingWorldState.tickNeeds('ben', simDeltaMinutes);
    farmingWorldState.tickNeeds('julie', simDeltaMinutes);

    // Collect current citizen positions
    const allPositions: Record<CitizenId, [number, number, number]> = {
      ben: [...this.state.citizens.ben.position],
      julie: [...this.state.citizens.julie.position],
      ravi: [...this.state.citizens.ravi.position],
    };

    // 2. Process Autonomous AI loop for Ben if Ben is in AI mode
    if (benAIBrain.getControlMode() === 'AI') {
      const benState = this.state.citizens.ben;
      const aiResult = benAIBrain.update(benState.position, benState.rotationY, delta, allPositions);

      if (aiResult) {
        this.state = {
          ...this.state,
          citizens: {
            ...this.state.citizens,
            ben: {
              ...benState,
              position: aiResult.position,
              rotationY: aiResult.rotationY,
              animState: aiResult.animState,
              speed: aiResult.animState === 'RUN' ? 4.5 : aiResult.animState === 'WALK' || aiResult.animState === 'SWIM' ? 2.4 : 0,
            },
          },
        };
        this.notify();
      }
    }

    // 3. Process Autonomous AI loop for Julie if Julie is in AI mode
    if (julieAIBrain.getControlMode() === 'AI') {
      const julieState = this.state.citizens.julie;
      const aiResult = julieAIBrain.update(julieState.position, julieState.rotationY, delta, allPositions);

      if (aiResult) {
        this.state = {
          ...this.state,
          citizens: {
            ...this.state.citizens,
            julie: {
              ...julieState,
              position: aiResult.position,
              rotationY: aiResult.rotationY,
              animState: aiResult.animState,
              speed: aiResult.animState === 'RUN' ? 4.5 : aiResult.animState === 'WALK' || aiResult.animState === 'SWIM' ? 2.4 : 0,
            },
          },
        };
        this.notify();
      }
    }

    // 4. Process Autonomous FSM loop for Ravi (Deterministic Vegetable Seller NPC)
    const raviState = this.state.citizens.ravi;
    const raviResult = raviNPCBrain.update(raviState.position, raviState.rotationY, delta, allPositions);
    if (raviResult) {
      this.state = {
        ...this.state,
        citizens: {
          ...this.state.citizens,
          ravi: {
            ...raviState,
            position: raviResult.position,
            rotationY: raviResult.rotationY,
            animState: raviResult.animState,
            speed: raviResult.animState === 'RUN' ? 4.5 : raviResult.animState === 'WALK' || raviResult.animState === 'SWIM' ? 2.4 : 0,
          },
        },
      };
      this.notify();
    }

    // 4. Manual Keyboard Control (WASD) for active citizen if not in AI mode
    const activeBrain = activeId === 'ben' ? benAIBrain : julieAIBrain;
    if (activeBrain.getControlMode() === 'AI') {
      // Active citizen is in AI mode, skip manual WASD processing
      return;
    }

    // Compute input movement vector from WASD / arrow keys for manual character
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['w'] || this.keys['arrowup']) inputZ -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) inputZ += 1;
    if (this.keys['a'] || this.keys['arrowleft']) inputX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) inputX += 1;

    const isMoving = inputX !== 0 || inputZ !== 0;
    const isRunning = isMoving && (this.keys['shift'] || false);

    // Compute next potential position
    let newPosX = activeCitizen.position[0];
    let newPosZ = activeCitizen.position[2];
    let currentRotY = activeCitizen.rotationY;

    if (isMoving) {
      const inputAngle = Math.atan2(inputX, inputZ);
      const moveAngle = cameraAngleY + inputAngle;

      const dirX = Math.sin(moveAngle);
      const dirZ = Math.cos(moveAngle);

      // Smooth rotation interpolation
      let diff = moveAngle - activeCitizen.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      currentRotY = activeCitizen.rotationY + diff * Math.min(1, delta * 14);

      // Determine movement speed based on terrain or water
      const isCurrentlyInWater = isPointInRiverWater(activeCitizen.position[0], activeCitizen.position[2]);
      const currentSpeed = isCurrentlyInWater
        ? isRunning ? 3.0 : 1.6
        : isRunning ? 4.5 : 1.8;

      const testPosX = activeCitizen.position[0] + dirX * currentSpeed * delta;
      const testPosZ = activeCitizen.position[2] + dirZ * currentSpeed * delta;
      const testGround = getDetectedGroundHeight(testPosX, testPosZ);

      // Prevent moving onto steep non-walkable terrain cliffs
      if (testGround.isWalkable || testGround.hitType === 'WATER') {
        newPosX = testPosX;
        newPosZ = testPosZ;
      }
    }

    // Evaluate exact ground height at active position
    const groundInfo = getDetectedGroundHeight(newPosX, newPosZ);
    let targetAnimState: AnimationState = 'IDLE';
    let targetSpeed = 0;
    let targetY = groundInfo.groundY;

    if (groundInfo.hitType === 'BRIDGE') {
      if (isMoving) {
        targetAnimState = isRunning ? 'RUN' : 'WALK';
        targetSpeed = isRunning ? 4.5 : 1.8;
      } else {
        targetAnimState = 'IDLE';
        targetSpeed = 0;
      }
    } else if (groundInfo.hitType === 'WATER') {
      if (isMoving) {
        targetAnimState = 'SWIM';
        targetSpeed = isRunning ? 3.0 : 1.6;
      } else {
        targetAnimState = 'TREAD_WATER';
        targetSpeed = 0;
      }
    } else {
      if (isMoving) {
        targetAnimState = isRunning ? 'RUN' : 'WALK';
        targetSpeed = isRunning ? 4.5 : 1.8;
      } else {
        targetAnimState = 'IDLE';
        targetSpeed = 0;
      }
    }

    // Smooth Y height float transition
    const currentY = activeCitizen.position[1];
    const smoothedY = currentY + (targetY - currentY) * Math.min(1, delta * 12);

    // Update state
    if (
      isMoving ||
      activeCitizen.animState !== targetAnimState ||
      Math.abs(currentY - targetY) > 0.01
    ) {
      this.state = {
        ...this.state,
        citizens: {
          ...this.state.citizens,
          [activeId]: {
            ...activeCitizen,
            position: [newPosX, smoothedY, newPosZ],
            rotationY: currentRotY,
            speed: targetSpeed,
            animState: targetAnimState,
          },
        },
      };
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getPhysicsTelemetry() {
    const activeCitizen = this.state.citizens[this.state.activeCitizenId];
    const pos = activeCitizen.position;
    const groundInfo = getDetectedGroundHeight(pos[0], pos[2]);

    const sectorCell = CoordinateConverter.worldToGrid(pos);
    const map = worldMapStore.getMap();
    const cell = map.getCell(sectorCell.sectorX, sectorCell.sectorZ, sectorCell.gridX, sectorCell.gridZ);

    const feetY = pos[1];
    const groundY = groundInfo.groundY;
    const feetDelta = feetY - groundY;

    return {
      position: [Math.round(pos[0] * 100) / 100, Math.round(pos[1] * 100) / 100, Math.round(pos[2] * 100) / 100],
      feetY: Math.round(feetY * 100) / 100,
      groundY: Math.round(groundY * 100) / 100,
      feetDelta: Math.round(feetDelta * 1000) / 1000,
      slopeAngleDeg: groundInfo.slopeAngleDeg,
      slopeGradient: groundInfo.slopeGradient,
      isWalkable: groundInfo.isWalkable,
      hitType: groundInfo.hitType,
      sectorCoords: `[${sectorCell.sectorX}, ${sectorCell.sectorZ}]`,
      cellCoords: `[${sectorCell.gridX}, ${sectorCell.gridZ}]`,
      cellGroundY: cell ? Math.round(cell.worldPos.y * 100) / 100 : 0,
      cellWalkable: cell ? cell.walkable : false,
      hitStatus: groundInfo.hitType !== 'CLIFF' && groundInfo.isWalkable ? 'HIT (WALKABLE)' : 'HIT (BLOCKED)',
    };
  }
}

export const simulationEngine = new SimulationEngine();
