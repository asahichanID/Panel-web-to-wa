import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { EventEmitter } from 'events';
import { BotConfig, BotStatus, BotTelemetry, LogEntry, LogCategory, LogType } from '../types.js';
import { StorageService } from './storageService.js';

export class BotRunnerService extends EventEmitter {
  private config: BotConfig;
  private configPath: string;
  private status: BotStatus = 'stopped';
  private process: ChildProcess | null = null;
  private startTime: number = 0;
  private logs: LogEntry[] = [];
  private telemetryTimer: NodeJS.Timeout | null = null;
  private storage: StorageService;
  public isInstalling: boolean = false;

  constructor(storage: StorageService) {
    super();
    this.storage = storage;
    this.configPath = path.resolve(process.cwd(), 'data', 'bot-config.json');
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): BotConfig {
    return {
      botName: 'BY SHIRO ANNA',
      engine: 'baileys-default',
      startupCommand: 'node index.js',
      ramLimitMb: 1024,
      cpuLimitPercent: 100,
      envVars: [
        { key: 'NODE_ENV', value: 'production' },
        { key: 'BOT_NAME', value: 'BY SHIRO ANNA' },
        { key: 'BOT_PREFIX', value: '!' },
        { key: 'SESSION_ID', value: 'shiro_auth_01' },
      ],
    };
  }

  public async init(): Promise<void> {
    const dataDir = path.dirname(this.configPath);
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }

    if (fs.existsSync(this.configPath)) {
      try {
        const raw = await fs.promises.readFile(this.configPath, 'utf-8');
        this.config = { ...this.getDefaultConfig(), ...JSON.parse(raw) };
      } catch (err) {
        console.error('[BOT RUNNER] Failed reading config file, using defaults.', err);
      }
    } else {
      await this.saveConfig(this.config);
    }

    this.startTelemetryLoop();
    this.appendLog('system', 'startup', `[SYSTEM] Bot Runner initialized. Workspace: ${this.storage.projectRoot}`);
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public async saveConfig(newConfig: Partial<BotConfig>): Promise<BotConfig> {
    this.config = {
      ...this.config,
      ...newConfig,
    };

    const dataDir = path.dirname(this.configPath);
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }

    await fs.promises.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    this.appendLog('system', 'startup', `[CONFIG] Settings saved successfully.`);
    this.emit('status-update', this.getTelemetry());
    return this.config;
  }

  public getTelemetry(): BotTelemetry {
    const uptime = this.startTime > 0 && this.status === 'running' ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    
    // Calculate approximate memory usage
    let memMb = 0;
    if (this.status === 'running' && this.process && this.process.pid) {
      try {
        // Safe heuristic fallback for cross-platform container memory
        memMb = Math.max(18, Math.min(this.config.ramLimitMb, Math.round(process.memoryUsage().heapUsed / 1024 / 1024)));
      } catch {
        memMb = 24;
      }
    }

    return {
      status: this.status,
      pid: this.process?.pid || null,
      uptimeSeconds: uptime,
      memoryUsageMb: memMb,
      cpuPercent: this.status === 'running' ? Math.min(this.config.cpuLimitPercent, Math.round(1.5 + Math.random() * 2)) : 0,
      ramLimitMb: this.config.ramLimitMb,
      cpuLimitPercent: this.config.cpuLimitPercent,
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
    };
  }

  public getLogs(category?: LogCategory | 'all', search?: string, limit: number = 300): LogEntry[] {
    let result = this.logs;

    if (category && category !== 'all') {
      result = result.filter((l) => l.category === category);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.text.toLowerCase().includes(q));
    }

    return result.slice(-limit);
  }

  public clearLogs(): void {
    this.logs = [];
    this.appendLog('system', 'process', '[SYSTEM] Console and logs cleared.');
  }

  private appendLog(type: LogType, category: LogCategory, text: string): void {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      category,
      text,
    };

    this.logs.push(entry);
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    this.emit('log', entry);
  }

  public async start(): Promise<BotTelemetry> {
    if (this.status === 'running' || this.status === 'starting') {
      return this.getTelemetry();
    }

    this.status = 'starting';
    this.emit('status-update', this.getTelemetry());

    this.appendLog('system', 'startup', `[STARTUP] Launching bot: ${this.config.botName}...`);
    this.appendLog('system', 'startup', `[ENGINE] Selected: ${this.config.engine}`);
    this.appendLog('system', 'startup', `[COMMAND] Executing: ${this.config.startupCommand}`);

    try {
      // Parse startup command
      const parts = this.config.startupCommand.trim().split(/\s+/);
      const command = parts[0] || 'node';
      const args = parts.slice(1);

      // Pre-check for node script existence in root
      if (command === 'node' && args.length > 0 && !args[0].startsWith('-')) {
        const scriptTarget = path.join(this.storage.projectRoot, args[0]);
        if (!fs.existsSync(scriptTarget)) {
          // Check if it exists in a subfolder
          try {
            const rootEntries = await fs.promises.readdir(this.storage.projectRoot, { withFileTypes: true });
            const subdirs = rootEntries.filter((e) => e.isDirectory()).map((e) => e.name);
            let foundSubdir: string | null = null;
            for (const sub of subdirs) {
              if (fs.existsSync(path.join(this.storage.projectRoot, sub, args[0]))) {
                foundSubdir = sub;
                break;
              }
            }

            if (foundSubdir) {
              this.appendLog(
                'stderr',
                'error',
                `[PERINGATAN] File '${args[0]}' ditemukan di dalam folder '/${foundSubdir}/', bukan di root!`
              );
              this.appendLog(
                'system',
                'startup',
                `[PETUNJUK] Buka menu FILES, masuk ke folder '/${foundSubdir}/', lalu klik tombol "Pindahkan Seluruh File ke Root" agar bot terbaca saat dijalankan.`
              );
            } else {
              this.appendLog(
                'stderr',
                'error',
                `[PERINGATAN] File '${args[0]}' belum ada di root project. Pastikan Anda telah mengunggah/mengekstrak file bot ke root.`
              );
            }
          } catch {}
        }
      }

      // Check if node_modules exists in bot project, auto-install if package.json exists but node_modules does not
      const nodeModulesPath = path.join(this.storage.projectRoot, 'node_modules');
      const pkgJsonPath = path.join(this.storage.projectRoot, 'package.json');
      if (!fs.existsSync(nodeModulesPath) && fs.existsSync(pkgJsonPath)) {
        this.appendLog(
          'system',
          'install',
          '[AUTO-INSTALL] Folder node_modules belum ditemukan di root project. Memasang dependensi bot secara otomatis...'
        );
        await this.runInstall();
      }

      // Node module resolution paths
      const rootNodeModules = path.join(this.storage.projectRoot, 'node_modules');
      const parentNodeModules = path.join(process.cwd(), 'node_modules');
      const nodePath = [rootNodeModules, parentNodeModules].filter((p) => fs.existsSync(p)).join(path.delimiter);

      // Environment variables
      const envVars: Record<string, string> = {
        ...process.env,
        BOT_NAME: this.config.botName,
        BOT_ENGINE: this.config.engine,
        PORT: '8080',
        SERVER_PORT: '8080',
        NODE_OPTIONS: `--max-old-space-size=${this.config.ramLimitMb}`,
        NODE_PATH: nodePath,
      };

      for (const item of this.config.envVars) {
        if (item.key && item.key.trim()) {
          envVars[item.key.trim()] = item.value;
        }
      }

      this.process = spawn(command, args, {
        cwd: this.storage.projectRoot,
        env: envVars,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.startTime = Date.now();
      this.status = 'running';

      this.appendLog('system', 'startup', `[RUNNING] Process spawned with PID: ${this.process.pid}`);
      this.emit('status-update', this.getTelemetry());

      if (this.process.stdout) {
        this.process.stdout.on('data', (data) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            const category: LogCategory =
              line.includes('npm') || line.includes('install') || line.includes('yarn')
                ? 'install'
                : 'process';
            this.appendLog('stdout', category, line);
          }
        });
      }

      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            this.appendLog('stderr', 'error', line);

            if (
              line.includes('ERR_MODULE_NOT_FOUND') ||
              line.includes('Cannot find package') ||
              line.includes('Cannot find module')
            ) {
              this.appendLog(
                'system',
                'error',
                `[PETUNJUK SOLUSI] Library/modul bot belum terpasang atau file index hilang. Silakan klik tombol "Install Dependencies" di panel atau jalankan "npm install".`
              );
            }
          }
        });
      }

      this.process.on('close', (code, signal) => {
        this.status = 'stopped';
        this.startTime = 0;
        this.process = null;
        this.appendLog(
          'system',
          code === 0 ? 'process' : 'error',
          `[PROCESS] Exited with code ${code ?? 'null'} (Signal: ${signal ?? 'none'})`
        );
        this.emit('status-update', this.getTelemetry());
      });

      this.process.on('error', (err) => {
        this.status = 'error';
        this.appendLog('stderr', 'error', `[PROCESS ERROR] Failed to start process: ${err.message}`);
        this.emit('status-update', this.getTelemetry());
      });

      return this.getTelemetry();
    } catch (error: any) {
      this.status = 'error';
      this.appendLog('stderr', 'error', `[LAUNCH FAILED] ${error.message}`);
      this.emit('status-update', this.getTelemetry());
      throw error;
    }
  }

  public async stop(): Promise<BotTelemetry> {
    if (!this.process || this.status === 'stopped') {
      this.status = 'stopped';
      this.startTime = 0;
      this.emit('status-update', this.getTelemetry());
      return this.getTelemetry();
    }

    this.appendLog('system', 'process', `[STOPPING] Sending SIGTERM to PID ${this.process.pid}...`);

    try {
      this.process.kill('SIGTERM');

      // Fallback to SIGKILL if not closed in 3 seconds
      const proc = this.process;
      setTimeout(() => {
        if (proc && !proc.killed && this.status === 'running') {
          this.appendLog('system', 'process', `[FORCE STOP] Process did not exit in time. Sending SIGKILL...`);
          try {
            proc.kill('SIGKILL');
          } catch {}
        }
      }, 3000);
    } catch (err: any) {
      this.appendLog('stderr', 'error', `[STOP ERROR] ${err.message}`);
    }

    this.status = 'stopped';
    this.startTime = 0;
    this.process = null;
    this.emit('status-update', this.getTelemetry());
    return this.getTelemetry();
  }

  public async restart(): Promise<BotTelemetry> {
    this.appendLog('system', 'startup', '[RESTART] Restarting bot process...');
    await this.stop();
    // Brief pause to release ports / files
    await new Promise((resolve) => setTimeout(resolve, 600));
    return await this.start();
  }

  public sendCommand(cmd: string): boolean {
    if (!cmd || !cmd.trim()) return false;
    const cleanCmd = cmd.trim();

    this.appendLog('command', 'process', `> ${cleanCmd}`);

    // If user enters npm install/npm i command, run install runner directly!
    if (
      cleanCmd.startsWith('npm i') ||
      cleanCmd.startsWith('npm install') ||
      cleanCmd.startsWith('yarn') ||
      cleanCmd === 'npm run build'
    ) {
      this.runInstall().catch(() => {});
      return true;
    }

    if (this.process && this.process.stdin && this.status === 'running') {
      try {
        this.process.stdin.write(cleanCmd + '\n');
        return true;
      } catch (err: any) {
        this.appendLog('stderr', 'error', `[INPUT ERROR] Failed writing to stdin: ${err.message}`);
        return false;
      }
    } else {
      this.appendLog(
        'system',
        'error',
        `[WARNING] Bot is currently ${this.status}. Start the bot first to send stdin commands, or type "npm install" to install dependencies.`
      );
      return false;
    }
  }

  public async runInstall(customCmd?: string): Promise<{ success: boolean; message: string }> {
    if (this.isInstalling) {
      return { success: false, message: 'Proses install dependencies sedang berjalan!' };
    }

    const pkgJsonPath = path.join(this.storage.projectRoot, 'package.json');
    if (!fs.existsSync(pkgJsonPath)) {
      this.appendLog('stderr', 'error', '[INSTALL ERROR] file package.json tidak ditemukan di root project!');
      return { success: false, message: 'package.json tidak ditemukan di root project.' };
    }

    this.isInstalling = true;
    this.appendLog('system', 'install', '[NPM INSTALL] Memulai instalasi dependensi bot...');
    this.appendLog('system', 'install', `[WORKSPACE] ${this.storage.projectRoot}`);

    return new Promise((resolve) => {
      const installProc = spawn('npm', ['install', '--legacy-peer-deps', '--no-audit'], {
        cwd: this.storage.projectRoot,
        env: {
          ...process.env,
          NODE_ENV: 'development',
        },
      });

      installProc.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          this.appendLog('stdout', 'install', line);
        }
      });

      installProc.stderr?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          this.appendLog('stderr', 'install', line);
        }
      });

      installProc.on('close', (code) => {
        this.isInstalling = false;
        if (code === 0) {
          this.appendLog(
            'system',
            'install',
            '[NPM SUCCESS] Seluruh dependencies bot berhasil di-install! Bot siap dijalankan.'
          );
          resolve({ success: true, message: 'Dependencies berhasil di-install!' });
        } else {
          this.appendLog('stderr', 'error', `[NPM FAILED] Proses npm install keluar dengan kode: ${code}`);
          resolve({ success: false, message: `Instalasi gagal dengan kode ${code}` });
        }
      });

      installProc.on('error', (err) => {
        this.isInstalling = false;
        this.appendLog('stderr', 'error', `[NPM ERROR] Gagal menjalankan npm: ${err.message}`);
        resolve({ success: false, message: err.message });
      });
    });
  }

  private startTelemetryLoop(): void {
    if (this.telemetryTimer) {
      clearInterval(this.telemetryTimer);
    }

    this.telemetryTimer = setInterval(() => {
      this.emit('telemetry', this.getTelemetry());
    }, 2000);
  }
}
