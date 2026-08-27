import { SEMANTIC_LOCATIONS, getSemanticLocationAtPosition } from '../../types/locations';
import { getTerrainHeight } from '../../components/world/my/Terrain';
import { isPointInRiverWater, getRiverWaterSurfaceHeight } from '../../components/world/my/River';
import { HighLevelIntention } from '../../types/benAI';
import { CitizenId, AnimationState } from '../../types/citizen';
import { farmingWorldState } from './FarmingWorldState';
import { getCitizenMemorySystem } from './CitizenMemorySystem';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { simulationEngine } from '../simulation/SimulationEngine';
import { activityDurationManager } from '../simulation/ActivityDurationManager';
import { CITIZEN_INTERACTION_RANGE } from './InteractionConstants';
import { TargetResolver } from './TargetResolver';
import { worldMapStore } from '../navigation/WorldMapStore';
import { agentEventLogger } from '../logging/AgentEventLogger';

export interface NavigationTarget {
  locationId: string;
  name: string;
  position: [number, number, number];
  interactionRadius: number;
}

export type NavStatus = 'NONE' | 'PATHFINDING' | 'MOVING' | 'ARRIVED' | 'STUCK' | 'FAILED';

export interface CitizenNavState {
  currentIntention: HighLevelIntention | null;
  currentTarget: NavigationTarget | null;
  startLocationName?: string;
  navStatus: NavStatus;
  waypoints: [number, number, number][];
  currentWaypointIndex: number;
  isInteracting: boolean;
  interactionTimer: number;
  executedDecisionIds: Set<string>;
  targetLookAtPosition: [number, number, number] | null;
  lastPos: [number, number, number] | null;
  lastPosChangeTime: number;
  startTime: number;
  initialDistance: number;
  velocity: number;
}

export class NavigationSystem {
  private navStates: Record<CitizenId, CitizenNavState> = {
    ben: {
      currentIntention: null,
      currentTarget: null,
      navStatus: 'NONE',
      waypoints: [],
      currentWaypointIndex: 0,
      isInteracting: false,
      interactionTimer: 0,
      executedDecisionIds: new Set(),
      targetLookAtPosition: null,
      lastPos: null,
      lastPosChangeTime: 0,
      startTime: 0,
      initialDistance: 0,
      velocity: 0,
    },
    julie: {
      currentIntention: null,
      currentTarget: null,
      navStatus: 'NONE',
      waypoints: [],
      currentWaypointIndex: 0,
      isInteracting: false,
      interactionTimer: 0,
      executedDecisionIds: new Set(),
      targetLookAtPosition: null,
      lastPos: null,
      lastPosChangeTime: 0,
      startTime: 0,
      initialDistance: 0,
      velocity: 0,
    },
    ravi: {
      currentIntention: null,
      currentTarget: null,
      navStatus: 'NONE',
      waypoints: [],
      currentWaypointIndex: 0,
      isInteracting: false,
      interactionTimer: 0,
      executedDecisionIds: new Set(),
      targetLookAtPosition: null,
      lastPos: null,
      lastPosChangeTime: 0,
      startTime: 0,
      initialDistance: 0,
      velocity: 0,
    },
  };

  private getNavState(citizenId: CitizenId = 'ben'): CitizenNavState {
    if (!this.navStates[citizenId]) {
      this.navStates[citizenId] = {
        currentIntention: null,
        currentTarget: null,
        navStatus: 'NONE',
        waypoints: [],
        currentWaypointIndex: 0,
        isInteracting: false,
        interactionTimer: 0,
        executedDecisionIds: new Set(),
        targetLookAtPosition: null,
        lastPos: null,
        lastPosChangeTime: 0,
        startTime: 0,
        initialDistance: 0,
        velocity: 0,
      };
    }
    return this.navStates[citizenId];
  }

  public getCurrentIntention(citizenId: CitizenId = 'ben'): HighLevelIntention | null {
    return this.getNavState(citizenId).currentIntention;
  }

  public getNavStatus(citizenId: CitizenId = 'ben'): NavStatus {
    return this.getNavState(citizenId).navStatus;
  }

  public getVelocity(citizenId: CitizenId = 'ben'): number {
    return this.getNavState(citizenId).velocity;
  }

  public getDistanceToTarget(citizenId: CitizenId = 'ben', currentPos?: [number, number, number]): number {
    const navState = this.getNavState(citizenId);
    if (!navState.currentTarget || !currentPos) return 0;
    const dx = navState.currentTarget.position[0] - currentPos[0];
    const dz = navState.currentTarget.position[2] - currentPos[2];
    return Math.sqrt(dx * dx + dz * dz);
  }

  public getIsInteracting(citizenId: CitizenId = 'ben'): boolean {
    return this.getNavState(citizenId).isInteracting;
  }

  public getCurrentTarget(citizenId: CitizenId = 'ben'): NavigationTarget | null {
    return this.getNavState(citizenId).currentTarget;
  }

  public setLookAtTarget(citizenId: CitizenId, targetPos: [number, number, number] | null) {
    this.getNavState(citizenId).targetLookAtPosition = targetPos;
  }

  public setIntention(
    intention: HighLevelIntention,
    citizenId: CitizenId = 'ben',
    currentPos?: [number, number, number]
  ): boolean {
    const navState = this.getNavState(citizenId);
    const targetId = intention.parsedIntent?.target || (citizenId === 'ben' ? 'bens_farm' : 'julies_bakery');
    const resolvedTarget = TargetResolver.resolveTarget(targetId, currentPos);

    if (!resolvedTarget) {
      navState.navStatus = 'FAILED';
      return false;
    }

    navState.currentIntention = intention;
    navState.currentIntention.status = 'EXECUTING';
    navState.currentTarget = resolvedTarget;
    navState.startLocationName = getSemanticLocationAtPosition(currentPos || [0, 0, 0]);
    navState.isInteracting = false;
    navState.interactionTimer = 0;
    navState.startTime = Date.now();
    navState.lastPosChangeTime = Date.now();
    navState.lastPos = currentPos ? [...currentPos] : null;

    console.log(`[AI] Intent: GO_TO ${targetId}`);
    console.log(`[AI] Pathfinding started`);

    // Calculate path via HierarchicalPathfinder
    const startPos = currentPos || [0, 0, 0];
    navState.navStatus = 'PATHFINDING';
    const pathResult = worldMapStore.getPathfinder().findPath(startPos, resolvedTarget.position);

    if (pathResult.success && pathResult.waypoints && pathResult.waypoints.length > 0) {
      navState.waypoints = pathResult.waypoints.map((w: any) => {
        if (Array.isArray(w)) return [w[0], w[1], w[2]] as [number, number, number];
        const x = typeof w.x === 'number' && !isNaN(w.x) ? w.x : resolvedTarget.position[0];
        const y = typeof w.y === 'number' && !isNaN(w.y) ? w.y : resolvedTarget.position[1];
        const z = typeof w.z === 'number' && !isNaN(w.z) ? w.z : resolvedTarget.position[2];
        return [x, y, z] as [number, number, number];
      });
    } else {
      navState.waypoints = [[resolvedTarget.position[0], resolvedTarget.position[1], resolvedTarget.position[2]]];
    }

    navState.currentWaypointIndex = 0;
    navState.navStatus = 'MOVING';

    const dx = resolvedTarget.position[0] - startPos[0];
    const dz = resolvedTarget.position[2] - startPos[2];
    navState.initialDistance = Math.sqrt(dx * dx + dz * dz);
    navState.velocity = 0;

    console.log(`[AI] Navigation started for ${citizenId.toUpperCase()} (Target: ${resolvedTarget.name}, Waypoints: ${navState.waypoints.length})`);
    return true;
  }

  public clearIntention(citizenId: CitizenId = 'ben') {
    const navState = this.getNavState(citizenId);
    navState.currentIntention = null;
    navState.currentTarget = null;
    navState.navStatus = 'NONE';
    navState.waypoints = [];
    navState.currentWaypointIndex = 0;
    navState.isInteracting = false;
    navState.interactionTimer = 0;
    navState.targetLookAtPosition = null;
    navState.velocity = 0;
  }

  /**
   * Update frame steering towards current target for agent
   */
  public update(
    currentPos: [number, number, number],
    currentRotY: number,
    delta: number,
    citizenId: CitizenId = 'ben'
  ): {
    position: [number, number, number];
    rotationY: number;
    animState: AnimationState;
    isCompleted: boolean;
    isInvalidated: boolean;
    travelMemory?: string;
  } {
    const navState = this.getNavState(citizenId);

    // Dynamic spatial look-at rotation if active (e.g. looking towards conversation partner)
    if (navState.targetLookAtPosition && !navState.currentTarget) {
      const [tx, , tz] = navState.targetLookAtPosition;
      const dx = tx - currentPos[0];
      const dz = tz - currentPos[2];
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - currentRotY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      const newRotY = currentRotY + diff * Math.min(1, delta * 6);
      return {
        position: currentPos,
        rotationY: newRotY,
        animState: 'IDLE',
        isCompleted: false,
        isInvalidated: false,
      };
    }

    if (!navState.currentIntention || !navState.currentTarget) {
      return {
        position: currentPos,
        rotationY: currentRotY,
        animState: 'IDLE',
        isCompleted: false,
        isInvalidated: false,
      };
    }

    // Dynamic Live Citizen Target Position Update (Ben / Julie / Ravi)
    if (['ben', 'julie', 'ravi'].includes(navState.currentTarget.locationId)) {
      const targetCitizenId = navState.currentTarget.locationId as CitizenId;
      try {
        const livePos = simulationEngine.getState().citizens[targetCitizenId].position;
        navState.currentTarget.position = [livePos[0], livePos[1], livePos[2]];
      } catch {}
    }

    const [tx, ty, tz] = navState.currentTarget.position;
    const dx = tx - currentPos[0];
    const dz = tz - currentPos[2];
    const distSq = dx * dx + dz * dz;
    const isCitizenTarget = ['ben', 'julie', 'ravi'].includes(navState.currentTarget.locationId);
    const arrivalRadius = isCitizenTarget ? CITIZEN_INTERACTION_RANGE : Math.min(3.5, navState.currentTarget.interactionRadius);
    const arrivalThreshold = Math.pow(arrivalRadius, 2);

    // If within interaction range at destination
    if (distSq <= arrivalThreshold) {
      const isCitizenTarget = ['ben', 'julie', 'ravi'].includes(navState.currentTarget.locationId);
      const action = navState.currentIntention.parsedIntent.action;
      const actionStr = String(action).toUpperCase();

      if (isCitizenTarget || actionStr === 'GO_TO' || actionStr === 'MOVE_TO') {
        const citizenName = citizenId === 'ben' ? 'Ben' : 'Julie';
        const targetName = navState.currentTarget.name;
        const startLoc = navState.startLocationName || 'the village center';
        const nextAction = navState.currentIntention.expectedNextAction;
        const meaningfulExp = `${citizenName} travelled from ${startLoc} to ${targetName}${nextAction ? ` to ${nextAction.toLowerCase().replace('_', ' ')}` : ''}.`;

        console.log(`[NAV] Destination reached: ${targetName} for ${citizenId.toUpperCase()}`);
        console.log(`[NAV] Navigation completed`);

        const simState = worldSimulationEngine.getState();
        const decisionId = (navState.currentIntention.parsedIntent as any)?.decisionId;
        agentEventLogger.logMovementCompleted({
          agentId: citizenId,
          agentName: citizenName,
          decisionId,
          targetLocationId: navState.currentTarget.locationId,
          targetName,
          distanceToTarget: Math.round(Math.sqrt(distSq) * 10) / 10,
          location: getSemanticLocationAtPosition(currentPos),
          position: currentPos,
          simulationTime: {
            day: simState.time.day,
            hour: simState.time.hour,
            minute: simState.time.minute,
            total_minutes: worldSimulationEngine.getTotalSimulationMinutes(),
          },
        });
        if (nextAction) {
          console.log(`[MULTI_STEP][${citizenId.toUpperCase()}] Arrived at ${targetName}. Chaining expected next action: "${nextAction}"`);
        }
        console.log(`[MEMORY] Recorded meaningful travel experience: "${meaningfulExp}"`);

        // If next action is COLLECT_WATER, execute capability and auto-chain return leg to farm
        if (nextAction === 'COLLECT_WATER') {
          farmingWorldState.collectWaterFromRiver(citizenId);
          console.log(`[MULTI_STEP][${citizenId.toUpperCase()}] Refilled water buckets at river. Next step: Return to farm to water crops.`);
        } else if (nextAction === 'WATER_CROP') {
          farmingWorldState.waterWheatCrop(citizenId);
          console.log(`[MULTI_STEP][${citizenId.toUpperCase()}] Watered wheat field crops. Multi-step goal completed!`);
        } else if (nextAction === 'HARVEST_CROP') {
          farmingWorldState.harvestWheatCrop(citizenId);
          console.log(`[MULTI_STEP][${citizenId.toUpperCase()}] Harvested wheat crops! Multi-step goal completed!`);
        }

        navState.currentIntention.status = 'COMPLETED';
        this.clearIntention(citizenId);
        return {
          position: currentPos,
          rotationY: currentRotY,
          animState: 'IDLE',
          isCompleted: true,
          isInvalidated: false,
          travelMemory: meaningfulExp,
        };
      }

      const currentSimMinutes = worldSimulationEngine.getTotalSimulationMinutes();
      const period = worldSimulationEngine.getState().environment.period;
      const hour = worldSimulationEngine.getState().time.hour;
      const target = navState.currentIntention.parsedIntent.target;
      const decisionId = navState.currentIntention.id;

      // Start duration-based activity ONCE upon arrival at destination
      activityDurationManager.startActivity(
        citizenId,
        action,
        target,
        currentSimMinutes,
        period,
        hour,
        decisionId
      );

      // Check if simulation-time activity duration has completed
      const durationCheck = activityDurationManager.update(citizenId, currentSimMinutes);

      if (durationCheck.isCompleted) {
        // Guard: ONE decision ID = ONE physical execution
        if (navState.executedDecisionIds.has(decisionId)) {
          navState.currentIntention.status = 'COMPLETED';
          activityDurationManager.clearActivity(citizenId);
          this.clearIntention(citizenId);
          return {
            position: currentPos,
            rotationY: currentRotY,
            animState: 'IDLE',
            isCompleted: true,
            isInvalidated: false,
          };
        }

        navState.executedDecisionIds.add(decisionId);
        if (navState.executedDecisionIds.size > 100) {
          const firstKey = navState.executedDecisionIds.values().next().value;
          if (firstKey) navState.executedDecisionIds.delete(firstKey);
        }

        // Execute physical world state changes and record episodic memory
        const success = this.executeActionAtDestination(navState.currentTarget.locationId, navState.currentIntention, decisionId, citizenId);
        activityDurationManager.clearActivity(citizenId);

        if (success) {
          console.log(`[AI][EXECUTION] [${citizenId.toUpperCase()}] Action ${action} executed successfully at ${navState.currentTarget.name}`);
          navState.currentIntention.status = 'COMPLETED';
          this.clearIntention(citizenId);
          return {
            position: currentPos,
            rotationY: currentRotY,
            animState: 'IDLE',
            isCompleted: true,
            isInvalidated: false,
          };
        } else {
          console.warn(`[AI][INTENTION_INVALIDATED] Action ${action} failed execution check at ${navState.currentTarget.name} for ${citizenId}`);
          navState.currentIntention.status = 'INVALIDATED';
          this.clearIntention(citizenId);
          return {
            position: currentPos,
            rotationY: currentRotY,
            animState: 'IDLE',
            isCompleted: false,
            isInvalidated: true,
          };
        }
      }

      // Interacting with Farming Pack animations while completing simulation duration
      const inWater = isPointInRiverWater(currentPos[0], currentPos[2]);
      let animState: AnimationState = inWater ? 'TREAD_WATER' : 'IDLE';

      if (!inWater) {
        if (action === 'WATER_CROP' || action === 'COLLECT_WATER') animState = 'WATER_CROP';
        else if (action === 'HARVEST_CROP') animState = 'HARVEST_CROP';
        else if (action === 'INSPECT') animState = 'PLANT_CROP';
      }

      return {
        position: currentPos,
        rotationY: currentRotY,
        animState,
        isCompleted: false,
        isInvalidated: false,
      };
    }

    // Stuck & Timeout Detection (Sampled over 1-second intervals)
    const now = Date.now();
    if (navState.lastPos) {
      if (now - navState.lastPosChangeTime >= 1000) {
        const dxLast = currentPos[0] - navState.lastPos[0];
        const dzLast = currentPos[2] - navState.lastPos[2];
        const distMovedLast = Math.sqrt(dxLast * dxLast + dzLast * dzLast);
        navState.lastPosChangeTime = now;
        navState.lastPos = [...currentPos];

        if (distMovedLast < 0.15) {
          navState.interactionTimer = (navState.interactionTimer || 0) + 1;
          if (navState.interactionTimer >= 5) {
            console.warn(`[NAVIGATION_STUCK][${citizenId.toUpperCase()}] Character stuck for >5s while moving toward ${navState.currentTarget.name}`);
            navState.navStatus = 'STUCK';
            this.clearIntention(citizenId);
            return {
              position: currentPos,
              rotationY: currentRotY,
              animState: 'IDLE',
              isCompleted: false,
              isInvalidated: true,
            };
          }
        } else {
          navState.interactionTimer = 0;
        }
      }
    } else {
      navState.lastPos = [...currentPos];
      navState.lastPosChangeTime = now;
      navState.interactionTimer = 0;
    }

    const maxAllowedSecs = Math.max(20, (navState.initialDistance / 2.0) * 3 + 10);
    if ((now - navState.startTime) / 1000 > maxAllowedSecs) {
      console.warn(`[NAVIGATION_TIMEOUT][${citizenId.toUpperCase()}] Navigation timed out after ${maxAllowedSecs.toFixed(1)}s toward ${navState.currentTarget.name}`);
      navState.navStatus = 'FAILED';
      this.clearIntention(citizenId);
      return {
        position: currentPos,
        rotationY: currentRotY,
        animState: 'IDLE',
        isCompleted: false,
        isInvalidated: true,
      };
    }

    // Environmental Navigation Modifiers (NAV-001 & FLOOD-001)
    const worldState = worldSimulationEngine.getState();
    if (worldState.hazards.floodLevel > 0.8 && navState.currentTarget.locationId === 'river') {
      console.warn('[NAVIGATION BLOCKED]', `Target ${navState.currentTarget.name} is flooded and impassable for ${citizenId}`);
      navState.navStatus = 'FAILED';
      this.clearIntention(citizenId);
      return {
        position: currentPos,
        rotationY: currentRotY,
        animState: 'IDLE',
        isCompleted: false,
        isInvalidated: true,
      };
    }

    // Soil Mud Drag Multiplier
    const soilMoisture = worldState.soil.moisture;
    const mudMultiplier = soilMoisture > 90 ? 0.45 : soilMoisture > 70 ? 0.65 : 1.0;

    // Waypoint Corridor Navigation
    let activeWaypoint = navState.waypoints[navState.currentWaypointIndex] || navState.currentTarget.position;
    const dxW = activeWaypoint[0] - currentPos[0];
    const dzW = activeWaypoint[2] - currentPos[2];
    const distToWaypointSq = dxW * dxW + dzW * dzW;

    if (distToWaypointSq <= 4.0 && navState.currentWaypointIndex < navState.waypoints.length - 1) {
      navState.currentWaypointIndex++;
      activeWaypoint = navState.waypoints[navState.currentWaypointIndex];
    }

    let targetDx = activeWaypoint[0] - currentPos[0];
    let targetDz = activeWaypoint[2] - currentPos[2];

    if (isNaN(targetDx) || isNaN(targetDz)) {
      activeWaypoint = navState.currentTarget.position;
      targetDx = activeWaypoint[0] - currentPos[0];
      targetDz = activeWaypoint[2] - currentPos[2];
    }

    const targetAngle = isNaN(Math.atan2(targetDx, targetDz)) ? 0 : Math.atan2(targetDx, targetDz);
    let diff = targetAngle - currentRotY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    const newRotY = currentRotY + diff * Math.min(1, delta * 8);

    const baseSpeed = 2.4; // Controlled walking speed for AI
    const speed = baseSpeed * mudMultiplier;
    const stepDist = speed * delta;
    const calcNextX = currentPos[0] + Math.sin(targetAngle) * stepDist;
    const calcNextZ = currentPos[2] + Math.cos(targetAngle) * stepDist;

    const nextX = isNaN(calcNextX) ? currentPos[0] : calcNextX;
    const nextZ = isNaN(calcNextZ) ? currentPos[2] : calcNextZ;

    const actualDx = nextX - currentPos[0];
    const actualDz = nextZ - currentPos[2];
    const actualVelocity = Math.sqrt(actualDx * actualDx + actualDz * actualDz) / Math.max(0.001, delta);
    navState.velocity = actualVelocity;

    const inWater = isPointInRiverWater(nextX, nextZ);
    let nextY = getTerrainHeight(nextX, nextZ);
    if (inWater) {
      const waterSurfaceY = getRiverWaterSurfaceHeight(nextX, nextZ);
      nextY = waterSurfaceY - 0.85;
    }

    const currentY = currentPos[1];
    const smoothedY = currentY + (nextY - currentY) * Math.min(1, delta * 8);

    // Animation state strictly matches actual physical velocity
    let animState: AnimationState = 'IDLE';
    if (inWater) {
      animState = actualVelocity > 0.1 ? 'SWIM' : 'TREAD_WATER';
    } else {
      if (actualVelocity > 3.2) animState = 'RUN';
      else if (actualVelocity > 0.1) animState = 'WALK';
      else animState = 'IDLE';
    }

    return {
      position: [nextX, smoothedY, nextZ],
      rotationY: newRotY,
      animState,
      isCompleted: false,
      isInvalidated: false,
    };
  }

  /**
   * Execute physical action at destination strictly according to pre-decided ParsedIntent action
   */
  private executeActionAtDestination(locationId: string, intention: HighLevelIntention, decisionId: string, citizenId: CitizenId = 'ben'): boolean {
    const { action } = intention.parsedIntent;
    const timeStr = worldSimulationEngine.getFormattedTime(false);
    const agentName = citizenId === 'ben' ? 'Ben' : 'Julie';
    const memSys = getCitizenMemorySystem(citizenId);

    if (action === 'COLLECT_WATER') {
      const ok = farmingWorldState.collectWaterFromRiver(citizenId);
      if (ok) {
        const memText = `${agentName} collected water from the river. (Water buckets: ${farmingWorldState.getNeeds(citizenId).waterBucket})`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] MEMORY:`, memText);
        return true;
      }
      return false;
    }

    if (action === 'WATER_CROP') {
      const ok = farmingWorldState.waterWheatCrop(citizenId);
      if (ok) {
        const memText = `${agentName} watered the wheat field at farm. (Wheat water level: ${Math.round(farmingWorldState.wheatCrop.waterLevel)}%)`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] MEMORY:`, memText);
        return true;
      } else {
        const memText = `${agentName} attempted to water wheat at farm but had no water buckets.`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] MEMORY FAILED:`, memText);
        return false;
      }
    }

    if (action === 'HARVEST_CROP') {
      const ok = farmingWorldState.harvestWheatCrop(citizenId);
      if (ok) {
        const memText = `${agentName} harvested mature wheat at farm. (Wheat stock: ${farmingWorldState.getNeeds(citizenId).harvestedWheat})`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] MEMORY:`, memText);
        return true;
      }
      return false;
    }

    if (action === 'EAT') {
      const res = farmingWorldState.eatFood(citizenId);
      if (res.success) {
        const memText = `${agentName} ate food at ${locationId.replace('_', ' ')}. (Hunger reduced to ${res.hungerAfter.toFixed(0)}%, food stock: ${res.foodStockAfter})`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] MEMORY:`, memText);
        return true;
      } else {
        const memText = `${agentName} attempted to eat at ${locationId.replace('_', ' ')} but failed: ${res.reason}`;
        memSys.addEpisodicMemory(memText, timeStr);
        console.log(`[${decisionId}] EAT EXECUTION FAILED:`, res.reason);
        return false;
      }
    }

    if (action === 'REST') {
      farmingWorldState.restAtHome(citizenId);
      const memText = `${agentName} rested at ${locationId.replace('_', ' ')}. (Energy restored)`;
      memSys.addEpisodicMemory(memText, timeStr);
      console.log(`[${decisionId}] MEMORY:`, memText);
      return true;
    }

    if (action === 'INSPECT') {
      const memText = `${agentName} inspected ${locationId.replace('_', ' ')}.`;
      memSys.addEpisodicMemory(memText, timeStr);
      console.log(`[${decisionId}] MEMORY:`, memText);
      return true;
    }

    // Action === 'GO_TO'
    const memText = `${agentName} visited ${locationId.replace('_', ' ')}.`;
    memSys.addEpisodicMemory(memText, timeStr);
    console.log(`[${decisionId}] MEMORY:`, memText);
    return true;
  }
}

export const navigationSystem = new NavigationSystem();
