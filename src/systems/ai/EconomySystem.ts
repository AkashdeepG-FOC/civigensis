import { CitizenId } from '../../types/citizen';
import { agentEventLogger } from '../logging/AgentEventLogger';

export interface CreditTransaction {
  id: string;
  timestamp: string;
  fromCitizen: CitizenId | 'SYSTEM';
  toCitizen: CitizenId | 'SYSTEM';
  amount: number;
  reason: string;
}

export class EconomySystem {
  private static instance: EconomySystem;
  private balances: Map<CitizenId, number> = new Map();
  private transactionHistory: CreditTransaction[] = [];

  constructor() {
    // Initial balances (20 Village Credits per citizen, matching Emergence World MVP)
    this.balances.set('ben', 20);
    this.balances.set('julie', 20);
    this.balances.set('ravi', 20);
  }

  public static getInstance(): EconomySystem {
    if (!EconomySystem.instance) {
      EconomySystem.instance = new EconomySystem();
    }
    return EconomySystem.instance;
  }

  public getBalance(citizenId: CitizenId): number {
    return this.balances.get(citizenId) || 0;
  }

  public awardCredits(citizenId: CitizenId, amount: number, reason: string): boolean {
    if (amount <= 0) return false;
    const current = this.getBalance(citizenId);
    this.balances.set(citizenId, current + amount);

    const tx: CreditTransaction = {
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      fromCitizen: 'SYSTEM',
      toCitizen: citizenId,
      amount,
      reason,
    };
    this.transactionHistory.unshift(tx);

    agentEventLogger.logMemory({
      agentId: citizenId,
      memoryType: 'episodic',
      summary: `Earned ${amount} Village Credits for: ${reason}. New Balance: ${current + amount} VC.`,
      location: 'economy',
      importance: 4,
    });

    return true;
  }

  public deductCredits(citizenId: CitizenId, amount: number, reason: string): boolean {
    if (amount <= 0) return false;
    const current = this.getBalance(citizenId);
    if (current < amount) {
      return false; // Insufficient credits
    }

    this.balances.set(citizenId, current - amount);
    const tx: CreditTransaction = {
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      fromCitizen: citizenId,
      toCitizen: 'SYSTEM',
      amount,
      reason,
    };
    this.transactionHistory.unshift(tx);

    return true;
  }

  public transferCredits(fromCitizen: CitizenId, toCitizen: CitizenId, amount: number, reason: string): { success: boolean; reason: string } {
    if (amount <= 0) {
      return { success: false, reason: 'Transfer amount must be positive.' };
    }
    const fromBalance = this.getBalance(fromCitizen);
    if (fromBalance < amount) {
      return { success: false, reason: `Insufficient funds. Balance: ${fromBalance} VC, Required: ${amount} VC.` };
    }

    this.balances.set(fromCitizen, fromBalance - amount);
    this.balances.set(toCitizen, this.getBalance(toCitizen) + amount);

    const tx: CreditTransaction = {
      id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      fromCitizen,
      toCitizen,
      amount,
      reason,
    };
    this.transactionHistory.unshift(tx);

    return {
      success: true,
      reason: `Transferred ${amount} VC to ${toCitizen} for: ${reason}.`,
    };
  }

  public getEconomyPromptSummary(citizenId: CitizenId): string {
    const bal = this.getBalance(citizenId);
    return `Village Credits Balance: ${bal} VC. (Credits can be transferred or earned via work deliverables).`;
  }
}

export const economySystem = EconomySystem.getInstance();
