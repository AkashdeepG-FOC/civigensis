import { LocationRegistry } from '../ai/LocationRegistry';
import { CoordinateConverter } from './CoordinateConverter';
import { worldMapStore } from './WorldMapStore';

export type RoadType = 'normal' | 'main' | 'farm' | 'forest' | 'bridge';

export interface RoadTypeConfig {
  id: RoadType;
  name: string;
  costMultiplier: number;
  color: string;
  width: number;
}

export const ROAD_TYPES: Record<RoadType, RoadTypeConfig> = {
  normal: { id: 'normal', name: 'Normal Road', costMultiplier: 1.0, color: '#94a3b8', width: 4 },
  main: { id: 'main', name: 'Main Road', costMultiplier: 0.8, color: '#475569', width: 6 },
  farm: { id: 'farm', name: 'Farm Road', costMultiplier: 1.2, color: '#d97706', width: 4 },
  forest: { id: 'forest', name: 'Forest Path', costMultiplier: 2.0, color: '#15803d', width: 3 },
  bridge: { id: 'bridge', name: 'Bridge', costMultiplier: 1.0, color: '#78350f', width: 5 },
};

export interface RoadNode {
  id: string;
  x: number;
  z: number;
  locationId?: string;
}

export interface RoadSegment {
  id: string;
  type: RoadType;
  nodes: RoadNode[];
  costMultiplier: number;
}

export interface ExportedRoadMapData {
  worldSize: {
    width: number;
    height: number;
  };
  roads: {
    id: string;
    type: RoadType;
    nodes: { x: number; z: number }[];
  }[];
  locations: {
    id: string;
    worldPosition: { x: number; y: number; z: number };
  }[];
}

export interface ShortestPathTestResult {
  success: boolean;
  distance: number;
  nodeCount: number;
  estimatedTimeSec: number;
  pathNodes: { x: number; z: number }[];
  startNode?: { x: number; z: number };
  targetNode?: { x: number; z: number };
  error?: string;
}

const STORAGE_KEY = 'civigensis_road_network_v2';

export class RoadNetworkStore {
  private nodes: Map<string, RoadNode> = new Map();
  private segments: Map<string, RoadSegment> = new Map();
  private history: string[] = [];
  private historyIndex: number = -1;

  constructor() {
    this.loadFromStorage();
    if (this.segments.size === 0) {
      this.initDefaultRoadNetwork();
    }
  }

  /**
   * Initial default road network connecting canonical village landmarks
   */
  private initDefaultRoadNetwork() {
    const locs = LocationRegistry.getInstance().getAllLocations();
    const locMap = new Map<string, { x: number; z: number }>();
    locs.forEach((loc) => {
      locMap.set(loc.id, { x: loc.position[0], z: loc.position[2] });
    });

    const createNode = (id: string, x: number, z: number, locationId?: string): RoadNode => {
      const node: RoadNode = { id, x: Math.round(x * 10) / 10, z: Math.round(z * 10) / 10, locationId };
      this.nodes.set(id, node);
      return node;
    };

    // Landmark nodes
    const bensFarm = locMap.get('bens_farm') || { x: 120, z: -160 };
    const bensHouse = locMap.get('bens_house') || { x: -18, z: -12 };
    const villageCenter = locMap.get('village_center') || { x: 0, z: 5 };
    const market = locMap.get('market') || { x: 0, z: 22 };
    const river = locMap.get('river') || { x: -18, z: -65 };
    const juliesFarm = locMap.get('julies_farm') || { x: 5, z: -16 };
    const well = locMap.get('well') || { x: 5, z: 0 };
    const bridge = { x: -18, z: -65 };

    const nBensFarm = createNode('node_bens_farm', bensFarm.x, bensFarm.z, 'bens_farm');
    const nBensHouse = createNode('node_bens_house', bensHouse.x, bensHouse.z, 'bens_house');
    const nVillageCenter = createNode('node_village_center', villageCenter.x, villageCenter.z, 'village_center');
    const nMarket = createNode('node_market', market.x, market.z, 'market');
    const nRiver = createNode('node_river', river.x, river.z, 'river');
    const nJuliesFarm = createNode('node_julies_farm', juliesFarm.x, juliesFarm.z, 'julies_farm');
    const nWell = createNode('node_well', well.x, well.z, 'well');
    const nBridge = createNode('node_bridge', bridge.x, bridge.z, 'bridge');

    // Intermediate junctions
    const j1 = createNode('j1', 50, -80);
    const j2 = createNode('j2', 0, -30);

    // Initial default roads
    this.addRoadSegment([nBensFarm, j1, nVillageCenter], 'main');
    this.addRoadSegment([nVillageCenter, nMarket, nWell], 'normal');
    this.addRoadSegment([nVillageCenter, j2, nBridge, nRiver], 'bridge');
    this.addRoadSegment([nBridge, nJuliesFarm], 'farm');
    this.addRoadSegment([nBensHouse, nVillageCenter], 'normal');
    this.addRoadSegment([nBensFarm, nMarket], 'farm'); // Alternative shortcut route!

    this.saveStateToHistory();
    this.rasterizeToWorldMap();
  }

  public getNodes(): RoadNode[] {
    return Array.from(this.nodes.values());
  }

  public getSegments(): RoadSegment[] {
    return Array.from(this.segments.values());
  }

  public addRoadSegment(nodesInput: { x: number; z: number; id?: string }[], type: RoadType = 'normal'): RoadSegment {
    const segmentId = `road_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const segmentNodes: RoadNode[] = [];

    nodesInput.forEach((n, idx) => {
      let existingNode = this.findNearestNode(n.x, n.z, 3.0);
      if (!existingNode) {
        const nodeId = n.id || `node_${Date.now()}_${idx}`;
        existingNode = { id: nodeId, x: Math.round(n.x * 10) / 10, z: Math.round(n.z * 10) / 10 };
        this.nodes.set(existingNode.id, existingNode);
      }
      segmentNodes.push(existingNode);
    });

    const config = ROAD_TYPES[type] || ROAD_TYPES.normal;
    const segment: RoadSegment = {
      id: segmentId,
      type,
      nodes: segmentNodes,
      costMultiplier: config.costMultiplier,
    };

    this.segments.set(segmentId, segment);
    this.saveStateToHistory();
    this.rasterizeToWorldMap();
    return segment;
  }

  public deleteSegment(segmentId: string): boolean {
    const deleted = this.segments.delete(segmentId);
    if (deleted) {
      this.cleanupOrphanNodes();
      this.saveStateToHistory();
      this.rasterizeToWorldMap();
    }
    return deleted;
  }

  private cleanupOrphanNodes() {
    const usedNodeIds = new Set<string>();
    this.segments.forEach((seg) => {
      seg.nodes.forEach((n) => usedNodeIds.add(n.id));
    });
    this.nodes.forEach((node, id) => {
      if (!usedNodeIds.has(id) && !node.locationId) {
        this.nodes.delete(id);
      }
    });
  }

  public findNearestNode(x: number, z: number, maxDist: number = Infinity): RoadNode | null {
    let nearest: RoadNode | null = null;
    let minDistSq = maxDist * maxDist;

    this.nodes.forEach((node) => {
      const dx = node.x - x;
      const dz = node.z - z;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = node;
      }
    });

    return nearest;
  }

  /**
   * Auto-detect line segment intersections and split/connect them
   */
  public autoConnectIntersections(): number {
    let newIntersections = 0;
    const segList = Array.from(this.segments.values());

    for (let i = 0; i < segList.length; i++) {
      for (let j = i + 1; j < segList.length; j++) {
        const segA = segList[i];
        const segB = segList[j];

        for (let a = 0; a < segA.nodes.length - 1; a++) {
          for (let b = 0; b < segB.nodes.length - 1; b++) {
            const p1 = segA.nodes[a];
            const p2 = segA.nodes[a + 1];
            const p3 = segB.nodes[b];
            const p4 = segB.nodes[b + 1];

            const intersection = this.getLineIntersection(p1, p2, p3, p4);
            if (intersection) {
              const junctionId = `junction_${Math.round(intersection.x)}_${Math.round(intersection.z)}`;
              let jNode = this.nodes.get(junctionId);
              if (!jNode) {
                jNode = { id: junctionId, x: Math.round(intersection.x * 10) / 10, z: Math.round(intersection.z * 10) / 10 };
                this.nodes.set(junctionId, jNode);
                newIntersections++;
              }

              // Insert junction node into segA if not present
              if (!segA.nodes.some((n) => n.id === jNode!.id)) {
                segA.nodes.splice(a + 1, 0, jNode);
              }
              // Insert junction node into segB if not present
              if (!segB.nodes.some((n) => n.id === jNode!.id)) {
                segB.nodes.splice(b + 1, 0, jNode);
              }
            }
          }
        }
      }
    }

    if (newIntersections > 0) {
      this.saveStateToHistory();
      this.rasterizeToWorldMap();
    }
    return newIntersections;
  }

  private getLineIntersection(
    p1: { x: number; z: number },
    p2: { x: number; z: number },
    p3: { x: number; z: number },
    p4: { x: number; z: number }
  ): { x: number; z: number } | null {
    const denom = (p4.z - p3.z) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.z - p1.z);
    if (Math.abs(denom) < 0.0001) return null; // Parallel

    const ua = ((p4.x - p3.x) * (p1.z - p3.z) - (p4.z - p3.z) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.z - p3.z) - (p2.z - p1.z) * (p1.x - p3.x)) / denom;

    if (ua > 0.05 && ua < 0.95 && ub > 0.05 && ub < 0.95) {
      return {
        x: p1.x + ua * (p2.x - p1.x),
        z: p1.z + ua * (p2.z - p1.z),
      };
    }
    return null;
  }

  /**
   * Shortest path calculation over road network using weighted A*
   */
  public findShortestPath(startPos: { x: number; z: number }, targetPos: { x: number; z: number }): ShortestPathTestResult {
    const startNode = this.findNearestNode(startPos.x, startPos.z);
    const targetNode = this.findNearestNode(targetPos.x, targetPos.z);

    if (!startNode || !targetNode) {
      return {
        success: false,
        distance: 0,
        nodeCount: 0,
        estimatedTimeSec: 0,
        pathNodes: [],
        error: 'No road nodes found near start or target location.',
      };
    }

    // Build adjacency graph
    const adjMap = new Map<string, { targetId: string; dist: number; cost: number }[]>();
    this.nodes.forEach((node) => adjMap.set(node.id, []));

    this.segments.forEach((seg) => {
      for (let i = 0; i < seg.nodes.length - 1; i++) {
        const u = seg.nodes[i];
        const v = seg.nodes[i + 1];
        const dx = u.x - v.x;
        const dz = u.z - v.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const cost = dist * seg.costMultiplier;

        adjMap.get(u.id)?.push({ targetId: v.id, dist, cost });
        adjMap.get(v.id)?.push({ targetId: u.id, dist, cost });
      }
    });

    // A* algorithm
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();
    const cameFrom = new Map<string, string>();
    const openSet = new Set<string>();

    this.nodes.forEach((n) => {
      gScore.set(n.id, Infinity);
      fScore.set(n.id, Infinity);
    });

    const heuristic = (nId: string) => {
      const node = this.nodes.get(nId);
      if (!node) return 0;
      const dx = node.x - targetNode.x;
      const dz = node.z - targetNode.z;
      return Math.sqrt(dx * dx + dz * dz);
    };

    gScore.set(startNode.id, 0);
    fScore.set(startNode.id, heuristic(startNode.id));
    openSet.add(startNode.id);

    while (openSet.size > 0) {
      let currentId: string | null = null;
      let minF = Infinity;

      openSet.forEach((id) => {
        const f = fScore.get(id) ?? Infinity;
        if (f < minF) {
          minF = f;
          currentId = id;
        }
      });

      if (!currentId) break;
      if (currentId === targetNode.id) {
        // Reconstruct path
        const pathIds: string[] = [currentId];
        let currNodeId: string = currentId;
        while (cameFrom.has(currNodeId)) {
          currNodeId = cameFrom.get(currNodeId)!;
          pathIds.unshift(currNodeId);
        }

        let totalDist = 0;
        const pathNodes: { x: number; z: number }[] = [];
        for (let i = 0; i < pathIds.length; i++) {
          const n = this.nodes.get(pathIds[i]);
          if (n) pathNodes.push({ x: n.x, z: n.z });
          if (i > 0) {
            const prev = this.nodes.get(pathIds[i - 1]);
            if (prev && n) {
              const dx = n.x - prev.x;
              const dz = n.z - prev.z;
              totalDist += Math.sqrt(dx * dx + dz * dz);
            }
          }
        }

        const walkingSpeed = 2.8; // ~2.8 m/s walking speed
        return {
          success: true,
          distance: Math.round(totalDist * 10) / 10,
          nodeCount: pathNodes.length,
          estimatedTimeSec: Math.round(totalDist / walkingSpeed),
          pathNodes,
          startNode: { x: startNode.x, z: startNode.z },
          targetNode: { x: targetNode.x, z: targetNode.z },
        };
      }

      openSet.delete(currentId);
      const neighbors = adjMap.get(currentId) || [];

      for (const edge of neighbors) {
        const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.cost;
        if (tentativeG < (gScore.get(edge.targetId) ?? Infinity)) {
          cameFrom.set(edge.targetId, currentId);
          gScore.set(edge.targetId, tentativeG);
          fScore.set(edge.targetId, tentativeG + heuristic(edge.targetId));
          openSet.add(edge.targetId);
        }
      }
    }

    return {
      success: false,
      distance: 0,
      nodeCount: 0,
      estimatedTimeSec: 0,
      pathNodes: [],
      error: 'No valid road route exists between the selected start and target.',
    };
  }

  /**
   * Rasterize drawn roads onto WorldMap grid cells so 3D NPCs walk on painted roads
   */
  public rasterizeToWorldMap() {
    this.segments.forEach((seg) => {
      for (let i = 0; i < seg.nodes.length - 1; i++) {
        const u = seg.nodes[i];
        const v = seg.nodes[i + 1];

        const steps = Math.max(1, Math.ceil(Math.hypot(v.x - u.x, v.z - u.z) / 4));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const wx = u.x + t * (v.x - u.x);
          const wz = u.z + t * (v.z - u.z);

          const { sectorX, sectorZ, gridX, gridZ } = CoordinateConverter.worldToGrid({ x: wx, y: 0, z: wz });
          worldMapStore.setCellTerrain(sectorX, sectorZ, gridX, gridZ, 'ROAD', true);
        }
      }
    });
  }

  // Undo / Redo management
  private saveStateToHistory() {
    const data = this.exportJSON();
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(data);
    this.historyIndex = this.history.length - 1;
    this.saveToStorage();
  }

  public undo(): boolean {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.importJSON(this.history[this.historyIndex], false);
      return true;
    }
    return false;
  }

  public redo(): boolean {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.importJSON(this.history[this.historyIndex], false);
      return true;
    }
    return false;
  }

  // Export JSON format matching user specification
  public exportJSON(): string {
    const exportData: ExportedRoadMapData = {
      worldSize: { width: 1000, height: 1000 },
      roads: Array.from(this.segments.values()).map((seg) => ({
        id: seg.id,
        type: seg.type,
        nodes: seg.nodes.map((n) => ({ x: n.x, z: n.z })),
      })),
      locations: LocationRegistry.getInstance().getAllLocations().map((loc) => ({
        id: loc.id,
        worldPosition: { x: loc.position[0], y: loc.position[1], z: loc.position[2] },
      })),
    };
    return JSON.stringify(exportData, null, 2);
  }

  public importJSON(jsonStr: string, saveHistory: boolean = true) {
    try {
      const data: ExportedRoadMapData = JSON.parse(jsonStr);
      this.nodes.clear();
      this.segments.clear();

      if (data && Array.isArray(data.roads)) {
        data.roads.forEach((r, idx) => {
          const nodes = r.nodes.map((n, nIdx) => {
            const nodeId = `imported_${idx}_${nIdx}`;
            const node: RoadNode = { id: nodeId, x: n.x, z: n.z };
            this.nodes.set(nodeId, node);
            return node;
          });
          const config = ROAD_TYPES[r.type] || ROAD_TYPES.normal;
          const seg: RoadSegment = {
            id: r.id || `road_${idx}`,
            type: r.type,
            nodes,
            costMultiplier: config.costMultiplier,
          };
          this.segments.set(seg.id, seg);
        });
      }

      if (saveHistory) {
        this.saveStateToHistory();
      }
      this.rasterizeToWorldMap();
    } catch (err) {
      console.error('[ROAD_NETWORK_STORE] Failed to import JSON:', err);
    }
  }

  private saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, this.exportJSON());
      } catch (err) {
        console.warn('[ROAD_NETWORK_STORE] LocalStorage save failed:', err);
      }
    }
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.importJSON(raw, false);
        }
      } catch (err) {
        console.warn('[ROAD_NETWORK_STORE] LocalStorage load failed:', err);
      }
    }
  }
}

export const roadNetworkStore = new RoadNetworkStore();
