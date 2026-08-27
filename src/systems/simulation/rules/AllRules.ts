import { WorldState, WorldEvent, TimePeriod } from '../../../types/world';
import { IEnvironmentRule, RuleEvaluationResult } from './EnvironmentRule';

// Helper to create uniquely ID'd timestamped events
function createEvent(type: string, description: string, payload?: Record<string, any>): WorldEvent {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return {
    id: `EVT-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    timestamp,
    description,
    payload,
  };
}

// 1. TIME-001: Clock Progression & Period Transition
export class TimeRule implements IEnvironmentRule {
  id = 'TIME-001';
  category = 'TIME' as const;
  name = 'Continuous Clock Progression';
  description = 'Advances simulation clock and determines time period (DAWN, MORNING, DAY, SUNSET, NIGHT)';
  priority = 1;
  isProbabilistic = false;

  private prevPeriod: TimePeriod | null = null;

  evaluate(state: WorldState): RuleEvaluationResult {
    const events: WorldEvent[] = [];
    const h = state.time.hour;
    const m = state.time.minute;
    const hourFloat = h + m / 60;

    let period: TimePeriod = 'DAY';
    if (hourFloat >= 5.5 && hourFloat < 6.0) period = 'DAWN';
    else if (hourFloat >= 6.0 && hourFloat < 8.0) period = 'MORNING';
    else if (hourFloat >= 8.0 && hourFloat < 16.0) period = 'DAY';
    else if (hourFloat >= 16.0 && hourFloat < 18.0) period = 'AFTERNOON';
    else if (hourFloat >= 18.0 && hourFloat < 19.5) period = 'SUNSET';
    else if (hourFloat >= 19.5 && hourFloat < 20.0) period = 'TWILIGHT';
    else period = 'NIGHT';

    state.environment.period = period;

    if (this.prevPeriod !== null && this.prevPeriod !== period) {
      events.push(createEvent('TIME_PERIOD_CHANGED', `Time period transitioned to ${period}`, { period }));
    }
    this.prevPeriod = period;

    return { ruleId: this.id, triggered: events.length > 0, emittedEvents: events };
  }
}

// 2. SUN-001: Sunlight Intensity
export class SunlightRule implements IEnvironmentRule {
  id = 'SUN-001';
  category = 'SUNLIGHT' as const;
  name = 'Diurnal Solar Irradiance';
  description = 'Calculates solar irradiance based on hour of day and cloud coverage';
  priority = 2;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    const hourFloat = state.time.hour + state.time.minute / 60;
    const cloudCov = state.weather.cloudCoverage || 0.1;

    const baseSun = Math.max(0, Math.sin(((hourFloat - 6) / 12) * Math.PI) * 1.4);
    const actualSun = baseSun * (1.0 - 0.75 * cloudCov);

    state.environment.sunlight = Math.round(actualSun * 100) / 100;
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 3. WEATH-001: Weather Sync
export class WeatherRule implements IEnvironmentRule {
  id = 'WEATH-001';
  category = 'RAIN' as const;
  name = 'Weather State Synchronization';
  description = 'Synchronizes weather type, cloud coverage, and intensity values';
  priority = 3;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    const type = state.weather.type;
    let cloud = 0.15;
    if (type === 'CLOUDY') cloud = 0.6;
    else if (type === 'RAIN') cloud = 0.85;
    else if (type === 'STORM') cloud = 1.0;

    state.weather.cloudCoverage = cloud;
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 4. RAIN-001: Precipitation Accumulation & Rate
export class RainRule implements IEnvironmentRule {
  id = 'RAIN-001';
  category = 'RAIN' as const;
  name = 'Precipitation Intensity & Cumulative Accumulation';
  description = 'Calculates rain volume per minute and 24h cumulative rainfall';
  priority = 4;
  isProbabilistic = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    const { type, intensity } = state.weather;

    let rainRate = 0; // mm / simMin
    if (type === 'RAIN') {
      rainRate = intensity < 0.4 ? 0.1 : intensity < 0.7 ? 0.4 : 1.0;
    } else if (type === 'STORM') {
      rainRate = 2.5;
    }

    state.weather.rainRate = rainRate;
    const addedRain = rainRate * simDeltaMinutes;
    state.weather.cumulativeRainfall24h = Math.max(0, state.weather.cumulativeRainfall24h + addedRain);

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 5. TEMP-001: Ambient Temperature Thermal Balance
export class TemperatureRule implements IEnvironmentRule {
  id = 'TEMP-001';
  category = 'TEMPERATURE' as const;
  name = 'Diurnal Thermal Equilibrium';
  description = 'Calculates air temperature based on time, season, sunlight, rain, and wind';
  priority = 5;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    if (state.weather.isLiveAPI) {
      return { ruleId: this.id, triggered: false, emittedEvents: [] };
    }

    const hourFloat = state.time.hour + state.time.minute / 60;
    const seasonBase = state.season === 'SUMMER' ? 30 : state.season === 'MONSOON' ? 26 : state.season === 'SPRING' ? 25 : 20;

    const baseT = seasonBase + 5.0 * Math.sin(((hourFloat - 9) / 24) * Math.PI * 2);
    const actualT = baseT + 1.5 * state.environment.sunlight - 6.0 * (state.weather.rainRate > 0 ? 0.7 : 0) - 0.1 * state.weather.windSpeed;

    const temp = Math.round(actualT * 10) / 10;
    state.weather.temperature = temp;
    state.soil.temperature = Math.round((temp - 2) * 10) / 10;

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 6. HUM-001: Relative Humidity Dynamics
export class HumidityRule implements IEnvironmentRule {
  id = 'HUM-001';
  category = 'HUMIDITY' as const;
  name = 'Relative Atmospheric Humidity';
  description = 'Calculates relative humidity from temperature and precipitation';
  priority = 6;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    if (state.weather.isLiveAPI) return { ruleId: this.id, triggered: false, emittedEvents: [] };

    const rainFactor = state.weather.rainRate > 0 ? 0.8 : 0.1;
    const hum = Math.min(100, Math.max(20, 65.0 + 35.0 * rainFactor - 0.8 * (state.weather.temperature - 25)));
    state.weather.humidity = Math.round(hum);
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 7. WIND-001: Wind Velocity
export class WindRule implements IEnvironmentRule {
  id = 'WIND-001';
  category = 'WIND' as const;
  name = 'Wind Speed Modulator';
  description = 'Sets wind speed based on weather conditions';
  priority = 7;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    if (state.weather.isLiveAPI) return { ruleId: this.id, triggered: false, emittedEvents: [] };

    const type = state.weather.type;
    let speed = 8;
    if (type === 'CLOUDY') speed = 16;
    else if (type === 'RAIN') speed = 30;
    else if (type === 'STORM') speed = 65;

    state.weather.windSpeed = speed;
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 8. EVAP-001: Surface Evaporation
export class EvaporationRule implements IEnvironmentRule {
  id = 'EVAP-001';
  category = 'EVAPORATION' as const;
  name = 'Penman-Monteith Surface Evaporation';
  description = 'Calculates water evaporation rate from soil, crops, and open water';
  priority = 8;
  isProbabilistic = false;

  evaluate(state: WorldState): RuleEvaluationResult {
    const { temperature, humidity, windSpeed } = state.weather;
    const { sunlight } = state.environment;

    if (state.weather.rainRate > 0.2) {
      state.environment.evaporationRate = 0;
      return { ruleId: this.id, triggered: false, emittedEvents: [] };
    }

    const evap = ((0.05 * temperature) + (0.08 * sunlight) + (0.01 * windSpeed)) / (1.0 + 0.015 * humidity);
    state.environment.evaporationRate = Math.round(evap * 1000) / 1000;

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 9. WAT-001: Water Mass Balance
export class WaterCycleRule implements IEnvironmentRule {
  id = 'WAT-001';
  category = 'WATER' as const;
  name = 'Hydrological Mass Conservation';
  description = 'Maintains closed-loop water balance between rain, soil, river, and evaporation';
  priority = 9;
  isProbabilistic = false;

  evaluate(): RuleEvaluationResult {
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 10. RIVER-001: River Level & Availability
export class RiverRule implements IEnvironmentRule {
  id = 'RIVER-001';
  category = 'RIVER' as const;
  name = 'River Basin Discharge & Availability';
  description = 'Calculates river level and water collection availability';
  priority = 10;
  isProbabilistic = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    const rainInflow = state.weather.rainRate * 0.8;
    const evapLoss = state.environment.evaporationRate * 0.05;
    const baseOutflow = 0.01;

    const deltaLevel = (rainInflow - evapLoss - baseOutflow) * simDeltaMinutes;
    state.hydro.riverWaterLevel = Math.max(0, Math.min(100, state.hydro.riverWaterLevel + deltaLevel));
    state.hydro.riverWaterAvailable = state.hydro.riverWaterLevel >= 10;

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 11. SOIL-001: Soil Moisture & Saturation
export class SoilRule implements IEnvironmentRule {
  id = 'SOIL-001';
  category = 'SOIL' as const;
  name = 'Soil Moisture Infiltration & Saturation';
  description = 'Calculates soil water absorption, saturation, and desiccation';
  priority = 11;
  isProbabilistic = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    const rainInfiltration = state.weather.rainRate * 1.5;
    const evapLoss = state.environment.evaporationRate * 0.4;
    const drainage = 0.02;

    const deltaMoisture = (rainInfiltration - evapLoss - drainage) * simDeltaMinutes;
    state.soil.moisture = Math.max(0, Math.min(100, state.soil.moisture + deltaMoisture));
    state.soil.saturation = Math.max(0, Math.min(100, state.soil.moisture * 1.05));

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 12. CROP-001: Crop Growth, Hydration & Health
export class CropRule implements IEnvironmentRule {
  id = 'CROP-001';
  category = 'CROP' as const;
  name = 'Crop Hydration, Growth & Health Lifecycle';
  description = 'Calculates crop hydration decay, growth rates, and health degradation';
  priority = 12;
  isProbabilistic = false;

  private prevMature = false;
  private prevDead = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    const events: WorldEvent[] = [];
    const crop = state.crops;

    if (crop.health <= 0) {
      crop.health = 0;
      return { ruleId: this.id, triggered: false, emittedEvents: [] };
    }

    // Hydration transfers from soil or rain
    const soilMoisture = state.soil.moisture;
    const evapLoss = state.environment.evaporationRate * 0.3 * simDeltaMinutes;

    if (soilMoisture > 30) {
      crop.waterLevel = Math.min(100, crop.waterLevel + 0.1 * simDeltaMinutes);
    } else {
      crop.waterLevel = Math.max(0, crop.waterLevel - evapLoss - 0.05 * simDeltaMinutes);
    }

    // Growth progression
    if (crop.waterLevel >= 30 && crop.waterLevel <= 90 && state.weather.temperature >= 18 && state.weather.temperature <= 38) {
      if (crop.growth < 100) {
        crop.growth = Math.min(100, crop.growth + 0.08 * (crop.waterLevel / 100) * simDeltaMinutes);
      }
    }

    crop.isMature = crop.growth >= 100;

    // Health dynamics
    const isStressed = crop.waterLevel < 15;
    const isWaterlogged = crop.waterLevel > 95;

    if (isStressed) {
      crop.health = Math.max(0, crop.health - 0.2 * simDeltaMinutes);
    } else if (isWaterlogged) {
      crop.health = Math.max(0, crop.health - 0.15 * simDeltaMinutes);
    } else if (crop.waterLevel >= 40 && crop.waterLevel <= 80 && crop.health < 100) {
      crop.health = Math.min(100, crop.health + 0.05 * simDeltaMinutes);
    }

    const isDead = crop.health <= 0;

    if (crop.isMature && !this.prevMature) {
      events.push(createEvent('CROP_MATURE', 'Wheat crop reached 100% maturity and is ready for harvest!'));
    }
    if (isDead && !this.prevDead) {
      events.push(createEvent('CROP_DIED', 'Wheat crop has perished due to environmental stress!'));
    }

    this.prevMature = crop.isMature;
    this.prevDead = isDead;

    return { ruleId: this.id, triggered: events.length > 0, emittedEvents: events };
  }
}

// 13. PLANT-001: Wild Vegetation & Weed Density
export class PlantRule implements IEnvironmentRule {
  id = 'PLANT-001';
  category = 'PLANT' as const;
  name = 'Wild Vegetation & Weed Density';
  description = 'Simulates weed density competition with crops based on soil moisture';
  priority = 13;
  isProbabilistic = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    if (state.soil.moisture > 30) {
      state.soil.weedDensity = Math.min(100, state.soil.weedDensity + 0.02 * simDeltaMinutes);
    }
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 14. FLOOD-001: River Basin Inundation & Overflow
export class FloodRule implements IEnvironmentRule {
  id = 'FLOOD-001';
  category = 'FLOOD' as const;
  name = 'Basin Inundation & Overflow Dynamics';
  description = 'Calculates flood inundation levels when river overflows';
  priority = 14;
  isProbabilistic = false;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    const riverLevel = state.hydro.riverWaterLevel;
    const rain24h = state.weather.cumulativeRainfall24h;

    if (riverLevel > 90 || rain24h > 120) {
      state.hazards.floodLevel = Math.min(5.0, state.hazards.floodLevel + 0.002 * simDeltaMinutes);
    } else {
      state.hazards.floodLevel = Math.max(0, state.hazards.floodLevel - 0.001 * simDeltaMinutes);
    }

    state.hazards.floodRisk = Math.round(Math.min(100, (state.hazards.floodLevel / 2.0) * 100));

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 15. DROUGHT-001: Drought Escalation Stages
export class DroughtRule implements IEnvironmentRule {
  id = 'DROUGHT-001';
  category = 'DROUGHT' as const;
  name = 'Drought Stage Escalation';
  description = 'Escalates drought severity stages during prolonged dry spells';
  priority = 15;
  isProbabilistic = false;

  private dryMinutesCounter = 0;

  evaluate(state: WorldState, simDeltaMinutes: number): RuleEvaluationResult {
    if (state.weather.rainRate === 0 && state.soil.moisture < 20) {
      this.dryMinutesCounter += simDeltaMinutes;
    } else if (state.weather.rainRate > 0.3) {
      this.dryMinutesCounter = Math.max(0, this.dryMinutesCounter - simDeltaMinutes * 3);
    }

    let stage = 0;
    if (this.dryMinutesCounter >= 7200) stage = 4; // 5 dry sim days
    else if (this.dryMinutesCounter >= 4320) stage = 3; // 3 dry sim days
    else if (this.dryMinutesCounter >= 2880) stage = 2; // 2 dry sim days
    else if (this.dryMinutesCounter >= 1440) stage = 1; // 1 dry sim day

    state.hazards.droughtStage = stage;
    state.hazards.droughtLevel = Math.min(100, Math.round((stage / 4) * 100));

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 16. FIRE-001: Wildfire Flammability Index
export class FireRule implements IEnvironmentRule {
  id = 'FIRE-001';
  category = 'FIRE' as const;
  name = 'Vegetation Flammability Index';
  description = 'Calculates flammability risk from heat, low humidity, and wind';
  priority = 16;
  isProbabilistic = true;

  evaluate(state: WorldState): RuleEvaluationResult {
    const { temperature, humidity, windSpeed } = state.weather;
    const soilMoisture = state.soil.moisture;

    let risk = 0;
    if (temperature > 30 && humidity < 40 && soilMoisture < 20) {
      risk = Math.min(100, (temperature - 30) * 5.0 + (50 - humidity) * 1.5 + windSpeed * 0.8);
    }
    state.hazards.fireRisk = Math.round(risk);

    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 17. CIT-001: Citizen Physiological Environmental Effects
export class CitizenEffectsRule implements IEnvironmentRule {
  id = 'CIT-001';
  category = 'CITIZEN' as const;
  name = 'Environmental Metabolism & Needs Modulator';
  description = 'Modifies citizen hunger and energy decay rates based on temperature and rain';
  priority = 17;
  isProbabilistic = false;

  evaluate(): RuleEvaluationResult {
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}

// 18. NAV-001: Navigation Mud & Flood Speed Penalties
export class NavigationEffectsRule implements IEnvironmentRule {
  id = 'NAV-001';
  category = 'NAVIGATION' as const;
  name = 'Environment Path & Speed Modulation';
  description = 'Calculates terrain speed multipliers and path blockages';
  priority = 18;
  isProbabilistic = false;

  evaluate(): RuleEvaluationResult {
    return { ruleId: this.id, triggered: false, emittedEvents: [] };
  }
}
