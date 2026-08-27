import { MongoClient, Db, Collection } from 'mongodb';
import { AgentEvent } from '../../types/agentEvent';

export class MongoDBService {
  private static instance: MongoDBService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private uri: string;
  private dbName: string;
  private indexedCollections: Set<string> = new Set();
  private lastConnectAttempt: number = 0;
  private reconnectCooldownMs: number = 10000;

  private constructor() {
    this.uri = (typeof process !== 'undefined' && process.env?.MONGODB_URI) || 'mongodb://localhost:27017';
    this.dbName = (typeof process !== 'undefined' && process.env?.MONGODB_DATABASE) || 'civigenis';
  }

  public static getInstance(): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService();
    }
    return MongoDBService.instance;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getCollectionNameForAgent(agentId?: string): string {
    if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
      return 'agent_events';
    }
    const cleanId = agentId.toLowerCase().trim();
    if (cleanId === 'ben') return 'ben_agent_events';
    if (cleanId === 'julie') return 'julie_agent_events';
    return `${cleanId}_agent_events`;
  }

  public async connect(): Promise<boolean> {
    if (this.isConnected && this.client && this.db) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    const now = Date.now();
    if (now - this.lastConnectAttempt < this.reconnectCooldownMs) {
      return false;
    }

    this.lastConnectAttempt = now;
    this.isConnecting = true;

    try {
      console.log(`[MongoDBService] Connecting to MongoDB at ${this.uri} (db: ${this.dbName})...`);
      this.client = new MongoClient(this.uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      } as any);

      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      this.isConnecting = false;

      console.log(`[MongoDBService] Connected successfully to database "${this.dbName}".`);

      // Ensure indexes on default citizen collections
      await this.ensureIndexesForCollection('ben_agent_events');
      await this.ensureIndexesForCollection('julie_agent_events');
      await this.ensureIndexesForCollection('agent_events');

      return true;
    } catch (err: any) {
      console.warn(`[MongoDBService] MongoDB connection failed: ${err?.message || err}. Logging will proceed asynchronously without blocking simulation.`);
      this.isConnected = false;
      this.isConnecting = false;
      this.client = null;
      this.db = null;
      return false;
    }
  }

  public async ensureIndexesForCollection(collectionName: string): Promise<void> {
    if (!this.db || this.indexedCollections.has(collectionName)) return;
    try {
      const col = this.db.collection<AgentEvent>(collectionName);
      await col.createIndex({ agent_id: 1, timestamp: -1 });
      await col.createIndex({ event_type: 1, timestamp: -1 });
      await col.createIndex({ tool_name: 1, timestamp: -1 });
      await col.createIndex({ target_agent: 1, timestamp: -1 });
      await col.createIndex({ 'metadata.conversation_id': 1 });
      this.indexedCollections.add(collectionName);
      console.log(`[MongoDBService] Verified indexes for collection "${collectionName}".`);
    } catch (err: any) {
      console.warn(`[MongoDBService] Index creation failed for "${collectionName}":`, err?.message || err);
    }
  }

  public async getCollection(agentId?: string): Promise<Collection<AgentEvent> | null> {
    if (!this.isConnected || !this.db) {
      const connected = await this.connect();
      if (!connected || !this.db) return null;
    }
    const colName = this.getCollectionNameForAgent(agentId);
    await this.ensureIndexesForCollection(colName);
    return this.db.collection<AgentEvent>(colName);
  }

  public async insertEvent(event: AgentEvent): Promise<boolean> {
    const col = await this.getCollection(event.agent_id);
    if (!col) return false;

    try {
      const docToInsert: AgentEvent = {
        ...event,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      };
      await col.insertOne(docToInsert as any);
      return true;
    } catch (err: any) {
      console.warn(`[MongoDBService] Failed to insert event into "${this.getCollectionNameForAgent(event.agent_id)}":`, err?.message || err);
      this.isConnected = false;
      return false;
    }
  }

  public async getAgentTimeline(
    agentId: string,
    options?: { limit?: number; type?: string; event_type?: string }
  ): Promise<AgentEvent[]> {
    const col = await this.getCollection(agentId);
    if (!col) return [];

    try {
      const query: Record<string, any> = { agent_id: agentId };
      const eventType = options?.type || options?.event_type;
      if (eventType) {
        query.event_type = eventType;
      }

      const limit = options?.limit && options.limit > 0 ? options.limit : 100;
      const docs = await col
        .find(query)
        .sort({ timestamp: 1 })
        .limit(limit)
        .toArray();

      return docs as AgentEvent[];
    } catch (err: any) {
      console.warn(`[MongoDBService] Failed to fetch timeline for agent "${agentId}":`, err?.message || err);
      return [];
    }
  }

  public async getConversationEvents(conversationId: string): Promise<AgentEvent[]> {
    if (!this.isConnected || !this.db) {
      const reconnected = await this.connect();
      if (!reconnected || !this.db) {
        return [];
      }
    }

    try {
      const collectionNames = ['ben_agent_events', 'julie_agent_events', 'agent_events'];
      const results = await Promise.all(
        collectionNames.map(async (name) => {
          try {
            const col = this.db!.collection<AgentEvent>(name);
            return await col.find({ 'metadata.conversation_id': conversationId }).toArray();
          } catch {
            return [];
          }
        })
      );

      const allDocs = results.flat();
      allDocs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return allDocs as AgentEvent[];
    } catch (err: any) {
      console.warn('[MongoDBService] Failed to fetch conversation events:', err?.message || err);
      return [];
    }
  }

  public async getHealthStatus(): Promise<{
    connected: boolean;
    dbName: string;
    collections: Record<string, number>;
    total_count: number;
  }> {
    if (!this.isConnected || !this.db) {
      await this.connect();
    }
    const connected = this.isConnected;
    const collections: Record<string, number> = {};
    let total_count = 0;

    if (connected && this.db) {
      const colNames = ['ben_agent_events', 'julie_agent_events', 'agent_events'];
      for (const name of colNames) {
        try {
          const col = this.db.collection(name);
          const count = await col.countDocuments();
          collections[name] = count;
          total_count += count;
        } catch {
          collections[name] = 0;
        }
      }
    }

    return {
      connected,
      dbName: this.dbName,
      collections,
      total_count,
    };
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      this.indexedCollections.clear();
    }
  }
}

export const mongoDBService = MongoDBService.getInstance();
