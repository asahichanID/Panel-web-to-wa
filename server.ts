import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { StorageService } from './server/services/storageService.js';
import { BotRunnerService } from './server/services/botRunner.js';
import { PanelManagerService } from './server/services/panelManager.js';
import { createApiRouter } from './server/routes/api.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const HOST = '0.0.0.0';

  // Global CORS & preflight handler to prevent 405 on OPTIONS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Support JSON and large payloads for file upload (up to 150MB)
  app.use(express.json({ limit: '150mb' }));
  app.use(express.urlencoded({ extended: true, limit: '150mb' }));

  // Handle body parser errors gracefully as JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === 'entity.too.large' || err.status === 413)) {
      return res.status(413).json({
        error: 'Ukuran file terlalu besar (melebihi batas 150MB). Silakan kompresi file atau unggah secara terpisah.',
      });
    }
    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        error: 'Payload JSON tidak valid.',
      });
    }
    next(err);
  });

  // Initialize core services
  const storage = new StorageService();
  await storage.init();

  const runner = new BotRunnerService(storage);
  await runner.init();

  const panelManager = new PanelManagerService();
  await panelManager.init();

  // Keep active panel status in sync with bot runner telemetry
  runner.on('status-update', (t) => {
    panelManager.syncActivePanelStatus(t.status, t.pid, t.uptimeSeconds);
  });

  const httpServer = http.createServer(app);

  // Mount API routes FIRST
  app.use('/api', createApiRouter(runner, storage, panelManager));

  // Health check route
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BY SHIRO ANNA Bot Panel',
      botStatus: runner.getTelemetry().status,
      timestamp: new Date().toISOString(),
    });
  });

  // Determine production environment reliably in ESM and bundled CommonJS
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    (typeof __filename !== 'undefined' && __filename.includes('dist'));

  if (!isProduction) {
    // Dynamic import prevents vite from being required in production builds
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets built in dist/
    app.use(express.static(distPath));

    // Express 4 & 5 compatible SPA fallback
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(distPath, 'index.html'));
      }
      next();
    });
  }

  httpServer.listen(PORT, HOST, () => {
    console.log(`[BY SHIRO ANNA] Bot Panel running on http://${HOST}:${PORT}`);
    console.log(`[BY SHIRO ANNA] Bot Project Root: ${storage.projectRoot}`);
  });
}

startServer().catch((err) => {
  console.error('[BY SHIRO ANNA] Fatal startup error:', err);
  process.exit(1);
});
