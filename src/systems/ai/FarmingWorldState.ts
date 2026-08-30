import { BenNeeds, WheatCropState, EatActionResult } from '../../types/benAI';
import { CitizenId } from '../../types/citizen';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { economySystem } from './EconomySystem';

export type WorldStateChangeListener = () => void;

class FarmingWorldState {
  private citizensNeeds: Record<CitizenId, BenNeeds> = {
    ben: {
      energy: 90,
      hunger: 20,
      foodStock: 3,
      waterBucket: 0,
      harvestedWheat: 0,
    },
    julie: {
      energy: 90,
      hunger: 20,
      foodStock: 3,
      waterBucket: 0,
      harvestedWheat: 0,
    },
    ravi: {
      energy: 90,
      hunger: 20,
      foodStock: 10,
      waterBucket: 0,
      harvestedWheat: 0,
    },
  };

  private listeners: Set<WorldStateChangeListener> = new Set();

  constructor() {
    worldSimulationEngine.subscribe(() => this.notify());
  }

  public subscribe(listener: WorldStateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // Single Authoritative Delegation to WorldSimulationEngine
  public get wheatCrop(): WheatCropState {
    return worldSimulationEngine.getState().crops;
  }

  public get river() {
    return {
      waterAvailable: worldSimulationEngine.getState().hydro.riverWaterAvailable,
      waterLevel: worldSimulationEngine.getState().hydro.riverWaterLevel,
    };
  }

  public getNeeds(citizenId: CitizenId = 'ben'): BenNeeds {
    if (!this.citizensNeeds[citizenId]) {
      this.citizensNeeds[citizenId] = {
        energy: 90,
        hunger: 20,
        foodStock: 3,
        waterBucket: 0,
        harvestedWheat: 0,
      };
    }
    return this.citizensNeeds[citizenId];
  }

  public get needs(): BenNeeds {
    return this.getNeeds('ben');
  }

  // Pure reality state mutations integrating with WorldSimulationEngine
  public updateCropWaterLevel(delta: number) {
    const crop = worldSimulationEngine.getState().crops;
    crop.waterLevel = Math.max(0, Math.min(100, crop.waterLevel + delta));
    if (crop.waterLevel > 60 && crop.growth < 100) {
      crop.growth = Math.min(100, crop.growth + 0.1);
    }
    crop.isMature = crop.growth >= 100;
    this.notify();
  }

  public collectWaterFromRiver(citizenId: CitizenId = 'ben'): boolean {
    if (!this.river.waterAvailable) return false;
    const needs = this.getNeeds(citizenId);
    needs.waterBucket = Math.min(5, needs.waterBucket + 3);
    needs.energy = Math.max(0, needs.energy - 5);
    this.notify();
    return true;
  }

  public waterWheatCrop(citizenId: CitizenId = 'ben'): boolean {
    const needs = this.getNeeds(citizenId);
    if (needs.waterBucket <= 0) return false;

    needs.waterBucket = Math.max(0, needs.waterBucket - 1);
    const crop = worldSimulationEngine.getState().crops;
    crop.waterLevel = Math.min(100, crop.waterLevel + 40);
    crop.growth = Math.min(100, crop.growth + 15);
    crop.isMature = crop.growth >= 100;
    needs.energy = Math.max(0, needs.energy - 8);

    // Irrigation boosts soil moisture
    worldSimulationEngine.getState().soil.moisture = Math.min(100, worldSimulationEngine.getState().soil.moisture + 20);

    this.notify();
    return true;
  }

  public harvestWheatCrop(citizenId: CitizenId = 'ben'): boolean {
    const crop = worldSimulationEngine.getState().crops;
    if (!crop.isMature) return false;

    crop.growth = 0;
    crop.waterLevel = 10;
    crop.isMature = false;

    const needs = this.getNeeds(citizenId);
    needs.harvestedWheat += 3;
    needs.foodStock += 3;
    needs.energy = Math.max(0, needs.energy - 12);

    economySystem.awardCredits(citizenId, 10, 'Harvested mature wheat crops');

    this.notify();
    return true;
  }

  public eatFood(citizenId: CitizenId = 'ben'): EatActionResult {
    const needs = this.getNeeds(citizenId);
    const hungerBefore = needs.hunger;
    const foodStockBefore = needs.foodStock;
    const energyBefore = needs.energy;

    if (needs.hunger < 30) {
      return {
        success: false,
        reason: 'Hunger too low (< 30)',
        hungerBefore,
        hungerAfter: hungerBefore,
        foodStockBefore,
        foodStockAfter: foodStockBefore,
        energyBefore,
        energyAfter: energyBefore,
      };
    }

    if (needs.foodStock <= 0) {
      return {
        success: false,
        reason: 'No food available (foodStock <= 0)',
        hungerBefore,
        hungerAfter: hungerBefore,
        foodStockBefore,
        foodStockAfter: foodStockBefore,
        energyBefore,
        energyAfter: energyBefore,
      };
    }

    needs.foodStock -= 1;
    needs.hunger = Math.max(0, needs.hunger - 40);
    needs.energy = Math.min(100, needs.energy + 25);

    const result: EatActionResult = {
      success: true,
      reason: 'Food consumed successfully',
      hungerBefore,
      hungerAfter: needs.hunger,
      foodStockBefore,
      foodStockAfter: needs.foodStock,
      energyBefore,
      energyAfter: needs.energy,
    };

    this.notify();
    return result;
  }

  public restAtHome(citizenId: CitizenId = 'ben') {
    const needs = this.getNeeds(citizenId);
    needs.energy = Math.min(100, needs.energy + 35);
    needs.hunger = Math.min(100, needs.hunger + 5);
    this.notify();
  }

  public tickNeeds(citizenId: CitizenId, simDeltaMinutes: number) {
    if (simDeltaMinutes <= 0) return;

    const needs = this.getNeeds(citizenId);
    const temp = worldSimulationEngine.getState().weather.temperature;

    // Environmental metabolism formula CIT-001
    const heatFactor = 1.0 + Math.max(0, (temp - 32) / 20);
    needs.hunger = Math.min(100, needs.hunger + simDeltaMinutes * 0.1 * heatFactor);
    needs.energy = Math.max(0, needs.energy - simDeltaMinutes * 0.03);

    this.notify();
  }
}

export const farmingWorldState = new FarmingWorldState();
