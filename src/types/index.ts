export type BotStatus = 'running' | 'stopped' | 'starting' | 'error';

export type BotEngineType = 'baileys-default' | 'custom-baileys' | 'custom-node';

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface BotConfig {
  botName: string;
  engine: BotEngineType;
  startupCommand: string;
  ramLimitMb: number;
  cpuLimitPercent: number;
  envVars: EnvironmentVariable[];
  botNumber?: string;
  pairingMode?: 'pairing-code' | 'qr';
  prefix?: string;
  skipInstallDeps?: boolean;
  customDependencies?: string;
  autoRestart?: boolean;
  isInitialized?: boolean;
}

export interface BotTelemetry {
  status: BotStatus;
  pid: number | null;
  uptimeSeconds: number;
  memoryUsageMb: number;
  cpuPercent: number;
  ramLimitMb: number;
  cpuLimitPercent: number;
  nodeVersion: string;
  platform: string;
}

export type LogCategory = 'startup' | 'install' | 'error' | 'process';
export type LogType = 'stdout' | 'stderr' | 'system' | 'command';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogType;
  category: LogCategory;
  text: string;
}

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export type PanelNodeCategory = 'minecraft' | 'nodejs' | 'python' | 'runtimes' | 'custom';

export interface PanelModel {
  id: string;
  name: string;
  nodeType: string;
  nodeCategory: PanelNodeCategory;
  nodeDisplayName: string;
  serverSoftware: string;
  ramMb: number;
  diskRomMb: number;
  cpuPercent: number;
  port: number;
  startupCommand: string;
  status: BotStatus;
  pid: number | null;
  uptimeSeconds: number;
  createdAt: string;
  envVars?: EnvironmentVariable[];
}

export interface PresetNode {
  type: string;
  category: PanelNodeCategory;
  name: string;
  description: string;
  defaultSoftware: string;
  defaultCommand: string;
  defaultPort: number;
  defaultRam: number;
  defaultRom: number;
  defaultCpu: number;
}

export type ActiveTab = 'dashboard' | 'files' | 'console' | 'logs' | 'settings';
