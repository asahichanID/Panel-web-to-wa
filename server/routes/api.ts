import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { BotRunnerService } from '../services/botRunner.js';
import { StorageService } from '../services/storageService.js';
import { PanelManagerService, PRESET_NODES } from '../services/panelManager.js';
import { LogCategory } from '../types.js';

export function createApiRouter(
  runner: BotRunnerService,
  storage: StorageService,
  panelManager: PanelManagerService
): Router {
  const router = Router();

  // 0. Panels Management (Multi-panel & Create Panel)
  router.get('/panels', (req: Request, res: Response) => {
    // Keep telemetry synced
    const telemetry = runner.getTelemetry();
    panelManager.syncActivePanelStatus(telemetry.status, telemetry.pid, telemetry.uptimeSeconds);
    res.json({
      panels: panelManager.getAllPanels(),
      activePanelId: panelManager.getActivePanelId(),
      activePanel: panelManager.getActivePanel(),
    });
  });

  router.get('/panels/presets', (req: Request, res: Response) => {
    res.json(PRESET_NODES);
  });

  router.post('/panels', async (req: Request, res: Response) => {
    try {
      const { name, nodeType, serverSoftware, ramMb, diskRomMb, cpuPercent, port, startupCommand } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama panel wajib diisi' });
      }
      const newPanel = await panelManager.createPanel({
        name,
        nodeType: nodeType || 'nodejs-22',
        serverSoftware,
        ramMb: Number(ramMb) || 1024,
        diskRomMb: Number(diskRomMb) || 5120,
        cpuPercent: Number(cpuPercent) || 100,
        port: port ? Number(port) : undefined,
        startupCommand,
      });

      // Sync active runner configuration to match this new panel
      await runner.saveConfig({
        botName: newPanel.name,
        startupCommand: newPanel.startupCommand,
        ramLimitMb: newPanel.ramMb,
        cpuLimitPercent: newPanel.cpuPercent,
      });

      res.status(201).json(newPanel);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/panels/:id', (req: Request, res: Response) => {
    const panel = panelManager.getPanel(req.params.id);
    if (!panel) return res.status(404).json({ error: 'Panel tidak ditemukan' });
    res.json(panel);
  });

  router.put('/panels/:id', async (req: Request, res: Response) => {
    try {
      const updated = await panelManager.updatePanel(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Panel tidak ditemukan' });

      // If active panel is updated, sync runner
      if (panelManager.getActivePanelId() === updated.id) {
        await runner.saveConfig({
          botName: updated.name,
          startupCommand: updated.startupCommand,
          ramLimitMb: updated.ramMb,
          cpuLimitPercent: updated.cpuPercent,
        });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/panels/:id', async (req: Request, res: Response) => {
    try {
      const success = await panelManager.deletePanel(req.params.id);
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  router.post('/panels/:id/select', async (req: Request, res: Response) => {
    try {
      const selected = await panelManager.setActivePanelId(req.params.id);
      if (!selected) return res.status(404).json({ error: 'Panel tidak ditemukan' });

      // Sync runner settings to this panel
      await runner.saveConfig({
        botName: selected.name,
        startupCommand: selected.startupCommand,
        ramLimitMb: selected.ramMb,
        cpuLimitPercent: selected.cpuPercent,
      });

      res.json({ success: true, activePanel: selected });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1. Status & Telemetry
  router.get('/status', (req: Request, res: Response) => {
    res.json({
      telemetry: runner.getTelemetry(),
      config: runner.getConfig(),
    });
  });

  // 2. Power Actions (Start, Stop, Restart)
  router.post('/power', async (req: Request, res: Response) => {
    try {
      const { action } = req.body;
      let result;
      if (action === 'start') {
        result = await runner.start();
      } else if (action === 'stop') {
        result = await runner.stop();
      } else if (action === 'restart') {
        result = await runner.restart();
      } else {
        return res.status(400).json({ error: 'Action must be start, stop, or restart' });
      }
      res.json({ success: true, telemetry: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Settings & Bot Config
  router.get('/config', (req: Request, res: Response) => {
    res.json(runner.getConfig());
  });

  router.put('/config', async (req: Request, res: Response) => {
    try {
      const updated = await runner.saveConfig(req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Console & Commands
  router.get('/console', (req: Request, res: Response) => {
    res.json(runner.getLogs(undefined, undefined, 250));
  });

  router.post('/bot/install', async (req: Request, res: Response) => {
    try {
      runner.runInstall().catch(() => {});
      res.json({ success: true, message: 'Proses instalasi dependensi dimulai' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/bot/status-deps', (req: Request, res: Response) => {
    const pkgJson = fs.existsSync(path.join(storage.projectRoot, 'package.json'));
    const hasProjectNodeModules = fs.existsSync(path.join(storage.projectRoot, 'node_modules'));
    const hasParentNodeModules = fs.existsSync(path.join(process.cwd(), 'node_modules'));
    res.json({
      hasPackageJson: pkgJson,
      hasNodeModules: hasProjectNodeModules || hasParentNodeModules,
      isInstalling: runner.isInstalling,
      skipInstallDeps: runner.getConfig().skipInstallDeps !== false,
    });
  });

  router.post('/command', (req: Request, res: Response) => {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command string required' });
    }
    const sent = runner.sendCommand(command);
    res.json({ success: sent });
  });

  router.post('/console/clear', (req: Request, res: Response) => {
    runner.clearLogs();
    res.json({ success: true });
  });

  // 5. Categorized Logs
  router.get('/logs', (req: Request, res: Response) => {
    const category = (req.query.category as LogCategory | 'all') || 'all';
    const search = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 300;
    const logs = runner.getLogs(category, search, limit);
    res.json(logs);
  });

  router.post('/logs/clear', (req: Request, res: Response) => {
    runner.clearLogs();
    res.json({ success: true });
  });

  // 6. Real Filesystem
  // List files in directory
  router.get('/files', async (req: Request, res: Response) => {
    try {
      const dir = (req.query.dir as string) || '/';
      const items = await storage.listFiles(dir);
      res.json({ dir, items, root: storage.projectRoot });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Read file content
  router.get('/files/content', async (req: Request, res: Response) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: 'path parameter required' });
      const content = await storage.readFile(filePath);
      res.json({ path: filePath, content });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  });

  // Save/Edit file
  router.post('/files/save', async (req: Request, res: Response) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ error: 'path parameter required' });
      await storage.writeFile(filePath, content ?? '');
      res.json({ success: true, path: filePath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Upload file to directory
  router.post('/files/upload', async (req: Request, res: Response) => {
    try {
      const { dir = '/', filename, content, isBase64 = false } = req.body;
      if (!filename) return res.status(400).json({ error: 'filename required' });
      if (content === undefined || content === null) {
        return res.status(400).json({ error: 'content required' });
      }

      const savedPath = await storage.saveUploadedFile(dir, filename, content, isBase64);
      res.json({ success: true, path: savedPath });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download file
  router.get('/files/download', (req: Request, res: Response) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ error: 'path parameter required' });

      const resolved = storage.resolveSafe(filePath);
      if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
        return res.status(404).json({ error: 'File not found or is a directory' });
      }

      res.download(resolved, path.basename(resolved));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Create folder
  router.post('/files/folder', async (req: Request, res: Response) => {
    try {
      const { dir = '/', name } = req.body;
      if (!name) return res.status(400).json({ error: 'Folder name required' });
      const createdPath = await storage.createFolder(dir, name);
      res.json({ success: true, path: createdPath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete single file or folder
  router.delete('/files', async (req: Request, res: Response) => {
    try {
      const targetPath = req.query.path as string;
      if (!targetPath) return res.status(400).json({ error: 'path parameter required' });
      await storage.deleteItem(targetPath);
      res.json({ success: true, deleted: targetPath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Batch delete files or folders
  router.post('/files/batch-delete', async (req: Request, res: Response) => {
    try {
      const { paths } = req.body;
      if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ error: 'paths array required' });
      }
      const count = await storage.deleteMultiple(paths);
      res.json({ success: true, count, message: `${count} item berhasil dihapus` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Unarchive zip, tar, tar.gz, tgz, gz
  router.post('/files/unarchive', async (req: Request, res: Response) => {
    try {
      const { path: archivePath, destinationDir } = req.body;
      if (!archivePath) {
        return res.status(400).json({ error: 'path parameter required' });
      }

      const result = await storage.unarchive(archivePath, destinationDir);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Move selected items to destination directory
  router.post('/files/move', async (req: Request, res: Response) => {
    try {
      const { sources, destinationDir = '/' } = req.body;
      if (!Array.isArray(sources) || sources.length === 0) {
        return res.status(400).json({ error: 'sources array required' });
      }

      const result = await storage.moveItems(sources, destinationDir);
      res.json({
        success: true,
        count: result.count,
        moved: result.moved,
        message: `${result.count} item berhasil dipindahkan ke ${destinationDir}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Move all contents from a subfolder directly to root (/)
  router.post('/files/move-all-to-root', async (req: Request, res: Response) => {
    try {
      const { sourceDir, deleteSourceDirAfter = false } = req.body;
      if (!sourceDir) {
        return res.status(400).json({ error: 'sourceDir required' });
      }

      const result = await storage.moveAllFromDirectoryToRoot(sourceDir, !!deleteSourceDirAfter);
      res.json({
        success: true,
        count: result.count,
        moved: result.moved,
        message: `Seluruh isi folder (${result.count} item) berhasil dipindahkan ke root project (/).`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete all files in project root
  router.post('/files/delete-all', async (req: Request, res: Response) => {
    try {
      await storage.deleteAll();
      res.json({ success: true, message: 'All files in project root deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Realtime SSE Stream
  router.get('/realtime/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial status
    res.write(`data: ${JSON.stringify({ type: 'telemetry', data: runner.getTelemetry() })}\n\n`);

    const onLog = (log: any) => {
      res.write(`data: ${JSON.stringify({ type: 'log', data: log })}\n\n`);
    };

    const onStatus = (telemetry: any) => {
      res.write(`data: ${JSON.stringify({ type: 'telemetry', data: telemetry })}\n\n`);
    };

    runner.on('log', onLog);
    runner.on('status-update', onStatus);
    runner.on('telemetry', onStatus);

    req.on('close', () => {
      runner.off('log', onLog);
      runner.off('status-update', onStatus);
      runner.off('telemetry', onStatus);
    });
  });

  return router;
}
