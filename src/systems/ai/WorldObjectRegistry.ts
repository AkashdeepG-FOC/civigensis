import { WorldObjectState } from '../../types/citizenAgent';
import { CitizenId } from '../../types/citizen';

export class WorldObjectRegistry {
  private static instance: WorldObjectRegistry;
  private objects: Map<string, WorldObjectState> = new Map();

  constructor() {
    this.seedDefaultWorldObjects();
  }

  public static getInstance(): WorldObjectRegistry {
    if (!WorldObjectRegistry.instance) {
      WorldObjectRegistry.instance = new WorldObjectRegistry();
    }
    return WorldObjectRegistry.instance;
  }

  private seedDefaultWorldObjects() {
    const defaults: WorldObjectState[] = [
      {
        id: 'bread_01',
        type: 'food',
        name: 'Fresh Bakery Bread',
        owner: 'julie',
        location: 'julies_bakery',
        quantity: 3,
        position: [5, 0, -16],
        state: 'fresh',
        isInteractable: true,
      },
      {
        id: 'water_bucket_01',
        type: 'container',
        name: 'Wooden Water Bucket',
        owner: 'ben',
        location: 'bens_farm',
        quantity: 2,
        position: [120, 0, -160],
        state: 'full',
        isInteractable: true,
      },
      {
        id: 'wheat_stock_01',
        type: 'crop',
        name: 'Harvested Wheat Bundle',
        owner: 'ben',
        location: 'bens_farm',
        quantity: 5,
        position: [120, 0, -160],
        state: 'dried',
        isInteractable: true,
      },
      {
        id: 'farm_tools_01',
        type: 'tool',
        name: 'Farming Hoe & Sickle',
        owner: 'ben',
        location: 'bens_farm',
        quantity: 1,
        position: [120, 0, -160],
        state: 'durable',
        isInteractable: true,
      },
      {
        id: 'flour_sack_01',
        type: 'resource',
        name: 'Flour Sack',
        owner: 'julie',
        location: 'julies_bakery',
        quantity: 2,
        position: [5, 0, -16],
        state: 'sealed',
        isInteractable: true,
      },
      {
        id: 'stone_well_01',
        type: 'structure',
        name: 'Village Well',
        owner: 'none',
        location: 'village_center',
        quantity: 1,
        position: [0, 0, 5],
        state: 'active',
        isInteractable: true,
      },
    ];

    defaults.forEach((obj) => this.objects.set(obj.id, obj));
  }

  public getObject(id: string): WorldObjectState | undefined {
    const idLower = id.toLowerCase().trim();
    if (this.objects.has(idLower)) return this.objects.get(idLower);

    for (const obj of this.objects.values()) {
      if (obj.id.toLowerCase() === idLower || obj.name.toLowerCase().includes(idLower) || obj.type.toLowerCase() === idLower) {
        return obj;
      }
    }
    return undefined;
  }

  public getAllObjects(): WorldObjectState[] {
    return Array.from(this.objects.values());
  }

  public getObjectsNear(pos: [number, number, number], maxDist: number = 35.0): WorldObjectState[] {
    return Array.from(this.objects.values()).filter((obj) => {
      const dx = obj.position[0] - pos[0];
      const dy = obj.position[1] - pos[1];
      const dz = obj.position[2] - pos[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      return dist <= maxDist;
    });
  }

  public getObjectsByOwner(owner: CitizenId): WorldObjectState[] {
    return Array.from(this.objects.values()).filter((obj) => obj.owner === owner);
  }

  public transferOwnership(objectId: string, newOwner: CitizenId | 'environment' | 'none', newLocation: string) {
    const obj = this.getObject(objectId);
    if (obj) {
      obj.owner = newOwner;
      obj.location = newLocation;
    }
  }

  public updateQuantity(objectId: string, delta: number): number {
    const obj = this.getObject(objectId);
    if (obj) {
      obj.quantity = Math.max(0, obj.quantity + delta);
      return obj.quantity;
    }
    return 0;
  }

  public addObject(obj: WorldObjectState) {
    this.objects.set(obj.id, obj);
  }

  public removeObject(id: string) {
    this.objects.delete(id);
  }
}

export const worldObjectRegistry = WorldObjectRegistry.getInstance();
