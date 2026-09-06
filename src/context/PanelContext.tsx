import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  ActiveTab,
  BotConfig,
  BotTelemetry,
  FileItem,
  LogCategory,
  LogEntry,
  PanelModel,
  PresetNode,
} from '../types';
import { DEFAULT_PRESET_NODES } from '../data/presetNodes';

interface PanelContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Sub-view in Dashboard (My Panels list vs Selected Panel Detail)
  subView: 'my-panels' | 'panel-detail';
  setSubView: (view: 'my-panels' | 'panel-detail') => void;
  openPanelDetail: (panelId: string) => Promise<void>;
  backToPanels: () => void;

  // Multi-panel list and operations
  panels: PanelModel[];
  activePanel: PanelModel | null;
  activePanelId: string;
  presetNodes: PresetNode[];
  fetchPanels: () => Promise<void>;
  createPanel: (data: {
    name: string;
    nodeType: string;
    serverSoftware?: string;
    ramMb: number;
    diskRomMb: number;
    cpuPercent: number;
    port?: number;
    startupCommand?: string;
  }) => Promise<PanelModel | null>;
  updatePanel: (id: string, updates: Partial<PanelModel>) => Promise<void>;
  deletePanel: (id: string) => Promise<void>;

  // Telemetry & Power
  telemetry: BotTelemetry;
  config: BotConfig;
  isLoading: boolean;
  isPowerLoading: boolean;
  powerAction: (action: 'start' | 'stop' | 'restart') => Promise<void>;
  saveSettings: (newConfig: Partial<BotConfig>) => Promise<void>;

  // Floating Create Panel State
  isCreatePanelOpen: boolean;
  setIsCreatePanelOpen: (open: boolean) => void;
  openCreatePanel: () => void;
  closeCreatePanel: () => void;

  // Console & Terminal
  consoleLogs: LogEntry[];
  sendCommand: (cmd: string) => Promise<boolean>;
  clearConsole: () => Promise<void>;
  installDependencies: () => Promise<void>;
  isInstalling: boolean;
  depsStatus: { hasPackageJson: boolean; hasNodeModules: boolean; isInstalling: boolean };
  checkDepsStatus: () => Promise<void>;

  // Filtered Logs
  logs: LogEntry[];
  logsCategory: LogCategory | 'all';
  setLogsCategory: (cat: LogCategory | 'all') => void;
  logsSearch: string;
  setLogsSearch: (search: string) => void;
  refreshLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;

  // Filesystem
  files: FileItem[];
  currentDir: string;
  setCurrentDir: (dir: string) => void;
  projectRoot: string;
  isFilesLoading: boolean;
  fetchFiles: (dir?: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  saveFile: (path: string, content: string) => Promise<void>;
  uploadFile: (filename: string, content: string, isBase64?: boolean) => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  deleteMultipleFiles: (paths: string[]) => Promise<void>;
  deleteAllFiles: () => Promise<void>;
  downloadFile: (path: string) => void;
  unarchiveFile: (path: string, destinationDir?: string) => Promise<{ success: boolean; message: string; count: number }>;
  moveItems: (sources: string[], destinationDir: string) => Promise<void>;
  moveAllToRoot: (sourceDir: string, deleteSourceDirAfter?: boolean) => Promise<{ count: number; message: string }>;
}

const defaultTelemetry: BotTelemetry = {
  status: 'stopped',
  pid: null,
  uptimeSeconds: 0,
  memoryUsageMb: 0,
  cpuPercent: 0,
  ramLimitMb: 1024,
  cpuLimitPercent: 100,
  nodeVersion: 'v20.0.0',
  platform: 'Linux',
};

const defaultConfig: BotConfig = {
  botName: 'BY SHIRO ANNA',
  engine: 'baileys-default',
  startupCommand: 'node index.js',
  ramLimitMb: 1024,
  cpuLimitPercent: 100,
  botNumber: '',
  pairingMode: 'pairing-code',
  prefix: '!',
  skipInstallDeps: true,
  customDependencies: '',
  autoRestart: true,
  isInitialized: false,
  envVars: [
    { key: 'NODE_ENV', value: 'production' },
    { key: 'BOT_NAME', value: 'BY SHIRO ANNA' },
    { key: 'BOT_PREFIX', value: '!' },
    { key: 'SESSION_ID', value: 'shiro_auth_01' },
  ],
};

const PanelContext = createContext<PanelContextType | undefined>(undefined);

const DEFAULT_MAIN_PANEL: PanelModel = {
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
  createdAt: '2026-09-06T00:00:00.000Z',
};

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Sub-view in Dashboard: 'my-panels' (all servers list) or 'panel-detail' (inside specific server dashboard)
  const [subView, setSubView] = useState<'my-panels' | 'panel-detail'>('my-panels');
  const [panels, setPanels] = useState<PanelModel[]>([DEFAULT_MAIN_PANEL]);
  const [activePanelId, setActivePanelId] = useState<string>('panel-main');
  const [activePanel, setActivePanel] = useState<PanelModel | null>(DEFAULT_MAIN_PANEL);
  const [presetNodes, setPresetNodes] = useState<PresetNode[]>(DEFAULT_PRESET_NODES);

  // Floating Create Panel modal
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState<boolean>(false);

  const openCreatePanel = useCallback(() => {
    setIsCreatePanelOpen(true);
  }, []);

  const closeCreatePanel = useCallback(() => {
    setIsCreatePanelOpen(false);
  }, []);

  // Core state
  const [telemetry, setTelemetry] = useState<BotTelemetry>(defaultTelemetry);
  const [config, setConfig] = useState<BotConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isPowerLoading, setIsPowerLoading] = useState(false);

  // Fetch panels & presets
  const fetchPanels = useCallback(async () => {
    try {
      const res = await fetch('/api/panels');
      if (res.ok) {
        const data = await res.json();
        const list: PanelModel[] = data.panels || [];
        if (list.length > 0) {
          setPanels(list);
          if (data.activePanelId) setActivePanelId(data.activePanelId);
          if (data.activePanel) {
            setActivePanel(data.activePanel);
          } else {
            setActivePanel(list[0]);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch panels, keeping existing panel list:', err);
    }
  }, []);

  const fetchPresets = useCallback(async () => {
    try {
      const res = await fetch('/api/panels/presets');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPresetNodes(data);
        }
      }
    } catch (err) {
      console.warn('Using bundled preset nodes fallback:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPanels();
    fetchPresets();
  }, [fetchPanels, fetchPresets]);

  const openPanelDetail = useCallback(async (panelId: string) => {
    try {
      const res = await fetch(`/api/panels/${panelId}/select`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.activePanel) {
          setActivePanel(data.activePanel);
          setActivePanelId(data.activePanel.id);
        }
      }
    } catch (err) {
      console.error('Error selecting panel:', err);
    }
    setActivePanelId(panelId);
    setSubView('panel-detail');
  }, []);

  const backToPanels = useCallback(() => {
    setSubView('my-panels');
    fetchPanels();
  }, [fetchPanels]);

  const createPanel = useCallback(async (data: {
    name: string;
    nodeType: string;
    serverSoftware?: string;
    ramMb: number;
    diskRomMb: number;
    cpuPercent: number;
    port?: number;
    startupCommand?: string;
  }): Promise<PanelModel | null> => {
    try {
      const res = await fetch('/api/panels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const created: PanelModel = await res.json();
        setPanels((prev) => [...prev, created]);
        setActivePanel(created);
        setActivePanelId(created.id);
        setSubView('panel-detail');
        closeCreatePanel();
        return created;
      }
    } catch (err) {
      console.error('Failed to create panel:', err);
    }
    return null;
  }, [closeCreatePanel]);

  const updatePanel = useCallback(async (id: string, updates: Partial<PanelModel>) => {
    try {
      const res = await fetch(`/api/panels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setPanels((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (activePanelId === id) {
          setActivePanel(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update panel:', err);
    }
  }, [activePanelId]);

  const deletePanel = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/panels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchPanels();
        setSubView('my-panels');
      }
    } catch (err) {
      console.error('Failed to delete panel:', err);
    }
  }, [fetchPanels]);

  // Console and logs
  const [consoleLogs, setConsoleLogs] = useState<LogEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsCategory, setLogsCategory] = useState<LogCategory | 'all'>('all');
  const [logsSearch, setLogsSearch] = useState('');

  // Bot dependencies status
  const [isInstalling, setIsInstalling] = useState(false);
  const [depsStatus, setDepsStatus] = useState<{
    hasPackageJson: boolean;
    hasNodeModules: boolean;
    isInstalling: boolean;
  }>({
    hasPackageJson: false,
    hasNodeModules: false,
    isInstalling: false,
  });

  // Files
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentDir, setCurrentDir] = useState<string>('/');
  const [projectRoot, setProjectRoot] = useState<string>('');
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  // 1. Initial status fetch
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        if (data.telemetry) setTelemetry(data.telemetry);
        if (data.config) setConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to fetch status', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Power Actions
  const powerAction = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    setIsPowerLoading(true);
    try {
      const res = await fetch('/api/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }
    } catch (err) {
      console.error('Power action failed:', err);
    } finally {
      setIsPowerLoading(false);
    }
  }, []);

  // 3. Save Settings
  const saveSettings = useCallback(async (newConfig: Partial<BotConfig>) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        // Also update telemetry limits
        setTelemetry((prev) => ({
          ...prev,
          ramLimitMb: updated.ramLimitMb,
          cpuLimitPercent: updated.cpuLimitPercent,
        }));
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      throw err;
    }
  }, []);

  // 4. Console & Commands
  const sendCommand = useCallback(async (cmd: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Command failed', err);
      return false;
    }
  }, []);

  const clearConsole = useCallback(async () => {
    try {
      await fetch('/api/console/clear', { method: 'POST' });
      setConsoleLogs([]);
    } catch (err) {
      console.error('Clear console failed', err);
    }
  }, []);

  const checkDepsStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/status-deps');
      if (res.ok) {
        const data = await res.json();
        setDepsStatus(data);
        if (data.isInstalling !== undefined) {
          setIsInstalling(data.isInstalling);
        }
      }
    } catch (err) {
      console.error('Failed to fetch deps status', err);
    }
  }, []);

  const installDependencies = useCallback(async () => {
    setIsInstalling(true);
    try {
      const res = await fetch('/api/bot/install', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to trigger install');
      }
      setTimeout(checkDepsStatus, 1500);
    } catch (err) {
      console.error('Install dependencies failed', err);
      setIsInstalling(false);
      throw err;
    }
  }, [checkDepsStatus]);

  // 5. Logs
  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (logsCategory !== 'all') params.set('category', logsCategory);
      if (logsSearch.trim()) params.set('search', logsSearch.trim());

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  }, [logsCategory, logsSearch]);

  const clearLogs = useCallback(async () => {
    try {
      await fetch('/api/logs/clear', { method: 'POST' });
      setLogs([]);
      setConsoleLogs([]);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  }, []);

  // 6. Filesystem
  const fetchFiles = useCallback(async (dir?: string) => {
    const targetDir = dir !== undefined ? dir : currentDir;
    setIsFilesLoading(true);
    try {
      const res = await fetch(`/api/files?dir=${encodeURIComponent(targetDir)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.items || []);
        setCurrentDir(data.dir || targetDir);
        if (data.root) setProjectRoot(data.root);
      }
    } catch (err) {
      console.error('Failed to fetch files', err);
    } finally {
      setIsFilesLoading(false);
    }
  }, [currentDir]);

  const readFile = useCallback(async (filePath: string): Promise<string> => {
    const res = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to read file');
    }
    const data = await res.json();
    return data.content;
  }, []);

  const saveFile = useCallback(async (filePath: string, content: string): Promise<void> => {
    const res = await fetch('/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save file');
    }
    await fetchFiles();
  }, [fetchFiles]);

  const uploadFile = useCallback(async (filename: string, content: string, isBase64: boolean = false): Promise<void> => {
    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dir: currentDir,
        filename,
        content,
        isBase64,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload file');
    }
    await fetchFiles(currentDir);
  }, [currentDir, fetchFiles]);

  const createFolder = useCallback(async (name: string): Promise<void> => {
    const res = await fetch('/api/files/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dir: currentDir, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create folder');
    }
    await fetchFiles(currentDir);
  }, [currentDir, fetchFiles]);

  const deleteFile = useCallback(async (targetPath: string): Promise<void> => {
    const res = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete item');
    }
    await fetchFiles(currentDir);
  }, [currentDir, fetchFiles]);

  const deleteMultipleFiles = useCallback(async (paths: string[]): Promise<void> => {
    const res = await fetch('/api/files/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete selected items');
    }
    await fetchFiles(currentDir);
  }, [currentDir, fetchFiles]);

  const deleteAllFiles = useCallback(async (): Promise<void> => {
    const res = await fetch('/api/files/delete-all', {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete all files');
    }
    setCurrentDir('/');
    await fetchFiles('/');
  }, [fetchFiles]);

  const unarchiveFile = useCallback(
    async (filePath: string, destinationDir?: string): Promise<{ success: boolean; message: string; count: number }> => {
      const res = await fetch('/api/files/unarchive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, destinationDir }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unarchive file');
      }
      await fetchFiles(currentDir);
      return data;
    },
    [currentDir, fetchFiles]
  );

  const moveItems = useCallback(
    async (sources: string[], destinationDir: string): Promise<void> => {
      const res = await fetch('/api/files/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources, destinationDir }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to move items');
      }
      await fetchFiles(currentDir);
    },
    [currentDir, fetchFiles]
  );

  const moveAllToRoot = useCallback(
    async (sourceDir: string, deleteSourceDirAfter: boolean = false): Promise<{ count: number; message: string }> => {
      const res = await fetch('/api/files/move-all-to-root', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceDir, deleteSourceDirAfter }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to move all contents to root');
      }
      // If we are currently inside that sourceDir, navigate back to root
      if (currentDir === sourceDir || currentDir.startsWith(sourceDir + '/')) {
        setCurrentDir('/');
        await fetchFiles('/');
      } else {
        await fetchFiles(currentDir);
      }
      return data;
    },
    [currentDir, fetchFiles]
  );

  const downloadFile = useCallback((targetPath: string) => {
    const link = document.createElement('a');
    link.href = `/api/files/download?path=${encodeURIComponent(targetPath)}`;
    link.download = targetPath.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Realtime SSE setup
  useEffect(() => {
    refreshStatus();
    checkDepsStatus();

    const depsInterval = setInterval(checkDepsStatus, 8000);

    // Initial console fetch
    fetch('/api/console')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setConsoleLogs(data);
      })
      .catch(() => {});

    // Open SSE stream
    const sse = new EventSource('/api/realtime/stream');
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'telemetry') {
          setTelemetry((prev) => ({ ...prev, ...payload.data }));
        } else if (payload.type === 'log') {
          const newLog = payload.data as LogEntry;
          setConsoleLogs((prev) => {
            const next = [...prev, newLog];
            return next.length > 500 ? next.slice(-500) : next;
          });
          setLogs((prev) => {
            const next = [...prev, newLog];
            return next.length > 500 ? next.slice(-500) : next;
          });
        }
      } catch (err) {
        // Ignored parse errors
      }
    };

    sse.onerror = () => {
      // SSE will automatically attempt reconnection
    };

    return () => {
      sse.close();
      eventSourceRef.current = null;
    };
  }, [refreshStatus]);

  // Sync logs when category or search changes
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsCategory, logsSearch, fetchLogs]);

  // Load files when switching to files tab
  useEffect(() => {
    if (activeTab === 'files') {
      fetchFiles();
    }
  }, [activeTab, fetchFiles]);

  return (
    <PanelContext.Provider
      value={{
        activeTab,
        setActiveTab,
        subView,
        setSubView,
        openPanelDetail,
        backToPanels,
        panels,
        activePanel,
        activePanelId,
        presetNodes,
        fetchPanels,
        createPanel,
        updatePanel,
        deletePanel,
        telemetry,
        config,
        isLoading,
        isPowerLoading,
        powerAction,
        saveSettings,
        isCreatePanelOpen,
        setIsCreatePanelOpen,
        openCreatePanel,
        closeCreatePanel,
        consoleLogs,
        sendCommand,
        clearConsole,
        installDependencies,
        isInstalling,
        depsStatus,
        checkDepsStatus,
        logs,
        logsCategory,
        setLogsCategory,
        logsSearch,
        setLogsSearch,
        refreshLogs: fetchLogs,
        clearLogs,
        files,
        currentDir,
        setCurrentDir,
        projectRoot,
        isFilesLoading,
        fetchFiles,
        readFile,
        saveFile,
        uploadFile,
        createFolder,
        deleteFile,
        deleteMultipleFiles,
        deleteAllFiles,
        downloadFile,
        unarchiveFile,
        moveItems,
        moveAllToRoot,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanel = () => {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error('usePanel must be used within a PanelProvider');
  }
  return context;
};
