import { CitizenId } from '../../types/citizen';

export type RaviState =
  | 'AT_HOME'
  | 'WAKE_UP'
  | 'GO_TO_TOWN_CENTER'
  | 'SETUP_STALL'
  | 'SELLING'
  | 'IDLE_AT_STALL'
  | 'ARRANGE_VEGETABLES'
  | 'TALK_TO_CUSTOMER'
  | 'SELL_TO_CUSTOMER'
  | 'EAT_LUNCH'
  | 'CLOSE_STALL'
  | 'GO_HOME'
  | 'RELAX'
  | 'SLEEP'
  | 'ALERT'
  | 'AFRAID'
  | 'ANGRY'
  | 'PANIC'
  | 'FLEEING'
  | 'RECOVERING'
  | 'DRINK_WATER'
  | 'LOOK_AROUND';

export const RAVI_ALLOWED_ACTIONS: readonly RaviState[] = [
  'AT_HOME',
  'WAKE_UP',
  'GO_TO_TOWN_CENTER',
  'SETUP_STALL',
  'SELLING',
  'IDLE_AT_STALL',
  'ARRANGE_VEGETABLES',
  'TALK_TO_CUSTOMER',
  'SELL_TO_CUSTOMER',
  'EAT_LUNCH',
  'CLOSE_STALL',
  'GO_HOME',
  'RELAX',
  'SLEEP',
  'ALERT',
  'AFRAID',
  'ANGRY',
  'PANIC',
  'FLEEING',
  'RECOVERING',
  'DRINK_WATER',
  'LOOK_AROUND',
] as const;


export interface VegetableStock {
  tomato: number;
  potato: number;
  onion: number;
  carrot: number;
}

export type VegetableItem = keyof VegetableStock;

export const VEGETABLE_PRICES: Record<VegetableItem, number> = {
  tomato: 20,
  potato: 10,
  onion: 15,
  carrot: 25,
};

export interface RaviPersonality {
  friendliness: number;    // 0.0 - 1.0 (influences customer greeting frequency)
  patience: number;        // 0.0 - 1.0 (influences waiting time during sales)
  talkativeness: number;   // 0.0 - 1.0 (influences chatter frequency)
  workDiscipline: number;  // 0.0 - 1.0 (influences schedule adherence)
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  customer: CitizenId;
  item: VegetableItem;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
}

export interface RaviNPCStateData {
  currentState: RaviState;
  previousState: RaviState;
  shopOpen: boolean;
  money: number;
  customersServed: number;
  stock: VegetableStock;
  currentCustomer: CitizenId | null;
  personality: RaviPersonality;
  lastStateChangeMinute: number;
  idleCooldownUntilMinute: number;
  activeTransaction: TransactionRecord | null;
  statusMessage: string;
}
