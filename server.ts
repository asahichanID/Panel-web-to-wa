import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { StorageService } from './server/services/storageService.js';
import { BotRunnerService } from './server/services/botRunner.js';
import { PanelManagerService } from './server/services/panelManager.js';
import { createApiRouter } from './server/routes/api.js';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const HOST = '0.0.0.0';

  // Support JSON and large payloads for file upload
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

  // Mount API routes
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

  // Vite dev middleware or production static
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
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
