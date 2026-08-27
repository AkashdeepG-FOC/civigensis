import * as THREE from 'three';
import {
  WorldState,
  WeatherType,
  SeasonType,
  TimePeriod,
  AIPerceptionSummary,
  WorldEvent,
  WORLD_LOCATION,
} from '../../types/world';

import { SEMANTIC_LOCATIONS } from '../../types/locations';
import { environmentSimulationSystem } from './EnvironmentSimulationSystem';
import { worldEventBus } from './WorldEventBus';

export type WorldStateListener = (state: WorldState) => void;
export type WorldEventListener = (event: WorldEvent) => void;

class WorldSimulationEngine {
  // Authoritative internal simulation time in minutes (0 to 1439 per day)
  public simulationMinutes: number = 360;

  private state: WorldState = {
    location: WORLD_LOCATION,
    time: { hour: 6, minute: 0, second: 0, day: 1, dateString: '' },
    timeScale: 1, // Default: Real time (1s = 1s)
    isPaused: false,
    useRealTimeClock: true,
    weather: {
      type: 'CLEAR',
      intensity: 0.1,
      temperature: 28.5,
      humidity: 65,
      windSpeed: 12,
      cloudCoverage: 0.15,
      isLiveAPI: false,
      cumulativeRainfall24h: 0,
      rainRate: 0,
    },
    environment: {
      sunlight: 1.2,
      ambientLight: 0.7,
      moonLight: 0.0,
      visibility: 1.0,
      fogDensity: 0.001,
      fogDistance: { near: 180, far: 850 },
      fogColor: '#aacde1',
      skyColor: '#aacde1',
      sunColor: '#fff5e6',
      sunPosition: [80, 120, 70],
      moonPosition: [-80, -120, -70],
      period: 'MORNING',
      evaporationRate: 0.03,
    },
    season: 'SUMMER',
    soil: {
      moisture: 45,
      saturation: 47,
      fertility: 80,
      temperature: 26.5,
      weedDensity: 10,
    },
    hydro: {
      riverWaterLevel: 85,
      riverFlowRate: 2.5,
      riverWaterAvailable: true,
      groundwaterTable: 12.0,
    },
    hazards: {
      floodLevel: 0,
      floodRisk: 5,
      droughtLevel: 0,
      droughtStage: 0,
      fireRisk: 10,
      activeFireCount: 0,
    },
    crops: {
      growth: 25,
      waterLevel: 50,
      health: 85,
      isMature: false,
    },
    resources: {
      foodStock: 3,
      waterBucketMax: 5,
      harvestedWheat: 0,
      timberStock: 10,
    },
    events: {
      active: false,
      current: null,
      history: [],
    },
    semanticLocations: SEMANTIC_LOCATIONS,
  };

  private listeners: Set<WorldStateListener> = new Set();
  private eventListeners: Set<WorldEventListener> = new Set();
  private lastWeatherFetchTime: number = 0;

  constructor() {
    this.syncRealTimeChennaiClock();
    this.fetchLiveChennaiWeather();
    this.updateEnvironmentAndWeather();
  }

  public subscribe(listener: WorldStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeEvent(listener: WorldEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public getState(): WorldState {
    return this.state;
  }

  public setTimeScale(scale: number, isRealTime?: boolean) {
    const wasRealTime = this.state.useRealTimeClock;
    this.state.timeScale = scale;
    this.state.isPaused = scale === 0;
    this.state.useRealTimeClock = isRealTime !== undefined ? isRealTime : scale === 1;

    if (wasRealTime && !this.state.useRealTimeClock) {
      this.syncRealTimeChennaiClock();
    }
    this.notify();
  }

  public togglePause() {
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.state.timeScale = 1;
      this.state.useRealTimeClock = true;
    } else {
      this.state.isPaused = true;
      this.state.timeScale = 0;
      this.state.useRealTimeClock = false;
    }
    this.notify();
  }

  public setWeather(type: WeatherType, intensity: number = 0.5) {
    const prevType = this.state.weather.type;
    this.state.weather.type = type;
    this.state.weather.intensity = THREE.MathUtils.clamp(intensity, 0, 1);
    this.state.weather.isLiveAPI = false;
    this.updateEnvironmentAndWeather();

    if (prevType !== type) {
      this.emitEvent({
        id: `weather-${Date.now()}`,
        type: `WEATHER_${type}`,
        timestamp: this.getFormattedTime(true),
        description: `Weather updated to ${type} for Chennai reference`,
      });
    }
    this.notify();
  }

  /**
   * Syncs internal clock to real Chennai, Tamil Nadu, India time (Asia/Kolkata, UTC+5:30)
   */
  private syncRealTimeChennaiClock() {
    try {
      const now = new Date();

      // Format time in Asia/Kolkata (Chennai, India)
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: WORLD_LOCATION.timezone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });

      const parts = timeFormatter.formatToParts(now);
      let hour = 0, minute = 0, second = 0;
      parts.forEach((p) => {
        if (p.type === 'hour') hour = parseInt(p.value, 10) % 24;
        if (p.type === 'minute') minute = parseInt(p.value, 10);
        if (p.type === 'second') second = parseInt(p.value, 10);
      });

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: WORLD_LOCATION.timezone,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const dateString = dateFormatter.format(now);

      this.state.time.hour = hour;
      this.state.time.minute = minute;
      this.state.time.second = second;
      this.state.time.dateString = dateString;

      this.simulationMinutes = hour * 60 + minute + second / 60;
    } catch {
      // Fallback
      const now = new Date();
      this.state.time.hour = now.getHours();
      this.state.time.minute = now.getMinutes();
      this.state.time.second = now.getSeconds();
      this.simulationMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    }
  }

  /**
   * Fetches live weather for Chennai (Lat 13.0827, Long 80.2707) via Open-Meteo
   */
  private async fetchLiveChennaiWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${WORLD_LOCATION.latitude}&longitude=${WORLD_LOCATION.longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=Asia%2FKolkata`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      const current = data.current_weather;
      if (!current) return;

      const temp = current.temperature;
      const wind = current.windspeed;
      const code = current.weathercode;

      let type: WeatherType = 'CLEAR';
      let intensity = 0.1;

      if (code >= 1 && code <= 3) {
        type = 'CLOUDY';
        intensity = 0.5;
      } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        type = 'RAIN';
        intensity = 0.7;
      } else if (code >= 95) {
        type = 'STORM';
        intensity = 0.95;
      }

      this.state.weather = {
        ...this.state.weather,
        type,
        intensity,
        temperature: Math.round(temp * 10) / 10,
        humidity: 70,
        windSpeed: Math.round(wind),
        cloudCoverage: type === 'CLEAR' ? 0.15 : type === 'CLOUDY' ? 0.6 : 0.85,
        isLiveAPI: true,
      };

      this.lastWeatherFetchTime = Date.now();
      this.updateEnvironmentAndWeather();
      this.notify();
    } catch {
      // Keep offline/simulated weather gracefully
    }
  }

  public lastSimDeltaMinutes: number = 0;

  /**
   * Called every R3F frame to advance the clock smoothly
   */
  public update(delta: number) {
    if (this.state.isPaused) {
      this.lastSimDeltaMinutes = 0;
      return;
    }

    if (this.state.useRealTimeClock) {
      // 1 real second = 1 world second (0.0166 sim minutes) scaled by timeScale
      this.lastSimDeltaMinutes = (delta / 60) * this.state.timeScale;
      this.syncRealTimeChennaiClock();
    } else {
      // 1x = Normal 1 sec clock tick (1 sim sec = 1 real sec)
      // 2x, 5x, 10x = Accelerated fast simulation speed for fast day/night progression
      const deltaMinutes =
        this.state.timeScale === 1
          ? delta / 60
          : delta * 5 * this.state.timeScale;

      this.lastSimDeltaMinutes = deltaMinutes;
      this.simulationMinutes += deltaMinutes;

      while (this.simulationMinutes >= 1440) {
        this.simulationMinutes -= 1440;
        this.state.time.day += 1;
      }

      const currentHour = Math.floor(this.simulationMinutes / 60);
      const currentMinute = Math.floor(this.simulationMinutes % 60);
      const currentSecond = Math.floor((this.simulationMinutes * 60) % 60);

      this.state.time.hour = currentHour;
      this.state.time.minute = currentMinute;
      this.state.time.second = currentSecond;
    }

    // Refresh live weather for Chennai every 10 minutes
    if (Date.now() - this.lastWeatherFetchTime > 600000) {
      this.fetchLiveChennaiWeather();
    }

    // Authoritative Environmental Simulation Engine Execution
    environmentSimulationSystem.update(this.state, this.lastSimDeltaMinutes);

    this.updateEnvironmentAndWeather();
    this.notify();
  }

  private updateEnvironmentAndWeather() {
    const currentHourFloat = (this.simulationMinutes / 60) % 24;

    // 1. Calculate 3D Sun & Moon Coordinates (Chennai latitude 13.0827 N reference)
    // 06:00 East, 12:00 Overhead, 18:00 West, 24:00 Below horizon
    const sunAngle = ((currentHourFloat - 6) / 24) * Math.PI * 2;
    const sunDist = 250;
    const sunX = Math.cos(sunAngle) * sunDist;
    const sunY = Math.sin(sunAngle) * 220;
    const sunZ = Math.sin(sunAngle * 0.5) * 90;

    const sunPosition: [number, number, number] = [sunX, sunY, sunZ];
    const moonPosition: [number, number, number] = [-sunX, -sunY, -sunZ];

    // 2. Interpolate Natural Sky & Fog Colors (Strictly No Purple/Violet!)
    const cMorningSky = new THREE.Color(170 / 255, 205 / 255, 225 / 255); // 06:00 Soft Morning Blue
    const cDaySky = new THREE.Color(135 / 255, 195 / 255, 235 / 255);     // 08:00-16:00 Natural Day Blue
    const cEveningSky = new THREE.Color(190 / 255, 170 / 255, 150 / 255); // 16:00-18:00 Warm Muted Blue-Grey
    const cSunsetSky = new THREE.Color(220 / 255, 155 / 255, 120 / 255);  // 18:00-19:30 Warm Sunset
    const cTwilightSky = new THREE.Color(55 / 255, 75 / 255, 105 / 255);  // 19:30-20:00 Blue-Grey Twilight
    const cNightSky = new THREE.Color(12 / 255, 20 / 255, 35 / 255);      // 20:00-05:30 Dark Blue Night

    const cTwilightFog = new THREE.Color(120 / 255, 105 / 255, 110 / 255);
    const cNightFog = new THREE.Color(15 / 255, 23 / 255, 42 / 255);

    let sky = new THREE.Color();
    let fog = new THREE.Color();

    let period: TimePeriod = 'DAY';
    let sunlight = 1.35;
    let ambientLight = 0.7;
    let moonLight = 0.0;
    let sunColor = '#fff5e6';

    if (currentHourFloat >= 5.5 && currentHourFloat < 6.0) {
      // DAWN (05:30 - 06:00)
      period = 'DAWN';
      const t = (currentHourFloat - 5.5) / 0.5;
      sky.copy(cNightSky).lerp(cMorningSky, t);
      fog.copy(cNightFog).lerp(cMorningSky, t);
      sunlight = THREE.MathUtils.lerp(0.02, 0.4, t);
      ambientLight = THREE.MathUtils.lerp(0.18, 0.45, t);
      sunColor = '#fed7aa';
    } else if (currentHourFloat >= 6.0 && currentHourFloat < 8.0) {
      // MORNING (06:00 - 08:00)
      period = 'MORNING';
      const t = (currentHourFloat - 6.0) / 2.0;
      sky.copy(cMorningSky).lerp(cDaySky, t);
      fog.copy(cMorningSky).lerp(cDaySky, t);
      sunlight = THREE.MathUtils.lerp(0.4, 1.35, t);
      ambientLight = THREE.MathUtils.lerp(0.45, 0.7, t);
      sunColor = '#fff5e6';
    } else if (currentHourFloat >= 8.0 && currentHourFloat < 16.0) {
      // DAY (08:00 - 16:00)
      period = 'DAY';
      sky.copy(cDaySky);
      fog.copy(cDaySky);
      sunlight = 1.35;
      ambientLight = 0.72;
      sunColor = '#ffffff';
    } else if (currentHourFloat >= 16.0 && currentHourFloat < 18.0) {
      // EVENING (16:00 - 18:00)
      period = 'AFTERNOON';
      const t = (currentHourFloat - 16.0) / 2.0;
      sky.copy(cDaySky).lerp(cEveningSky, t);
      fog.copy(cDaySky).lerp(cEveningSky, t);
      sunlight = THREE.MathUtils.lerp(1.35, 0.9, t);
      ambientLight = THREE.MathUtils.lerp(0.72, 0.55, t);
      sunColor = '#fde047';
    } else if (currentHourFloat >= 18.0 && currentHourFloat < 19.5) {
      // SUNSET (18:00 - 19:30)
      period = 'SUNSET';
      const t = (currentHourFloat - 18.0) / 1.5;
      sky.copy(cEveningSky).lerp(cSunsetSky, t);
      fog.copy(cEveningSky).lerp(cSunsetSky, t);
      sunlight = THREE.MathUtils.lerp(0.9, 0.35, t);
      ambientLight = THREE.MathUtils.lerp(0.55, 0.38, t);
      sunColor = '#f97316';
    } else if (currentHourFloat >= 19.5 && currentHourFloat < 20.0) {
      // TWILIGHT (19:30 - 20:00) - Muted Blue-Grey (NO PURPLE)
      period = 'TWILIGHT';
      const t = (currentHourFloat - 19.5) / 0.5;
      sky.copy(cSunsetSky).lerp(cTwilightSky, t);
      fog.copy(cSunsetSky).lerp(cTwilightFog, t);
      sunlight = THREE.MathUtils.lerp(0.35, 0.08, t);
      ambientLight = THREE.MathUtils.lerp(0.38, 0.25, t);
      moonLight = THREE.MathUtils.lerp(0.02, 0.15, t);
      sunColor = '#ea580c';
    } else if (currentHourFloat >= 20.0 && currentHourFloat < 21.0) {
      // TWILIGHT -> NIGHT (20:00 - 21:00)
      period = 'NIGHT';
      const t = (currentHourFloat - 20.0) / 1.0;
      sky.copy(cTwilightSky).lerp(cNightSky, t);
      fog.copy(cTwilightFog).lerp(cNightFog, t);
      sunlight = THREE.MathUtils.lerp(0.08, 0.0, t);
      ambientLight = THREE.MathUtils.lerp(0.25, 0.18, t);
      moonLight = THREE.MathUtils.lerp(0.15, 0.35, t);
      sunColor = '#000000';
    } else {
      // NIGHT (21:00 - 05:30)
      period = 'NIGHT';
      sky.copy(cNightSky);
      fog.copy(cNightFog);
      sunlight = 0.0;
      ambientLight = 0.18;
      moonLight = 0.35;
      sunColor = '#000000';
    }

    // 3. Weather Sky & Fog Modulation (NO PURPLE EVER!)
    const { type, intensity } = this.state.weather;
    const diurnalTemp = 28 + 5 * Math.sin(((currentHourFloat - 9) / 24) * Math.PI * 2);
    let weatherCooling = 0;
    let cloudCoverage = 0.1;
    let windSpeed = 8;
    let fogNear = 180;
    let fogFar = 850;

    if (type === 'CLOUDY') {
      weatherCooling = 2.0;
      cloudCoverage = 0.6;
      windSpeed = 14 + intensity * 8;
      fogFar = 650;
      sky.lerp(new THREE.Color(140 / 255, 164 / 255, 184 / 255), 0.45);
      fog.lerp(new THREE.Color(140 / 255, 164 / 255, 184 / 255), 0.45);
    } else if (type === 'RAIN') {
      weatherCooling = 4.0 + intensity * 2;
      cloudCoverage = 0.85;
      windSpeed = 20 + intensity * 12;
      sunlight *= 0.4;
      ambientLight *= 0.65;
      fogFar = 380;
      fogNear = 60;
      sky.lerp(new THREE.Color(107 / 255, 130 / 255, 150 / 255), 0.65);
      fog.lerp(new THREE.Color(107 / 255, 130 / 255, 150 / 255), 0.65);
    } else if (type === 'STORM') {
      weatherCooling = 6.0 + intensity * 3;
      cloudCoverage = 1.0;
      windSpeed = 35 + intensity * 25;
      sunlight *= 0.15;
      ambientLight *= 0.45;
      fogFar = 180;
      fogNear = 30;
      sky.lerp(new THREE.Color(26 / 255, 36 / 255, 48 / 255), 0.85);
      fog.lerp(new THREE.Color(26 / 255, 36 / 255, 48 / 255), 0.85);
    }

    if (!this.state.weather.isLiveAPI) {
      const temperature = Math.round((diurnalTemp - weatherCooling) * 10) / 10;
      this.state.weather.temperature = temperature;
      this.state.weather.windSpeed = Math.round(windSpeed);
      this.state.weather.cloudCoverage = cloudCoverage;
    }

    const visibility = THREE.MathUtils.clamp(fogFar / 850, 0.2, 1.0);
    const hexSky = `#${sky.getHexString()}`;
    const hexFog = `#${fog.getHexString()}`;

    this.state.environment = {
      ...this.state.environment,
      sunlight,
      ambientLight,
      moonLight,
      visibility,
      fogDensity: 1 / fogFar,
      fogDistance: { near: fogNear, far: fogFar },
      fogColor: hexFog,
      skyColor: hexSky,
      sunColor,
      sunPosition,
      moonPosition,
      period,
    };
  }

  private emitEvent(event: WorldEvent) {
    this.state.events = {
      ...this.state.events,
      active: true,
      current: event,
    };
    this.eventListeners.forEach((l) => l(event));
    worldEventBus.emit(event.type, event.description, event.payload || {});
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getFormattedTime(includeSeconds: boolean = true): string {
    const h = String(this.state.time.hour).padStart(2, '0');
    const m = String(this.state.time.minute).padStart(2, '0');
    const s = String(this.state.time.second).padStart(2, '0');
    return includeSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  }

  public getTotalSimulationMinutes(): number {
    const { day, hour, minute, second } = this.state.time;
    return (day - 1) * 1440 + hour * 60 + minute + second / 60;
  }

  public getAIPerceptionSummary(): AIPerceptionSummary {
    const { time, weather, environment, season, semanticLocations, soil, hydro, crops, hazards } = this.state;
    return {
      location: 'Chennai (Asia/Kolkata)',
      time: this.getFormattedTime(true),
      period: environment.period,
      day: time.day,
      weather: {
        type: weather.type,
        intensity: weather.intensity,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        humidity: weather.humidity,
        visibility: environment.visibility,
      },
      soil: {
        moisture: Math.round(soil.moisture),
        saturation: Math.round(soil.saturation),
        weedDensity: Math.round(soil.weedDensity),
      },
      hydro: {
        riverWaterLevel: Math.round(hydro.riverWaterLevel),
        riverWaterAvailable: hydro.riverWaterAvailable,
      },
      crop: {
        growth: Math.round(crops.growth),
        waterLevel: Math.round(crops.waterLevel),
        health: Math.round(crops.health),
        isMature: crops.isMature,
      },
      hazards: {
        floodLevel: Math.round(hazards.floodLevel * 100) / 100,
        droughtStage: hazards.droughtStage,
        fireRisk: hazards.fireRisk,
      },
      season,
      semanticLocations,
      description: `Location: Chennai (13.0827°N, 80.2707°E, Asia/Kolkata). Time: ${this.getFormattedTime(true)} (${environment.period}). Weather: ${weather.type.toLowerCase()} (${weather.temperature}°C, wind ${weather.windSpeed} km/h, humidity ${weather.humidity}%). River level: ${Math.round(hydro.riverWaterLevel)}% (${hydro.riverWaterAvailable ? 'Available' : 'UNAVAILABLE'}). Soil moisture: ${Math.round(soil.moisture)}%. Crop water: ${Math.round(crops.waterLevel)}%, growth: ${Math.round(crops.growth)}% (Health: ${Math.round(crops.health)}%). Hazards: Flood ${hazards.floodLevel.toFixed(1)}m, Drought Stage ${hazards.droughtStage}, Fire Risk ${hazards.fireRisk}%.`,
    };
  }
}

export const worldSimulationEngine = new WorldSimulationEngine();
