import { CitizenNeeds, CitizenIdentity } from '../../types/citizenAgent';

export class NeedSystem {
  private needs: CitizenNeeds;

  constructor(initialNeeds?: Partial<CitizenNeeds>) {
    this.needs = {
      hunger: 20,
      energy: 90,
      thirst: 15,
      safety: 90,
      socialConnection: 50,
      comfort: 80,
      curiosity: 60,
      achievement: 50,
      belonging: 60,
      financialSecurity: 70,
      professionalProgress: 50,
      ...initialNeeds,
    };
  }

  public getNeeds(): CitizenNeeds {
    return { ...this.needs };
  }

  /**
   * Ticks continuous need decay based on simulation delta minutes & environmental factors
   */
  public update(simDeltaMinutes: number, ambientTemperature: number, isWorking: boolean = false) {
    if (simDeltaMinutes <= 0) return;

    // Environmental factors
    const heatMultiplier = 1.0 + Math.max(0, (ambientTemperature - 30) / 15);
    const workMultiplier = isWorking ? 1.8 : 1.0;

    // Hunger increases steadily over time
    this.needs.hunger = Math.min(100, this.needs.hunger + simDeltaMinutes * 0.12 * heatMultiplier * workMultiplier);

    // Thirst increases faster in hot weather or during work
    this.needs.thirst = Math.min(100, this.needs.thirst + simDeltaMinutes * 0.18 * heatMultiplier * workMultiplier);

    // Energy depletes with exertion & wakefulness
    this.needs.energy = Math.max(0, this.needs.energy - simDeltaMinutes * 0.08 * workMultiplier);

    // Social connection slowly decays when alone
    this.needs.socialConnection = Math.max(0, this.needs.socialConnection - simDeltaMinutes * 0.02);

    // Curiosity naturally accumulates over time if stagnant
    this.needs.curiosity = Math.min(100, this.needs.curiosity + simDeltaMinutes * 0.03);

    // Comfort decays slowly without rest/shelter
    this.needs.comfort = Math.max(0, this.needs.comfort - simDeltaMinutes * 0.01 * (heatMultiplier > 1.2 ? 1.5 : 1.0));
  }

  public modifyNeed(key: keyof CitizenNeeds, delta: number) {
    if (key in this.needs) {
      this.needs[key] = Math.max(0, Math.min(100, this.needs[key] + delta));
    }
  }

  public setNeed(key: keyof CitizenNeeds, value: number) {
    if (key in this.needs) {
      this.needs[key] = Math.max(0, Math.min(100, value));
    }
  }

  /**
   * Formats motivational pressure summary for LLM context without hardcoding actions!
   */
  public getMotivationalPressures(identity: CitizenIdentity): string[] {
    const pressures: string[] = [];

    if (this.needs.hunger > 70) pressures.push(`High hunger (${Math.round(this.needs.hunger)}/100) — feels physically empty and needs food.`);
    else if (this.needs.hunger > 45) pressures.push(`Moderate hunger (${Math.round(this.needs.hunger)}/100).`);

    if (this.needs.thirst > 70) pressures.push(`High thirst (${Math.round(this.needs.thirst)}/100) — dry throat, seeking hydration.`);

    if (this.needs.energy < 25) pressures.push(`Severe exhaustion (Energy: ${Math.round(this.needs.energy)}/100) — struggling to stay focused.`);
    else if (this.needs.energy < 50) pressures.push(`Low energy (${Math.round(this.needs.energy)}/100) — fatigue setting in.`);

    if (this.needs.socialConnection < 30 && identity.personality.socialTendency !== 'low') {
      pressures.push(`Craving companionship or conversation (Social Connection: ${Math.round(this.needs.socialConnection)}/100).`);
    }

    if (this.needs.curiosity > 75 && identity.personality.explorationTendency !== 'low') {
      pressures.push(`High curiosity (${Math.round(this.needs.curiosity)}/100) — eager to inspect, explore, or discover something new.`);
    }

    if (this.needs.achievement < 40) {
      pressures.push(`Desire for accomplishment (${Math.round(this.needs.achievement)}/100) — wants to feel productive or helpful.`);
    }

    if (pressures.length === 0) {
      pressures.push('Physical and mental state is balanced. No pressing urgent discomfort.');
    }

    return pressures;
  }
}
