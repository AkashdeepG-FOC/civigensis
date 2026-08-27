import { WorldMap } from './WorldMap';
import { HierarchicalPathfinder } from './HierarchicalPathfinder';
import {
  MapData,
  TerrainType,
  SemanticLocationItem,
  PathfindingResult,
  WorldPosition,
} from './types/navigationMap';

const STORAGE_KEY = 'civigensis_navigation_map_v1';

export type MapStoreListener = () => void;

class WorldMapStore {
  private map: WorldMap;
  private pathfinder: HierarchicalPathfinder;
  private listeners: Set<MapStoreListener> = new Set();

  // Active debug testing state
  private isMapEditorOpen: boolean = false;
  private isDebugOverlayVisible: boolean = true;
  private showSectorGrid: boolean = true;
  private showCellGrid: boolean = false;
  private showSemanticLocations: boolean = true;
  private showPathWaypoints: boolean = true;

  // Selected test path
  private testStartLocation: string = 'bens_house';
  private testTargetLocation: string = 'julies_bakery';
  private activeTestPath: PathfindingResult | null = null;

  constructor() {
    let savedData: MapData | undefined = undefined;
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          savedData = JSON.parse(raw);
          console.log('[WORLD MAP STORE]', 'Loaded saved navigation map from LocalStorage');
        }
      } catch (err) {
        console.warn('[WORLD MAP STORE]', 'Failed to load saved map from LocalStorage:', err);
      }
    }

    this.map = new WorldMap(savedData);
    this.pathfinder = new HierarchicalPathfinder(this.map);
  }

  public subscribe(listener: MapStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getMap(): WorldMap {
    return this.map;
  }

  public getPathfinder(): HierarchicalPathfinder {
    return this.pathfinder;
  }

  // Debug & UI state getters/setters
  public getIsMapEditorOpen(): boolean { return this.isMapEditorOpen; }
  public setIsMapEditorOpen(open: boolean) { this.isMapEditorOpen = open; this.notify(); }

  public getIsDebugOverlayVisible(): boolean { return this.isDebugOverlayVisible; }
  public setIsDebugOverlayVisible(visible: boolean) { this.isDebugOverlayVisible = visible; this.notify(); }

  public getShowSectorGrid(): boolean { return this.showSectorGrid; }
  public setShowSectorGrid(show: boolean) { this.showSectorGrid = show; this.notify(); }

  public getShowCellGrid(): boolean { return this.showCellGrid; }
  public setShowCellGrid(show: boolean) { this.showCellGrid = show; this.notify(); }

  public getShowSemanticLocations(): boolean { return this.showSemanticLocations; }
  public setShowSemanticLocations(show: boolean) { this.showSemanticLocations = show; this.notify(); }

  public getShowPathWaypoints(): boolean { return this.showPathWaypoints; }
  public setShowPathWaypoints(show: boolean) { this.showPathWaypoints = show; this.notify(); }

  public getTestStartLocation(): string { return this.testStartLocation; }
  public setTestStartLocation(id: string) { this.testStartLocation = id; this.notify(); }

  public getTestTargetLocation(): string { return this.testTargetLocation; }
  public setTestTargetLocation(id: string) { this.testTargetLocation = id; this.notify(); }

  public getActiveTestPath(): PathfindingResult | null { return this.activeTestPath; }

  /**
   * Runs test A* pathfinder between selected start and target locations
   */
  public runTestPathfind(): PathfindingResult {
    const startLoc = this.map.getSemanticLocation(this.testStartLocation);
    const targetLoc = this.map.getSemanticLocation(this.testTargetLocation);

    const startPos = startLoc ? startLoc.position : { x: -18, y: 0, z: -12 };
    const targetPos = targetLoc ? targetLoc.position : { x: 5, y: 0, z: -16 };

    const result = this.pathfinder.findPath(startPos, targetPos);
    this.activeTestPath = result;
    this.notify();
    return result;
  }

  /**
   * Paints cell terrain and updates map portals
   */
  public setCellTerrain(
    sectorX: number,
    sectorZ: number,
    gridX: number,
    gridZ: number,
    terrain: TerrainType,
    walkable: boolean
  ) {
    this.map.setCellTerrain(sectorX, sectorZ, gridX, gridZ, terrain, walkable);
    this.notify();
  }

  /**
   * Adds or updates a semantic location
   */
  public saveSemanticLocation(location: SemanticLocationItem) {
    this.map.setSemanticLocation(location);
    this.notify();
  }

  /**
   * Removes a semantic location
   */
  public removeSemanticLocation(id: string) {
    this.map.removeSemanticLocation(id);
    this.notify();
  }

  /**
   * Saves map data to LocalStorage
   */
  public saveMapToLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    const data = this.map.exportMapData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[WORLD MAP STORE]', 'Map data saved to LocalStorage');
    this.notify();
  }

  /**
   * Exports map data as JSON string download
   */
  public exportMapDataJSON(): string {
    return JSON.stringify(this.map.exportMapData(), null, 2);
  }

  /**
   * Imports JSON data string into map store
   */
  public importMapDataJSON(jsonString: string): boolean {
    try {
      const data: MapData = JSON.parse(jsonString);
      this.map = new WorldMap(data);
      this.pathfinder = new HierarchicalPathfinder(this.map);
      this.saveMapToLocalStorage();
      this.notify();
      return true;
    } catch (err) {
      console.error('[WORLD MAP STORE]', 'Failed to import JSON map data:', err);
      return false;
    }
  }

  /**
   * Resets map to default seeded configuration
   */
  public resetToDefault() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.map = new WorldMap();
    this.pathfinder = new HierarchicalPathfinder(this.map);
    this.activeTestPath = null;
    this.notify();
  }
}

export const worldMapStore = new WorldMapStore();
