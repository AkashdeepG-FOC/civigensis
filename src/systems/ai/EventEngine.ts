import { CitizenId } from '../../types/citizen';
import { CitizenEvent, CitizenEventType } from '../../types/citizenAgent';

export class EventEngine {
  private static instance: EventEngine;

  private eventsMap: Record<CitizenId, CitizenEvent[]> = {
    ben: [],
    julie: [],
    ravi: [],
  };

  public static getInstance(): EventEngine {
    if (!EventEngine.instance) {
      EventEngine.instance = new EventEngine();
    }
    return EventEngine.instance;
  }

  public static getPriorityForType(type: CitizenEventType): number {
    switch (type) {
      case 'LIFE_THREAT':
        return 100;
      case 'PHYSICAL_DANGER':
        return 95;
      case 'SOCIAL_INTERACTION':
        return 90;
      case 'URGENT_HELP':
        return 85;
      case 'CRITICAL_NEED':
        return 75;
      case 'TASK_INTERRUPT':
        return 65;
      case 'LONG_TERM_GOAL':
        return 50;
      case 'EXPLORATION':
        return 30;
      case 'IDLE_OBSERVE':
      default:
        return 10;
    }
  }

  public pushEvent(
    eventData: Omit<CitizenEvent, 'id' | 'timestamp'> & { timestamp?: number }
  ): CitizenEvent {
    const targetId = (eventData.target as CitizenId) || 'ben';
    if (!this.eventsMap[targetId]) {
      this.eventsMap[targetId] = [];
    }

    const newEvent: CitizenEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: eventData.timestamp || Date.now(),
      priority: eventData.priority ?? EventEngine.getPriorityForType(eventData.type),
    };

    // Replace or append event
    this.eventsMap[targetId].push(newEvent);

    // Keep events sorted by priority descending
    this.eventsMap[targetId].sort((a, b) => b.priority - a.priority);

    // Bound max events queue to prevent memory leak
    if (this.eventsMap[targetId].length > 20) {
      this.eventsMap[targetId] = this.eventsMap[targetId].slice(0, 20);
    }

    console.log(
      `[EVENT_ENGINE] Created Event "${newEvent.type}" (Priority ${newEvent.priority}) for ${targetId.toUpperCase()} from ${newEvent.source.toUpperCase()}: "${newEvent.message || ''}"`
    );

    return newEvent;
  }

  public getPendingEvents(citizenId: CitizenId): CitizenEvent[] {
    return this.eventsMap[citizenId] || [];
  }

  public getHighestPriorityEvent(citizenId: CitizenId): CitizenEvent | null {
    const events = this.getPendingEvents(citizenId);
    return events.length > 0 ? events[0] : null;
  }

  public consumeEvent(citizenId: CitizenId, eventId: string) {
    if (!this.eventsMap[citizenId]) return;
    this.eventsMap[citizenId] = this.eventsMap[citizenId].filter((e) => e.id !== eventId);
  }

  public consumeAllSocialEvents(citizenId: CitizenId) {
    if (!this.eventsMap[citizenId]) return;
    this.eventsMap[citizenId] = this.eventsMap[citizenId].filter(
      (e) => e.type !== 'SOCIAL_INTERACTION'
    );
  }

  public clearEvents(citizenId: CitizenId) {
    this.eventsMap[citizenId] = [];
  }
}

export const eventEngine = EventEngine.getInstance();
