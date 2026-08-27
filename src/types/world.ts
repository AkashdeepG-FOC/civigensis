import { SemanticLocation } from './locations';
import { WheatCropState } from './benAI';

export type WeatherType = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'STORM';
export type SeasonType = 'SPRING' | 'SUMMER' | 'MONSOON' | 'WINTER';
export type TimePeriod = 'DAWN' | 'MORNING' | 'NOON' | 'AFTERNOON' | 'SUNSET' | 'TWILIGHT' | 'NIGHT' | 'DAY';

export const WORLD_LOCATION = {
  name: 'Chennai',
  latitude: 13.0827,
  longitude: 80.2707,
  timezone: 'Asia/Kolkata',
} as const;

export interface WorldTime {
  hour: number;        // 0 - 23 (Chennai Asia/Kolkata time)
  minute: number;      // 0 - 59
  second: number;      // 0 - 59
  day: number;         // 1, 2, 3...
  dateString: string;  // Formatted date string
}

export interface WeatherState {
  type: WeatherType;
  intensity: number;     // 0.0 (none) to 1.0 (extreme)
  temperature: number;   // °C
  humidity: number;      // %
  windSpeed: number;     // km/h
  cloudCoverage: number; // 0.0 to 1.0
  isLiveAPI?: boolean;   // true if fetched from Chennai weather API
  cumulativeRainfall24h: number; // mm in last 24h
  rainRate: number;      // mm / sim minute
}

export interface SoilState {
  moisture: number;      // 0 - 100%
  saturation: number;    // 0 - 100%
  fertility: number;     // 0 - 100%
  temperature: number;   // °C
  weedDensity: number;   // 0 - 100%
}

export interface HydrologicalState {
  riverWaterLevel: number;   // 0 - 100%
  riverFlowRate: number;     // m³/s
  riverWaterAvailable: boolean;
  groundwaterTable: number;  // meters
}

export interface HazardState {
  floodLevel: number;        // meters inundation
  floodRisk: number;         // 0 - 100%
  droughtLevel: number;      // 0 - 100%
  droughtStage: number;      // 0 - 4
  fireRisk: number;          // 0 - 100%
  activeFireCount: number;
}

export interface ResourceState {
  foodStock: number;
  waterBucketMax: number;
  harvestedWheat: number;
  timberStock: number;
}

export interface EnvironmentState {
  sunlight: number;       // 0.0 (night) to 1.4 (bright noon)
  ambientLight: number;   // 0.18 (dark night) to 0.75 (bright day)
  moonLight: number;      // 0.0 (day) to 0.35 (clear night)
  visibility: number;     // 0.0 to 1.0
  fogDensity: number;     // for distance fog
  fogDistance: { near: number; far: number };
  fogColor: string;
  skyColor: string;
  sunColor: string;
  sunPosition: [number, number, number];
  moonPosition: [number, number, number];
  period: TimePeriod;
  evaporationRate: number; // % / sim minute
}

export interface WorldEvent {
  id: string;
  type: string;
  timestamp: string;
  description: string;
  payload?: Record<string, any>;
}

export interface WorldState {
  location: typeof WORLD_LOCATION;
  time: WorldTime;
  timeScale: number;  // 1 = Real time (1s = 1s), 0 = Paused, 2, 5, 10 for debug
  isPaused: boolean;
  useRealTimeClock: boolean;
  weather: WeatherState;
  environment: EnvironmentState;
  season: SeasonType;
  soil: SoilState;
  hydro: HydrologicalState;
  hazards: HazardState;
  crops: WheatCropState;
  resources: ResourceState;
  events: {
    active: boolean;
    current: WorldEvent | null;
    history: WorldEvent[];
  };
  semanticLocations: SemanticLocation[];
}

export interface AIPerceptionSummary {
  location: string;
  time: string;
  period: TimePeriod;
  day: number;
  weather: {
    type: WeatherType;
    intensity: number;
    temperature: number;
    windSpeed: number;
    humidity: number;
    visibility: number;
  };
  soil: {
    moisture: number;
    saturation: number;
    weedDensity: number;
  };
  hydro: {
    riverWaterLevel: number;
    riverWaterAvailable: boolean;
  };
  crop: {
    growth: number;
    waterLevel: number;
    health: number;
    isMature: boolean;
  };
  hazards: {
    floodLevel: number;
    droughtStage: number;
    fireRisk: number;
  };
  season: SeasonType;
  semanticLocations: SemanticLocation[];
  description: string;
}
