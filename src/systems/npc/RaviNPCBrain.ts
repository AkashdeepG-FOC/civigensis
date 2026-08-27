import { CitizenId, AnimationState } from '../../types/citizen';
import { VEGETABLE_SELLER_STALL_POSITION, RAVI_HOME_POSITION } from '../../types/locations';
import { worldSimulationEngine } from '../simulation/WorldSimulationEngine';
import { navigationSystem } from '../ai/NavigationSystem';
import { worldEventBus } from '../simulation/WorldEventBus';
import {
  RaviState,
  RaviNPCStateData,
  VegetableItem,
  VEGETABLE_PRICES,
  TransactionRecord,
  RAVI_ALLOWED_ACTIONS,
} from './raviState';

export type RaviBrainListener = (state: RaviNPCStateData) => void;

export class RaviNPCBrain {
  private stateData: RaviNPCStateData = {
    currentState: 'SLEEP',
    previousState: 'SLEEP',
    shopOpen: false,
    money: 1000,
    customersServed: 0,
    stock: {
      tomato: 20,
      potato: 30,
      onion: 25,
      carrot: 15,
    },
    currentCustomer: null,
    personality: {
      friendliness: 0.8,
      patience: 0.7,
      talkativeness: 0.6,
      workDiscipline: 0.8,
    },
    lastStateChangeMinute: 0,
    idleCooldownUntilMinute: 0,
    activeTransaction: null,
    statusMessage: 'Sleeping peacefully at home',
  };

  private listeners: Set<RaviBrainListener> = new Set();
  private transactionCooldownUntil: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    worldEventBus.subscribe((evt: any) => {
      this.handleWorldEvent(evt);
    });
  }

  private handleWorldEvent(evt: any) {
    const type = String(evt.type || evt.name || '').toUpperCase();
    const msg = String(evt.message || evt.data?.message || '').toLowerCase();

    if (type.includes('SHOUT') || msg.includes('shout')) {
      this.setState('ALERT', 'Alerted by sudden shout nearby');
    } else if (type.includes('THREATEN') || msg.includes('threat')) {
      this.setState('AFRAID', 'Apprehensive due to aggressive threat');
    } else if (type.includes('ATTACK') || type.includes('DANGER') || msg.includes('attack')) {
      this.setState('PANIC', 'Panicked by direct hostility!');
      setTimeout(() => {
        if (this.stateData.currentState === 'PANIC') {
          this.setState('FLEEING', 'Fleeing to safe location');
          setTimeout(() => {
            if (this.stateData.currentState === 'FLEEING') {
              this.setState('RECOVERING', 'Recovering composure');
              setTimeout(() => {
                if (this.stateData.currentState === 'RECOVERING') {
                  this.setState('GO_TO_TOWN_CENTER', 'Returning to market stall');
                }
              }, 3000);
            }
          }, 4000);
        }
      }, 1500);
    }
  }

  public requestAction(action: string): boolean {
    if (!RAVI_ALLOWED_ACTIONS.includes(action as any)) {
      console.warn(`[Ravi] Invalid action rejected: ${action}`);
      this.setState('SELLING', 'Reverted to selling after invalid action attempt');
      return false;
    }
    this.setState(action as RaviState, `External action request: ${action}`);
    return true;
  }

  public subscribe(listener: RaviBrainListener): () => void {
    this.listeners.add(listener);
    listener(this.stateData);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStateData(): RaviNPCStateData {
    return this.stateData;
  }

  private notify() {
    this.listeners.forEach((l) => l(this.stateData));
  }

  private setState(newState: RaviState, statusMsg?: string) {
    if (!RAVI_ALLOWED_ACTIONS.includes(newState)) {
      console.warn(`[Ravi] Invalid action rejected: ${newState}`);
      this.stateData.currentState = 'SELLING';
      this.notify();
      return;
    }

    if (this.stateData.currentState === newState) return;

    const prev = this.stateData.currentState;
    this.stateData.previousState = prev;
    this.stateData.currentState = newState;
    this.stateData.lastStateChangeMinute = worldSimulationEngine.simulationMinutes;
    if (statusMsg) {
      this.stateData.statusMessage = statusMsg;
    }

    // Clean development transition log
    console.log(`[Ravi State Machine] ${prev} ➔ ${newState} (${statusMsg || 'Scheduled transition'})`);

    worldEventBus.emit('RAVI_STATE_CHANGE', `Ravi transitioned from ${prev} to ${newState}`, {
      prevState: prev,
      newState,
      simTime: worldSimulationEngine.getFormattedTime(true),
    });

    this.notify();
  }

  /**
   * Main simulation tick for Ravi logic and movement updates
   */
  public update(
    currentPos: [number, number, number],
    currentRotY: number,
    delta: number,
    allPositions: Record<CitizenId, [number, number, number]>
  ): {
    position: [number, number, number];
    rotationY: number;
    animState: AnimationState;
  } {
    const simMinutes = worldSimulationEngine.simulationMinutes;
    const hour = Math.floor(simMinutes / 60);
    const minute = Math.floor(simMinutes % 60);

    // 1. Process Routine Schedule & State Machine Transitions
    this.processSchedule(simMinutes, hour, minute, currentPos);

    // 2. Customer Proximity Detection & Transaction Logic
    if (this.stateData.shopOpen) {
      this.processCustomerInteractions(currentPos, allPositions, simMinutes);
    }

    // 3. Idle Behaviors while at stall
    this.processIdleBehaviours(simMinutes);

    // 4. Update Navigation Movement
    const navResult = navigationSystem.update(currentPos, currentRotY, delta, 'ravi');

    // 5. Map Ravi state to visual animation
    let animState: AnimationState = navResult.animState;

    if (animState === 'IDLE') {
      if (this.stateData.currentState === 'ARRANGE_VEGETABLES') {
        animState = 'IDLE';
      } else if (this.stateData.currentState === 'TALK_TO_CUSTOMER') {
        animState = 'IDLE';
      } else if (this.stateData.currentState === 'SLEEP') {
        animState = 'IDLE';
      }
    }

    return {
      position: navResult.position,
      rotationY: navResult.rotationY,
      animState,
    };
  }

  /**
   * Deterministic daily routine schedule matching simulation clock
   */
  private processSchedule(
    simMinutes: number,
    hour: number,
    minute: number,
    currentPos: [number, number, number]
  ) {
    const currentState = this.stateData.currentState;

    // Work Hours (07:00 - 18:00) vs Home Hours (19:00 - 06:00)
    const isWorkHours = hour >= 7 && hour < 18;
    const isHomeHours = hour >= 19 || hour < 6;

    if (isWorkHours) {
      if (['SLEEP', 'WAKE_UP', 'GO_HOME', 'RELAX', 'AT_HOME'].includes(currentState)) {
        this.stateData.shopOpen = true;
        this.setState('SELLING', 'Vegetable stall OPEN — waiting for customers');
      }
    } else if (isHomeHours) {
      if (currentState !== 'SLEEP' && currentState !== 'RELAX' && currentState !== 'GO_HOME' && currentState !== 'AT_HOME') {
        this.stateData.shopOpen = false;
        this.setState('SLEEP', 'Sleeping in bed');
      }
    }

    // 06:00 - Wake up
    if (hour === 6 && minute >= 0 && minute < 30) {
      if (currentState === 'SLEEP') {
        this.setState('WAKE_UP', 'Waking up at home');
      }
    }

    // 06:30 - Travel to Town Center
    else if ((hour === 6 && minute >= 30) || (hour === 7 && minute < 15)) {
      if (currentState === 'WAKE_UP' || currentState === 'SLEEP') {
        this.setState('GO_TO_TOWN_CENTER', 'Travelling to Town Center Market');
      }
    }

    // 07:15 - Setup vegetable stall
    else if (hour === 7 && minute >= 15 && minute < 30) {
      if (currentState === 'GO_TO_TOWN_CENTER' || currentState === 'WAKE_UP') {
        this.setState('SETUP_STALL', 'Setting up vegetable display and crates');
      }
    }

    // 07:30 - Start selling
    else if ((hour >= 7 && hour < 12) || (hour === 7 && minute >= 30)) {
      if (currentState === 'SETUP_STALL' || currentState === 'GO_TO_TOWN_CENTER') {
        this.stateData.shopOpen = true;
        this.setState('SELLING', 'Vegetable stall OPEN — waiting for customers');
      }
    }

    // 12:00 - Lunch break
    else if (hour === 12 && minute < 60) {
      if (this.stateData.shopOpen) {
        this.stateData.shopOpen = false;
        this.setState('EAT_LUNCH', 'Taking lunch break at stall');
      }
    }

    // 13:00 - Resume selling
    else if (hour >= 13 && hour < 18) {
      if (!this.stateData.shopOpen && currentState !== 'TALK_TO_CUSTOMER' && currentState !== 'SELL_TO_CUSTOMER') {
        this.stateData.shopOpen = true;
        this.setState('SELLING', 'Resumed vegetable sales — shop OPEN');
      }
    }

    // 18:00 - Close stall
    else if (hour === 18 && minute < 15) {
      if (this.stateData.shopOpen) {
        this.stateData.shopOpen = false;
        this.setState('CLOSE_STALL', 'Packing up inventory & closing shop');
      }
    }

    // 18:15 - Leave Town Center
    else if ((hour === 18 && minute >= 15) || (hour === 19 && minute < 0)) {
      if (currentState === 'CLOSE_STALL' || currentState === 'SELLING') {
        this.stateData.shopOpen = false;
        this.setState('GO_HOME', 'Walking back home from Town Center');
      }
    }

    // 19:00 - Relax at home
    else if (hour >= 19 && hour < 22) {
      if (currentState === 'GO_HOME' || currentState === 'CLOSE_STALL') {
        this.setState('RELAX', 'Relaxing at home after a busy day');
      }
    }

    // 22:00 - Sleep
    else if (hour >= 22 || hour < 6) {
      if (currentState !== 'SLEEP') {
        this.stateData.shopOpen = false;
        this.setState('SLEEP', 'Sleeping in bed');
      }
    }

    // Automatic Navigation Enforcement based on current location distance
    const stallPos = VEGETABLE_SELLER_STALL_POSITION;
    const dxStall = stallPos[0] - currentPos[0];
    const dzStall = stallPos[2] - currentPos[2];
    const distToStall = Math.sqrt(dxStall * dxStall + dzStall * dzStall);

    const homePos = RAVI_HOME_POSITION;
    const dxHome = homePos[0] - currentPos[0];
    const dzHome = homePos[2] - currentPos[2];
    const distToHome = Math.sqrt(dxHome * dxHome + dzHome * dzHome);

    const isNavigating = navigationSystem.getCurrentIntention('ravi') !== null;

    const isMarketState = [
      'GO_TO_TOWN_CENTER',
      'SETUP_STALL',
      'SELLING',
      'IDLE_AT_STALL',
      'ARRANGE_VEGETABLES',
      'TALK_TO_CUSTOMER',
      'SELL_TO_CUSTOMER',
      'EAT_LUNCH',
      'LOOK_AROUND',
      'DRINK_WATER',
    ].includes(this.stateData.currentState);

    const isHomeState = ['GO_HOME', 'RELAX', 'SLEEP', 'AT_HOME', 'WAKE_UP'].includes(this.stateData.currentState);

    // Auto-route Ravi to Town Center Market if in market state but currently far away (> 3.5m)
    if (isMarketState && distToStall > 3.5 && !isNavigating) {
      console.log(`[Ravi Navigation Enforcer] Auto-routing Ravi to Vegetable Stall (Distance: ${distToStall.toFixed(1)}m)`);
      this.startNavigationToStall(currentPos);
    }

    // Auto-route Ravi to Cottage if in home state but currently far away (> 3.5m)
    if (isHomeState && distToHome > 3.5 && !isNavigating) {
      console.log(`[Ravi Navigation Enforcer] Auto-routing Ravi to Cottage (Distance: ${distToHome.toFixed(1)}m)`);
      this.startNavigationToHome(currentPos);
    }
  }

  /**
   * Scans for approaching customers (Ben / Julie) and processes transactions
   */
  private processCustomerInteractions(
    currentPos: [number, number, number],
    allPositions: Record<CitizenId, [number, number, number]>,
    simMinutes: number
  ) {
    if (!this.stateData.shopOpen) return;

    // Check transaction cooldown
    if (simMinutes < this.transactionCooldownUntil) return;

    const customersToTest: CitizenId[] = ['ben', 'julie'];

    for (const custId of customersToTest) {
      const custPos = allPositions[custId];
      if (!custPos) continue;

      const dx = custPos[0] - currentPos[0];
      const dz = custPos[2] - currentPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Customer enters 5.0m interaction radius
      if (dist <= 5.0) {
        // Face customer
        navigationSystem.setLookAtTarget('ravi', custPos);

        if (this.stateData.currentState !== 'TALK_TO_CUSTOMER' && this.stateData.currentState !== 'SELL_TO_CUSTOMER') {
          this.stateData.currentCustomer = custId;
          const custName = custId === 'ben' ? 'Ben' : 'Julie';
          this.setState('TALK_TO_CUSTOMER', `Noticed customer ${custName} approaching stall`);

          // Conduct sale
          this.executeSaleTransaction(custId, custPos, simMinutes);
        }
        return;
      }
    }

    // No customer nearby
    if (this.stateData.currentCustomer && (this.stateData.currentState === 'TALK_TO_CUSTOMER' || this.stateData.currentState === 'SELL_TO_CUSTOMER')) {
      this.stateData.currentCustomer = null;
      navigationSystem.setLookAtTarget('ravi', null);
      this.setState('SELLING', 'Customer departed — waiting for new customers');
    }
  }

  /**
   * Executes vegetable transaction logic with customer
   */
  private executeSaleTransaction(
    customerId: CitizenId,
    customerPos: [number, number, number],
    simMinutes: number
  ) {
    const availableItems: VegetableItem[] = (['tomato', 'potato', 'onion', 'carrot'] as VegetableItem[]).filter(
      (item) => this.stateData.stock[item] > 0
    );

    if (availableItems.length === 0) {
      this.setState('IDLE_AT_STALL', 'Sold out of all vegetables!');
      return;
    }

    // Pick item based on simple rotation or random selection
    const chosenItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    const quantity = 2;
    const price = VEGETABLE_PRICES[chosenItem];
    const totalCost = price * quantity;

    // Deduct stock, increase money, increment count
    this.stateData.stock[chosenItem] -= quantity;
    this.stateData.money += totalCost;
    this.stateData.customersServed += 1;

    const customerName = customerId === 'ben' ? 'Ben' : 'Julie';
    const transId = `TX-${Date.now()}`;
    const timeStr = worldSimulationEngine.getFormattedTime(true);

    const transactionRecord: TransactionRecord = {
      id: transId,
      timestamp: timeStr,
      customer: customerId,
      item: chosenItem,
      quantity,
      pricePerUnit: price,
      totalCost,
    };

    this.stateData.activeTransaction = transactionRecord;
    this.transactionCooldownUntil = simMinutes + 0.4; // Cooldown for transaction animation (~24 sim seconds)

    this.setState(
      'SELL_TO_CUSTOMER',
      `Sold ${quantity} ${chosenItem}(s) to ${customerName} for ₹${totalCost}`
    );

    console.log(`[Ravi Transaction] [${transId}] Customer: ${customerName}, Item: ${chosenItem} x${quantity}, Earned: ₹${totalCost}, Total Money: ₹${this.stateData.money}`);

    worldEventBus.emit('VEGETABLE_SALE', `${customerName} bought ${quantity} ${chosenItem}s from Ravi for ₹${totalCost}`, {
      seller: 'ravi',
      buyer: customerId,
      item: chosenItem,
      quantity,
      totalCost,
      moneyAfter: this.stateData.money,
      stockAfter: { ...this.stateData.stock },
    });
  }

  /**
   * Idle behavior manager when no customer is present at stall
   */
  private processIdleBehaviours(simMinutes: number) {
    if (this.stateData.currentState !== 'SELLING') return;
    if (this.stateData.currentCustomer !== null) return;

    if (simMinutes >= this.stateData.idleCooldownUntilMinute) {
      const idleStates: RaviState[] = ['ARRANGE_VEGETABLES', 'LOOK_AROUND', 'DRINK_WATER', 'SELLING'];
      const nextIdle = idleStates[Math.floor(Math.random() * idleStates.length)];

      // Hold idle behavior for 0.5 - 1.0 simulation minutes (30-60 sim seconds)
      const duration = 0.5 + Math.random() * 0.5;
      this.stateData.idleCooldownUntilMinute = simMinutes + duration;

      if (nextIdle !== 'SELLING') {
        const descriptions: Record<string, string> = {
          ARRANGE_VEGETABLES: 'Arranging fresh tomatoes and onions on the display crate',
          LOOK_AROUND: 'Looking around Town Center Market for potential buyers',
          DRINK_WATER: 'Taking a quick sip of water',
        };
        this.setState(nextIdle, descriptions[nextIdle] || 'Idle at stall');
      }
    }
  }

  /**
   * Helper to send Ravi to Town Center Market stall using A* pathfinding
   */
  private startNavigationToStall(currentPos: [number, number, number]) {
    navigationSystem.setIntention(
      {
        id: `NAV-RAVI-${Date.now()}`,
        intent: 'Travel to Town Center Vegetable Stall',
        targetDescription: "Ravi's Vegetable Stall",
        parsedIntent: {
          intentionText: 'Travel to Town Center Market',
          rationale: 'Daily work schedule',
          targetDescription: "Ravi's Vegetable Stall",
          action: 'GO_TO' as any,
          target: 'vegetable_stall',
          rawText: 'move_to vegetable_stall',
          createdAt: Date.now(),
        },
        createdAt: Date.now(),
        status: 'EXECUTING' as any,
      },
      'ravi',
      currentPos
    );
  }

  /**
   * Helper to send Ravi home using A* pathfinding
   */
  private startNavigationToHome(currentPos: [number, number, number]) {
    navigationSystem.setIntention(
      {
        id: `NAV-RAVI-HOME-${Date.now()}`,
        intent: 'Return to Cottage',
        targetDescription: "Ravi's Cottage",
        parsedIntent: {
          intentionText: 'Return Home',
          rationale: 'Daily routine end of work',
          targetDescription: "Ravi's Cottage",
          action: 'GO_TO' as any,
          target: 'ravis_house',
          rawText: 'move_to ravis_house',
          createdAt: Date.now(),
        },
        createdAt: Date.now(),
        status: 'EXECUTING' as any,
      },
      'ravi',
      currentPos
    );
  }
}

export const raviNPCBrain = new RaviNPCBrain();
