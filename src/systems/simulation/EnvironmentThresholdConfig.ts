import { WorldState } from '../../types/world';

export type ThresholdDirection = 'RISING' | 'FALLING';

export interface ThresholdDefinition {
  id: string;
  name: string;
  category: string;
  getValue: (state: WorldState) => number;
  startThreshold: number;   // Value to trigger activation (e.g. 0.5 mm/min for rain)
  stopThreshold?: number;   // Recovery threshold for hysteresis (e.g. 0.2 mm/min for rain stop)
  direction: ThresholdDirection;
  startEvent: string;       // Event type emitted ONCE on state activation
  stopEvent?: string;       // Event type emitted ONCE on state recovery
  description: string;
}

export const ENVIRONMENT_THRESHOLDS_CONFIG: ThresholdDefinition[] = [
  {
    id: 'TH-RAIN',
    name: 'Heavy Precipitation',
    category: 'RAIN',
    getValue: (state) => state.weather.rainRate,
    startThreshold: 0.5, // 0.5 mm/min triggers RAIN_STARTED / meaningful rain
    stopThreshold: 0.2,  // Hysteresis: drops below 0.2 mm/min to trigger RAIN_STOPPED
    direction: 'RISING',
    startEvent: 'RAIN_STARTED',
    stopEvent: 'RAIN_STOPPED',
    description: 'Meaningful rainfall threshold for crop irrigation and flood accumulation',
  },
  {
    id: 'TH-CROP-HYD',
    name: 'Crop Hydration Low',
    category: 'CROP',
    getValue: (state) => state.crops.waterLevel,
    startThreshold: 30,  // Hydration <= 30% triggers CROP_HYDRATION_LOW
    stopThreshold: 70,   // Hysteresis: hydration > 70% triggers recovery
    direction: 'FALLING',
    startEvent: 'CROP_HYDRATION_LOW',
    stopEvent: 'CROP_HYDRATION_RECOVERED',
    description: 'Wheat crop dehydration threshold requiring watering',
  },
  {
    id: 'TH-RIVER',
    name: 'River Water Availability',
    category: 'RIVER',
    getValue: (state) => state.hydro.riverWaterLevel,
    startThreshold: 10,  // Level <= 10% triggers RIVER_WATER_UNAVAILABLE
    stopThreshold: 15,   // Hysteresis: level > 15% restores availability
    direction: 'FALLING',
    startEvent: 'RIVER_WATER_UNAVAILABLE',
    stopEvent: 'RIVER_WATER_RESTORED',
    description: 'River bucket collection threshold',
  },
  {
    id: 'TH-SOIL-DES',
    name: 'Soil Desiccation',
    category: 'SOIL',
    getValue: (state) => state.soil.moisture,
    startThreshold: 25,  // Moisture <= 25% triggers SOIL_DESICCATED
    stopThreshold: 40,   // Hysteresis: moisture > 40% normalizes
    direction: 'FALLING',
    startEvent: 'SOIL_DESICCATED',
    stopEvent: 'SOIL_MOISTURE_NORMALIZED',
    description: 'Soil drought moisture threshold',
  },
  {
    id: 'TH-SOIL-SAT',
    name: 'Soil Waterlogged',
    category: 'SOIL',
    getValue: (state) => state.soil.moisture,
    startThreshold: 90,  // Moisture >= 90% triggers SOIL_WATERLOGGED
    stopThreshold: 75,   // Hysteresis: moisture < 75% recedes
    direction: 'RISING',
    startEvent: 'SOIL_WATERLOGGED',
    stopEvent: 'SOIL_WATERLOGGING_RECEDED',
    description: 'Soil saturation and crop waterlogging hazard threshold',
  },
  {
    id: 'TH-HEAT',
    name: 'Extreme Heat',
    category: 'TEMPERATURE',
    getValue: (state) => state.weather.temperature,
    startThreshold: 40,  // Temp >= 40°C triggers EXTREME_HEAT_STARTED
    stopThreshold: 35,   // Hysteresis: temp < 35°C ends extreme heat
    direction: 'RISING',
    startEvent: 'EXTREME_HEAT_STARTED',
    stopEvent: 'EXTREME_HEAT_ENDED',
    description: 'Ambient heat stress and high evaporation threshold',
  },
  {
    id: 'TH-FLOOD',
    name: 'Flood Inundation',
    category: 'FLOOD',
    getValue: (state) => state.hazards.floodLevel,
    startThreshold: 0.8, // Flood level >= 0.8m triggers ROAD_BLOCKED_BY_FLOOD
    stopThreshold: 0.4,  // Hysteresis: flood level < 0.4m clears blockage
    direction: 'RISING',
    startEvent: 'ROAD_BLOCKED_BY_FLOOD',
    stopEvent: 'FLOOD_RECEDED',
    description: 'River inundation and navigation road blockage threshold',
  },
  {
    id: 'TH-FIRE',
    name: 'Wildfire Flammability',
    category: 'FIRE',
    getValue: (state) => state.hazards.fireRisk,
    startThreshold: 90,  // Fire risk >= 90% triggers FIRE_RISK_HIGH
    stopThreshold: 70,   // Hysteresis: risk < 70% clears warning
    direction: 'RISING',
    startEvent: 'FIRE_RISK_HIGH',
    stopEvent: 'FIRE_RISK_NORMALIZED',
    description: 'Vegetation flammability ignition threshold',
  },
];
