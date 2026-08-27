import type { Plugin } from 'vite';
import { mongoDBService } from '../services/database/MongoDBService';

export function mongoApiPlugin(): Plugin {
  return {
    name: 'civigenis-mongo-api',
    configureServer(server) {
      mongoDBService.connect().catch((err) => {
        console.warn('[Vite Mongo API] Connection initialization notice:', err?.message || err);
      });

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
        const path = url.pathname;

        if (path === '/api/events' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const eventData = JSON.parse(body);
              await mongoDBService.insertEvent(eventData);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || err }));
            }
          });
          return;
        }

        if (path.startsWith('/api/agents/') && path.endsWith('/events') && req.method === 'GET') {
          const parts = path.split('/');
          const agentId = parts[3];
          const limitParam = url.searchParams.get('limit');
          const typeParam = url.searchParams.get('type') || url.searchParams.get('event_type');
          const limit = limitParam ? parseInt(limitParam, 10) : 100;

          try {
            const events = await mongoDBService.getAgentTimeline(agentId, { limit, type: typeParam || undefined });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: events.length, events }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || err }));
          }
          return;
        }

        if (path.startsWith('/api/conversations/') && req.method === 'GET') {
          const parts = path.split('/');
          const conversationId = parts[3];
          try {
            const events = await mongoDBService.getConversationEvents(conversationId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, count: events.length, events }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || err }));
          }
          return;
        }

        if (path === '/api/health/mongodb' && req.method === 'GET') {
          try {
            const status = await mongoDBService.getHealthStatus();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(status));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ connected: false, error: err?.message || err }));
          }
          return;
        }

        next();
      });
    },
  };
}
