import fs from 'fs';
import path from 'path';
import { PanelModel, PanelNodeCategory, BotStatus } from '../types.js';

export const PRESET_NODES = [
  // Minecraft Servers
  {
    type: 'mc-paper',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Java - Paper',
    description: 'High-performance Spigot/Bukkit drop-in replacement with async chunks & exploit fixes',
    defaultSoftware: 'PaperSpigot Core',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar server.jar --nogui',
    defaultPort: 25565,
    defaultRam: 2048,
    defaultRom: 10240,
    defaultCpu: 200,
  },
  {
    type: 'mc-purpur',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Java - Purpur',
    description: 'Ultra optimized fork of Paper designed for incredible performance and fun gameplay settings',
    defaultSoftware: 'Purpur Java Engine',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar purpur.jar --nogui',
    defaultPort: 25565,
    defaultRam: 3072,
    defaultRom: 10240,
    defaultCpu: 200,
  },
  {
    type: 'mc-spigot',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Java - Spigot',
    description: 'Standard classic Bukkit/Spigot server for legacy and modern plugins',
    defaultSoftware: 'Spigot Server Core',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar spigot.jar --nogui',
    defaultPort: 25565,
    defaultRam: 2048,
    defaultRom: 8192,
    defaultCpu: 150,
  },
  {
    type: 'mc-bedrock',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Bedrock - Dedicated (BDS)',
    description: 'Official Minecraft Bedrock Dedicated Server for iOS, Android, and Windows 10/11',
    defaultSoftware: 'Mojang Bedrock BDS',
    defaultCommand: './bedrock_server',
    defaultPort: 19132,
    defaultRam: 2048,
    defaultRom: 5120,
    defaultCpu: 150,
  },
  {
    type: 'mc-pocketmine',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Bedrock - PocketMine-MP',
    description: 'Lightweight PHP-based server for Minecraft: Bedrock Edition with custom plugins',
    defaultSoftware: 'PocketMine-MP Engine',
    defaultCommand: 'bin/php7/bin/php PocketMine-MP.phar --no-wizard',
    defaultPort: 19132,
    defaultRam: 1024,
    defaultRom: 4096,
    defaultCpu: 100,
  },
  {
    type: 'mc-fabric',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Java - Fabric',
    description: 'Lightweight, modular modding toolchain for Minecraft Java with community mods',
    defaultSoftware: 'Fabric Modded Core',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar fabric-server-launch.jar nogui',
    defaultPort: 25565,
    defaultRam: 4096,
    defaultRom: 15360,
    defaultCpu: 300,
  },
  {
    type: 'mc-forge',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Java - Forge',
    description: 'Comprehensive modding ecosystem for Minecraft Java modpacks',
    defaultSoftware: 'Forge Modded Server',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar run.jar nogui',
    defaultPort: 25565,
    defaultRam: 4096,
    defaultRom: 20480,
    defaultCpu: 300,
  },
  {
    type: 'mc-velocity',
    category: 'minecraft' as PanelNodeCategory,
    name: 'Minecraft Proxy - Velocity / Bungee',
    description: 'Next-generation high-performance Minecraft proxy linking multiple servers together',
    defaultSoftware: 'Velocity Modern Proxy',
    defaultCommand: 'java -Xms128M -Xmx{{RAM}}M -jar velocity.jar',
    defaultPort: 25577,
    defaultRam: 1024,
    defaultRom: 2048,
    defaultCpu: 100,
  },

  // Node.js
  {
    type: 'nodejs-22',
    category: 'nodejs' as PanelNodeCategory,
    name: 'Node.js 22 LTS (Current)',
    description: 'Modern V8 JavaScript/TypeScript runtime with native WebSocket and top performance',
    defaultSoftware: 'Express / Fastify / Node App',
    defaultCommand: 'npm start',
    defaultPort: 8085,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },
  {
    type: 'nodejs-20',
    category: 'nodejs' as PanelNodeCategory,
    name: 'Node.js 20 LTS (Active)',
    description: 'Enterprise LTS standard for scalable web apps, discord/telegram bots, and APIs',
    defaultSoftware: 'Express Web Engine',
    defaultCommand: 'npm start',
    defaultPort: 8085,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },
  {
    type: 'nodejs-18',
    category: 'nodejs' as PanelNodeCategory,
    name: 'Node.js 18 LTS',
    description: 'Long-term maintenance release for legacy compatibility',
    defaultSoftware: 'Node.js Daemon',
    defaultCommand: 'npm start',
    defaultPort: 8085,
    defaultRam: 1024,
    defaultRom: 4096,
    defaultCpu: 100,
  },

  // Python
  {
    type: 'python-312',
    category: 'python' as PanelNodeCategory,
    name: 'Python 3.12 (High Performance)',
    description: 'High-speed Python runtime with improved async, suitable for AI, bots & REST APIs',
    defaultSoftware: 'FastAPI / Uvicorn ASGI',
    defaultCommand: 'python3 main.py',
    defaultPort: 8000,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },
  {
    type: 'python-311',
    category: 'python' as PanelNodeCategory,
    name: 'Python 3.11',
    description: 'Standard enterprise Python server with rich scientific and web libraries',
    defaultSoftware: 'Flask / Gunicorn WSGI',
    defaultCommand: 'python3 app.py',
    defaultPort: 5000,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },

  // Other Runtimes
  {
    type: 'bun-runtime',
    category: 'runtimes' as PanelNodeCategory,
    name: 'Bun Runtime',
    description: 'All-in-one ultra-fast JavaScript/TypeScript runtime & package manager',
    defaultSoftware: 'Bun Native HTTP',
    defaultCommand: 'bun run start',
    defaultPort: 3000,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },
  {
    type: 'golang',
    category: 'runtimes' as PanelNodeCategory,
    name: 'Golang 1.22',
    description: 'Compiled concurrent Go microservices with low memory footprint',
    defaultSoftware: 'Go Gin / Fiber Server',
    defaultCommand: './server',
    defaultPort: 8080,
    defaultRam: 512,
    defaultRom: 2048,
    defaultCpu: 100,
  },
  {
    type: 'rust',
    category: 'runtimes' as PanelNodeCategory,
    name: 'Rust Native Engine',
    description: 'Blazing fast, memory-safe compiled binary server (Actix-web / Axum)',
    defaultSoftware: 'Rust Axum Binary',
    defaultCommand: './target/release/app',
    defaultPort: 8080,
    defaultRam: 512,
    defaultRom: 4096,
    defaultCpu: 100,
  },
  {
    type: 'java-openjdk21',
    category: 'runtimes' as PanelNodeCategory,
    name: 'Java 21 OpenJDK',
    description: 'Modern LTS Java Virtual Machine for enterprise services and Spring Boot',
    defaultSoftware: 'Spring Boot JAR',
    defaultCommand: 'java -jar app.jar',
    defaultPort: 8080,
    defaultRam: 2048,
    defaultRom: 8192,
    defaultCpu: 150,
  },
  {
    type: 'generic-shell',
    category: 'custom' as PanelNodeCategory,
    name: 'Custom Linux / Shell Daemon',
    description: 'Custom script runner or executable binary with full terminal access',
    defaultSoftware: 'Custom Process',
    defaultCommand: 'bash start.sh',
    defaultPort: 8085,
    defaultRam: 1024,
    defaultRom: 5120,
    defaultCpu: 100,
  },
];

export class PanelManagerService {
  private panelsPath: string;
  private activePanelPath: string;
  private panels: PanelModel[] = [];
  private activePanelId: string = 'panel-main';

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    this.panelsPath = path.join(dataDir, 'panels.json');
    this.activePanelPath = path.join(dataDir, 'active-panel.txt');
  }

  public async init(): Promise<void> {
    const dataDir = path.dirname(this.panelsPath);
    if (!fs.existsSync(dataDir)) {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }

    if (fs.existsSync(this.panelsPath)) {
      try {
        const raw = await fs.promises.readFile(this.panelsPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.panels = parsed;
        }
      } catch (err) {
        console.error('[PANEL MANAGER] Error reading panels.json, creating initial panel', err);
      }
    }

    if (this.panels.length === 0) {
      // Seed default main panel
      const defaultPanel: PanelModel = {
        id: 'panel-main',
        name: 'Main Bot Server',
        nodeType: 'nodejs-22',
        nodeCategory: 'nodejs',
        nodeDisplayName: 'Node.js 22 LTS',
        serverSoftware: 'Express Web Server',
        ramMb: 1024,
        diskRomMb: 5120,
        cpuPercent: 100,
        port: 8085,
        startupCommand: 'npm start',
        status: 'stopped',
        pid: null,
        uptimeSeconds: 0,
        createdAt: new Date().toISOString(),
      };
      this.panels.push(defaultPanel);
      await this.persist();
    }

    if (fs.existsSync(this.activePanelPath)) {
      try {
        const savedId = (await fs.promises.readFile(this.activePanelPath, 'utf-8')).trim();
        if (this.panels.some((p) => p.id === savedId)) {
          this.activePanelId = savedId;
        }
      } catch {}
    } else {
      this.activePanelId = this.panels[0].id;
      await this.saveActivePanelId(this.activePanelId);
    }
  }

  private async persist(): Promise<void> {
    try {
      const dataDir = path.dirname(this.panelsPath);
      if (!fs.existsSync(dataDir)) {
        await fs.promises.mkdir(dataDir, { recursive: true });
      }
      await fs.promises.writeFile(this.panelsPath, JSON.stringify(this.panels, null, 2), 'utf-8');
    } catch (err) {
      console.error('[PANEL MANAGER] Failed to save panels.json', err);
    }
  }

  public getAllPanels(): PanelModel[] {
    return [...this.panels];
  }

  public getPanel(id: string): PanelModel | null {
    return this.panels.find((p) => p.id === id) || null;
  }

  public getActivePanelId(): string {
    return this.activePanelId;
  }

  public getActivePanel(): PanelModel {
    const found = this.panels.find((p) => p.id === this.activePanelId);
    return found || this.panels[0];
  }

  public async setActivePanelId(id: string): Promise<PanelModel | null> {
    const found = this.panels.find((p) => p.id === id);
    if (!found) return null;
    this.activePanelId = id;
    await this.saveActivePanelId(id);
    return found;
  }

  private async saveActivePanelId(id: string): Promise<void> {
    try {
      await fs.promises.writeFile(this.activePanelPath, id, 'utf-8');
    } catch {}
  }

  public async createPanel(data: {
    name: string;
    nodeType: string;
    serverSoftware?: string;
    ramMb: number;
    diskRomMb: number;
    cpuPercent: number;
    port?: number;
    startupCommand?: string;
  }): Promise<PanelModel> {
    const preset = PRESET_NODES.find((n) => n.type === data.nodeType) || PRESET_NODES[0];
    
    const ram = Math.max(128, data.ramMb || preset.defaultRam);
    const rom = Math.max(256, data.diskRomMb || preset.defaultRom);
    const cpu = Math.max(10, data.cpuPercent || preset.defaultCpu);
    const port = data.port || preset.defaultPort;

    let command = data.startupCommand?.trim() || preset.defaultCommand;
    command = command.replace(/{{RAM}}/g, String(ram));

    const id = `panel-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newPanel: PanelModel = {
      id,
      name: data.name?.trim() || `Server ${this.panels.length + 1}`,
      nodeType: preset.type,
      nodeCategory: preset.category,
      nodeDisplayName: preset.name,
      serverSoftware: data.serverSoftware?.trim() || preset.defaultSoftware,
      ramMb: ram,
      diskRomMb: rom,
      cpuPercent: cpu,
      port,
      startupCommand: command,
      status: 'stopped',
      pid: null,
      uptimeSeconds: 0,
      createdAt: new Date().toISOString(),
    };

    this.panels.push(newPanel);
    await this.persist();
    await this.setActivePanelId(newPanel.id);
    return newPanel;
  }

  public async updatePanel(id: string, updates: Partial<PanelModel>): Promise<PanelModel | null> {
    const idx = this.panels.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    let updatedNodeDisplayName = this.panels[idx].nodeDisplayName;
    let updatedNodeCategory = this.panels[idx].nodeCategory;

    if (updates.nodeType && updates.nodeType !== this.panels[idx].nodeType) {
      const preset = PRESET_NODES.find((n) => n.type === updates.nodeType);
      if (preset) {
        updatedNodeDisplayName = preset.name;
        updatedNodeCategory = preset.category;
      }
    }

    this.panels[idx] = {
      ...this.panels[idx],
      ...updates,
      nodeDisplayName: updatedNodeDisplayName,
      nodeCategory: updatedNodeCategory,
    };

    await this.persist();
    return this.panels[idx];
  }

  public async deletePanel(id: string): Promise<boolean> {
    if (this.panels.length <= 1) {
      throw new Error('Tidak dapat menghapus panel terakhir. Minimal harus ada 1 panel di sistem.');
    }
    const idx = this.panels.findIndex((p) => p.id === id);
    if (idx === -1) return false;

    this.panels.splice(idx, 1);
    if (this.activePanelId === id) {
      this.activePanelId = this.panels[0].id;
      await this.saveActivePanelId(this.activePanelId);
    }
    await this.persist();
    return true;
  }

  public syncActivePanelStatus(status: BotStatus, pid: number | null, uptimeSeconds: number): void {
    const current = this.panels.find((p) => p.id === this.activePanelId);
    if (current) {
      current.status = status;
      current.pid = pid;
      current.uptimeSeconds = uptimeSeconds;
    }
  }
}
