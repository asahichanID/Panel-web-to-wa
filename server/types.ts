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
