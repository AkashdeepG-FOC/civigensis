import { CitizenId } from '../../types/citizen';
import { BEN_CONFIG, JULIE_CONFIG, RAVI_CONFIG } from '../../config/citizens';

export interface ActiveSpeech {
  citizenId: CitizenId;
  text: string;
  speakerName: string;
  startTime: number;
  durationMs: number;
  isSpeaking: boolean;
  mouthOpenAmount: number; // 0 to 1
  progress: number; // 0 to 1
}

export type SpeechListener = (speechMap: Record<CitizenId, ActiveSpeech | null>) => void;

export class SpeechSystem {
  private static instance: SpeechSystem;

  private activeSpeechMap: Record<CitizenId, ActiveSpeech | null> = {
    ben: null,
    julie: null,
    ravi: null,
  };

  private listeners: Set<SpeechListener> = new Set();
  private isMutedState: boolean = false;
  private animFrameId: number | null = null;
  private voicesLoaded: boolean = false;
  private availableVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        this.availableVoices = window.speechSynthesis.getVoices();
        if (this.availableVoices.length > 0) {
          this.voicesLoaded = true;
        }
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  public static getInstance(): SpeechSystem {
    if (!SpeechSystem.instance) {
      SpeechSystem.instance = new SpeechSystem();
    }
    return SpeechSystem.instance;
  }

  public subscribe(listener: SpeechListener): () => void {
    this.listeners.add(listener);
    listener(this.activeSpeechMap);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    if (muted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public getSpeechState(citizenId: CitizenId): ActiveSpeech | null {
    return this.activeSpeechMap[citizenId];
  }

  private getConfig(citizenId: CitizenId) {
    if (citizenId === 'ben') return BEN_CONFIG;
    if (citizenId === 'julie') return JULIE_CONFIG;
    return RAVI_CONFIG;
  }

  private selectVoice(citizenId: CitizenId): SpeechSynthesisVoice | null {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        this.availableVoices = window.speechSynthesis.getVoices();
      }
    }

    const config = this.getConfig(citizenId);
    const profile = config.voiceProfile;

    // 1. Try exact or partial match with preferred voice names
    for (const pref of profile.preferredVoiceNames) {
      const match = this.availableVoices.find((v) =>
        v.name.toLowerCase().includes(pref.toLowerCase())
      );
      if (match) return match;
    }

    // 2. Fallback by gender and language
    const isFemale = config.gender === 'female';
    const genderMatch = this.availableVoices.find((v) => {
      const name = v.name.toLowerCase();
      if (isFemale) {
        return name.includes('female') || name.includes('zira') || name.includes('hazel') || name.includes('samantha') || name.includes('karen') || name.includes('victoria');
      } else {
        return name.includes('male') || name.includes('david') || name.includes('george') || name.includes('mark') || name.includes('alex');
      }
    });

    if (genderMatch) return genderMatch;

    // 3. Any English voice fallback
    const enVoice = this.availableVoices.find((v) => v.lang.startsWith('en'));
    if (enVoice) return enVoice;

    return this.availableVoices[0] || null;
  }

  /**
   * Trigger speech audio and speech animation for a citizen model
   */
  public speak(citizenId: CitizenId, text: string) {
    if (!text || !text.trim()) return;

    const cleanText = text.replace(/[*#_\-\[\]]/g, '').trim();
    if (!cleanText) return;

    const config = this.getConfig(citizenId);
    const wordCount = cleanText.split(/\s+/).length;
    // Estimate reading time in ms (~180 WPM -> ~330ms per word + base 1200ms padding)
    const estimatedDurationMs = Math.max(2500, Math.min(12000, wordCount * 350 + 1200));

    // Cancel active speech for this citizen if any
    this.stop(citizenId);

    const now = Date.now();
    const newSpeech: ActiveSpeech = {
      citizenId,
      text: cleanText,
      speakerName: config.name,
      startTime: now,
      durationMs: estimatedDurationMs,
      isSpeaking: true,
      mouthOpenAmount: 0.8,
      progress: 0,
    };

    this.activeSpeechMap = {
      ...this.activeSpeechMap,
      [citizenId]: newSpeech,
    };

    this.notify();
    this.startAnimationTicker();

    // Trigger Web Speech API audio synthesis if browser supports it and not muted
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && !this.isMutedState) {
      try {
        window.speechSynthesis.cancel(); // Stop current speech overlap if needed

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voice = this.selectVoice(citizenId);
        if (voice) {
          utterance.voice = voice;
        }

        utterance.pitch = config.voiceProfile.pitch;
        utterance.rate = config.voiceProfile.rate;
        utterance.lang = config.voiceProfile.lang || 'en-US';

        utterance.onend = () => {
          this.stop(citizenId);
        };

        utterance.onerror = (e) => {
          console.warn(`[SpeechSystem] Speech error for ${citizenId}:`, e);
          // Non-fatal, animation ticker will naturally complete duration
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('[SpeechSystem] Error invoking speechSynthesis:', err);
      }
    }
  }

  public stop(citizenId?: CitizenId) {
    if (citizenId) {
      if (this.activeSpeechMap[citizenId]) {
        this.activeSpeechMap = {
          ...this.activeSpeechMap,
          [citizenId]: null,
        };
        this.notify();
      }
    } else {
      this.activeSpeechMap = {
        ben: null,
        julie: null,
        ravi: null,
      };
      this.notify();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }

  private startAnimationTicker() {
    if (this.animFrameId !== null) return;

    const tick = () => {
      const now = Date.now();
      let hasActiveSpeech = false;

      const updatedMap = { ...this.activeSpeechMap };

      (Object.keys(updatedMap) as CitizenId[]).forEach((id) => {
        const speech = updatedMap[id];
        if (speech && speech.isSpeaking) {
          const elapsed = now - speech.startTime;
          if (elapsed >= speech.durationMs) {
            updatedMap[id] = null;
          } else {
            hasActiveSpeech = true;
            const progress = elapsed / speech.durationMs;

            // Generate procedural mouth flap oscillation (sinusoidal + noise wave)
            const mouthFrequency = 14; // Hz
            const sinVal = Math.sin(elapsed * 0.001 * mouthFrequency * Math.PI * 2);
            const noise = Math.sin(elapsed * 0.027) * 0.3;
            const rawFlap = Math.max(0, (sinVal + noise + 0.5) / 1.8);
            const mouthOpenAmount = Math.min(1, Math.max(0.1, rawFlap));

            updatedMap[id] = {
              ...speech,
              progress,
              mouthOpenAmount,
            };
          }
        }
      });

      this.activeSpeechMap = updatedMap;
      this.notify();

      if (hasActiveSpeech) {
        this.animFrameId = requestAnimationFrame(tick);
      } else {
        this.animFrameId = null;
      }
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.activeSpeechMap));
  }
}

export const speechSystem = SpeechSystem.getInstance();
