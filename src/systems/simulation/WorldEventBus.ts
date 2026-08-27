import { WorldEvent } from '../../types/world';

export type EventBusListener = (event: WorldEvent) => void;

export class WorldEventBus {
  private static instance: WorldEventBus;
  private listeners: Set<EventBusListener> = new Set();
  private typeListeners: Map<string, Set<EventBusListener>> = new Map();
  private eventHistory: WorldEvent[] = [];
  private maxHistory: number = 50;

  public static getInstance(): WorldEventBus {
    if (!WorldEventBus.instance) {
      WorldEventBus.instance = new WorldEventBus();
    }
    return WorldEventBus.instance;
  }

  public subscribe(listener: EventBusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeToType(eventType: string, listener: EventBusListener): () => void {
    if (!this.typeListeners.has(eventType)) {
      this.typeListeners.set(eventType, new Set());
    }
    const set = this.typeListeners.get(eventType)!;
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }

  public emit(type: string, description: string, payload: Record<string, any> = {}): WorldEvent {
    const event: WorldEvent = {
      id: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      description,
      payload,
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    // Broadcast to global subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[WorldEventBus] Listener error:', err);
      }
    });

    // Broadcast to specific type subscribers
    const typeSet = this.typeListeners.get(type);
    if (typeSet) {
      typeSet.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error(`[WorldEventBus] Type listener error (${type}):`, err);
        }
      });
    }

    return event;
  }

  public getRecentEvents(count: number = 10): WorldEvent[] {
    return this.eventHistory.slice(0, count);
  }
}

export const worldEventBus = WorldEventBus.getInstance();
