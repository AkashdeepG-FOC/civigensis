import { EmotionState, CitizenNeeds } from '../../types/citizenAgent';

export class EmotionSystem {
  private state: EmotionState;

  constructor(initialValence: number = 0.2, initialArousal: number = 0.3) {
    this.state = {
      valence: initialValence,
      arousal: initialArousal,
      stress: 10,
      mood: 'calm',
      lastUpdated: Date.now(),
    };
  }

  public getEmotionState(): EmotionState {
    return { ...this.state };
  }

  public update(simDeltaMinutes: number, needs: CitizenNeeds) {
    // 1. Stress increases if hunger > 60 or thirst > 60 or energy < 25
    if (needs.hunger > 60 || needs.thirst > 60 || needs.energy < 25) {
      this.state.stress = Math.min(100, this.state.stress + simDeltaMinutes * 0.5);
      this.state.valence = Math.max(-1.0, this.state.valence - simDeltaMinutes * 0.01);
    } else {
      // Natural stress relaxation over time
      this.state.stress = Math.max(0, this.state.stress - simDeltaMinutes * 0.3);
    }

    // 2. Natural mood decay towards baseline calm state
    if (this.state.valence > 0.2) {
      this.state.valence = Math.max(0.2, this.state.valence - simDeltaMinutes * 0.005);
    } else if (this.state.valence < 0.2) {
      this.state.valence = Math.min(0.2, this.state.valence + simDeltaMinutes * 0.005);
    }

    if (this.state.arousal > 0.3) {
      this.state.arousal = Math.max(0.3, this.state.arousal - simDeltaMinutes * 0.005);
    }

    // 3. Recompute categorical mood label based on valence, arousal & stress
    if (this.state.stress > 65) {
      this.state.mood = 'anxious';
    } else if (needs.energy < 20) {
      this.state.mood = 'tired';
    } else if (this.state.valence > 0.5 && this.state.arousal > 0.5) {
      this.state.mood = 'excited';
    } else if (this.state.valence > 0.3) {
      this.state.mood = 'happy';
    } else if (this.state.valence < -0.3) {
      this.state.mood = 'frustrated';
    } else {
      this.state.mood = 'calm';
    }

    this.state.lastUpdated = Date.now();
  }

  public modifyEmotion(deltaValence: number, deltaArousal: number, deltaStress: number, reason: string) {
    this.state.valence = Math.max(-1.0, Math.min(1.0, this.state.valence + deltaValence));
    this.state.arousal = Math.max(0.0, Math.min(1.0, this.state.arousal + deltaArousal));
    this.state.stress = Math.max(0, Math.min(100, this.state.stress + deltaStress));
    this.state.lastUpdated = Date.now();
    console.log(`[EMOTION_UPDATE] Reason: "${reason}". New Mood: ${this.state.mood.toUpperCase()} (Valence: ${this.state.valence.toFixed(2)}, Stress: ${this.state.stress.toFixed(0)})`);
  }

  public getEmotionPromptSummary(): string {
    const valText = this.state.valence > 0.4 ? 'Positive/Upbeat' : this.state.valence < -0.3 ? 'Negative/Troubled' : 'Balanced/Neutral';
    return `Categorical Mood: ${this.state.mood.toUpperCase()} (${valText}, Stress Level: ${Math.round(this.state.stress)}%)`;
  }
}
