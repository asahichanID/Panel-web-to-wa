import React, { useState } from 'react';
import { usePanel } from '../../context/PanelContext';
import { CreatePanelModal } from '../panel/CreatePanelModal';
import {
  Play,
  Square,
  RotateCw,
  HardDrive,
  Cpu,
  Terminal,
  Clock,
  Sparkles,
  ArrowRight,
  Code2,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Plus,
  ArrowLeft,
  Server,
  Layers,
  Zap,
  Globe,
  Database,
  Trash2,
  Check,
  Send,
} from 'lucide-react';
import { PanelModel } from '../../types';

export const DashboardView: React.FC = () => {
  const {
    subView,
    setSubView,
    panels,
    activePanel,
    activePanelId,
    openPanelDetail,
    backToPanels,
    deletePanel,
    updatePanel,
    telemetry,
    powerAction,
    isPowerLoading,
    consoleLogs,
    sendCommand,
    clearConsole,
    setActiveTab,
    isCreatePanelOpen,
    openCreatePanel,
    closeCreatePanel,
  } = usePanel();

  const [panelSearch, setPanelSearch] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'console' | 'specs'>('overview');
  const [consoleInput, setConsoleInput] = useState('');
  const [isCommandSending, setIsCommandSending] = useState(false);

  // Edit specs states for active panel
  const [editRam, setEditRam] = useState(activePanel?.ramMb || 1024);
  const [editRom, setEditRom] = useState(activePanel?.diskRomMb || 5120);
  const [editCpu, setEditCpu] = useState(activePanel?.cpuPercent || 100);
  const [editCommand, setEditCommand] = useState(activePanel?.startupCommand || 'npm start');
  const [editSoftware, setEditSoftware] = useState(activePanel?.serverSoftware || 'Express Web Server');
  const [specsSaved, setSpecsSaved] = useState(false);

  // Sync edit state when activePanel changes
  React.useEffect(() => {
    if (activePanel) {
      setEditRam(activePanel.ramMb);
      setEditRom(activePanel.diskRomMb);
      setEditCpu(activePanel.cpuPercent);
      setEditCommand(activePanel.startupCommand);
      setEditSoftware(activePanel.serverSoftware);
    }
  }, [activePanel]);

  const isRunning = telemetry.status === 'running';
  const isStarting = telemetry.status === 'starting';

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consoleInput.trim() || isCommandSending) return;
    setIsCommandSending(true);
    await sendCommand(consoleInput.trim());
    setConsoleInput('');
    setIsCommandSending(false);
  };

  const handleSaveSpecs = async () => {
    if (!activePanel) return;
    await updatePanel(activePanel.id, {
      ramMb: editRam,
      diskRomMb: editRom,
      cpuPercent: editCpu,
      startupCommand: editCommand,
      serverSoftware: editSoftware,
    });
    setSpecsSaved(true);
    setTimeout(() => setSpecsSaved(false), 2500);
  };

  const getNodeIcon = (category: string) => {
    switch (category) {
      case 'minecraft':
        return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'nodejs':
        return <Code2 className="w-5 h-5 text-amber-400" />;
      case 'python':
        return <Code2 className="w-5 h-5 text-indigo-400" />;
      default:
        return <Layers className="w-5 h-5 text-cyan-400" />;
    }
  };

  const filteredPanels = panels.filter((p) =>
    p.name.toLowerCase().includes(panelSearch.toLowerCase()) ||
    p.nodeDisplayName.toLowerCase().includes(panelSearch.toLowerCase()) ||
    p.serverSoftware.toLowerCase().includes(panelSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW: MY PANELS (HOME SCREEN - LIST OF ALL SERVERS)        */}
      {/* ------------------------------------------------------------- */}
      {subView === 'my-panels' ? (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl backdrop-blur-sm">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <Server className="w-6 h-6 text-cyan-400" /> My Panels
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-xs font-semibold">
                  {panels.length} Server Instance
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Pilih panel untuk masuk ke server, atau buat panel baru dengan RAM, ROM, CPU, dan Node sesuai kebutuhan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Cari panel server..."
                value={panelSearch}
                onChange={(e) => setPanelSearch(e.target.value)}
                className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-400 transition-all w-full sm:w-48"
              />
              <button
                id="create-panel-btn-home"
                onClick={openCreatePanel}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Panel</span>
              </button>
            </div>
          </div>

          {/* Panels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create New Panel Floating Action Card */}
            <div
              id="card-create-panel"
              onClick={openCreatePanel}
              className="group border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/25 p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Create New Panel
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Konfigurasi RAM, ROM, CPU, Node (Minecraft, Node.js, Python, dll) &amp; Software Server.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 group-hover:underline">
                Buat Panel Sekarang <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* List of Panels */}
            {filteredPanels.map((panel) => {
              const isPanelRunning = panel.id === activePanelId && telemetry.status === 'running';
              const isPanelStarting = panel.id === activePanelId && telemetry.status === 'starting';

              return (
                <div
                  key={panel.id}
                  id={`panel-card-${panel.id}`}
                  className={`bg-[#0d131f] border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl relative overflow-hidden group ${
                    panel.id === activePanelId
                      ? 'border-cyan-500/50 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Status & Node Icon */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                          {getNodeIcon(panel.nodeCategory)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[180px]">
                            {panel.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            {panel.nodeDisplayName}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] shrink-0 font-medium">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isPanelRunning
                              ? 'bg-emerald-400 shadow-xs shadow-emerald-400 animate-pulse'
                              : isPanelStarting
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-500'
                          }`}
                        />
                        <span className="text-slate-300 text-[10px]">
                          {isPanelRunning ? 'Online' : isPanelStarting ? 'Starting' : 'Offline'}
                        </span>
                      </div>
                    </div>

                    {/* Software & Port banner */}
                    <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80 mb-3 text-slate-400">
                      <span className="truncate flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-400 shrink-0" /> {panel.serverSoftware}
                      </span>
                      <span className="font-mono text-slate-300 shrink-0">Port {panel.port}</span>
                    </div>

                    {/* Resources specs chips */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                      <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">RAM</span>
                        <span className="text-rose-400 font-bold font-mono">
                          {panel.ramMb >= 1024 ? `${(panel.ramMb / 1024).toFixed(panel.ramMb % 1024 === 0 ? 0 : 1)} GB` : `${panel.ramMb} MB`}
                        </span>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">ROM</span>
                        <span className="text-indigo-400 font-bold font-mono">
                          {panel.diskRomMb >= 1024 ? `${Math.round(panel.diskRomMb / 1024)} GB` : `${panel.diskRomMb} MB`}
                        </span>
                      </div>

                      <div className="bg-slate-900/60 border border-slate-800/80 p-2 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">CPU</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {panel.cpuPercent}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Click to Enter Panel */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      id={`enter-panel-btn-${panel.id}`}
                      onClick={() => openPanelDetail(panel.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Masuk ke Panel</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {panel.id === activePanelId && (
                      <button
                        onClick={() => powerAction(isPanelRunning ? 'stop' : 'start')}
                        disabled={isPowerLoading}
                        title={isPanelRunning ? 'Stop Server' : 'Start Server'}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isPanelRunning
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        {isPanelRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* 2. VIEW: PANEL DETAIL (INSIDE SELECTED INSTANCE)              */
        /* ------------------------------------------------------------- */
        <div className="space-y-6">
          {/* Top Panel Navigation Bar */}
          <div className="bg-[#0d131f] border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                id="back-to-my-panels-btn"
                onClick={backToPanels}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>My Panels</span>
              </button>

              <div className="h-6 w-px bg-slate-800" />

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {activePanel?.name || 'Panel Server'}
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                    {activePanel?.nodeDisplayName || 'Node'}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning
                          ? 'bg-emerald-400 shadow-xs shadow-emerald-400 animate-pulse'
                          : isStarting
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="text-slate-300 text-[11px] capitalize">
                      {isRunning ? 'Online' : isStarting ? 'Starting...' : 'Offline'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>Software: {activePanel?.serverSoftware}</span>
                  <span>•</span>
                  <span>Port: {activePanel?.port}</span>
                  {telemetry.pid && <span>• PID: {telemetry.pid}</span>}
                </div>
              </div>
            </div>

            {/* Power & Switcher actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Switch to other panel dropdown */}
              {panels.length > 1 && (
                <select
                  value={activePanelId}
                  onChange={(e) => openPanelDetail(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none cursor-pointer"
                >
                  {panels.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Start / Stop / Restart buttons */}
              <button
                id="panel-power-start-btn"
                onClick={() => powerAction('start')}
                disabled={isRunning || isPowerLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start</span>
              </button>

              <button
                id="panel-power-stop-btn"
                onClick={() => powerAction('stop')}
                disabled={!isRunning || isPowerLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>

              <button
                id="panel-power-restart-btn"
                onClick={() => powerAction('restart')}
                disabled={isPowerLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isPowerLoading ? 'animate-spin' : ''}`} />
                <span>Restart</span>
              </button>
            </div>
          </div>

          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* RAM */}
            <div className="bg-[#0d131f] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Database className="w-4 h-4 text-rose-400" /> RAM Memory
                </span>
                <span className="font-mono text-rose-400 font-bold">
                  {telemetry.memoryUsageMb} / {activePanel?.ramMb || telemetry.ramLimitMb} MB
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (telemetry.memoryUsageMb / (activePanel?.ramMb || telemetry.ramLimitMb || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Alokasi memori instance aktif.
              </span>
            </div>

            {/* ROM / Disk */}
            <div className="bg-[#0d131f] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <HardDrive className="w-4 h-4 text-indigo-400" /> ROM / Disk
                </span>
                <span className="font-mono text-indigo-400 font-bold">
                  {activePanel ? (activePanel.diskRomMb >= 1024 ? `${(activePanel.diskRomMb / 1024).toFixed(0)} GB` : `${activePanel.diskRomMb} MB`) : '5 GB'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '15%' }} />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Kapasitas penyimpanan server instance.
              </span>
            </div>

            {/* CPU */}
            <div className="bg-[#0d131f] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-amber-400" /> CPU Load
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {telemetry.cpuPercent.toFixed(1)}% / {activePanel?.cpuPercent || 100}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, telemetry.cpuPercent)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-500 block">
                Limit: {(activePanel?.cpuPercent || 100) / 100} Core Virtual CPU.
              </span>
            </div>

            {/* Uptime & PID */}
            <div className="bg-[#0d131f] border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-emerald-400" /> Uptime
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatUptime(telemetry.uptimeSeconds)}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono pt-1">
                Node: {telemetry.nodeVersion}
              </div>
              <span className="text-[11px] text-slate-500 block">
                Status: {isRunning ? 'Running Process' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Sub Navigation inside Panel Detail */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveDetailTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeDetailTab === 'overview'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview &amp; Console
            </button>
            <button
              onClick={() => setActiveDetailTab('specs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeDetailTab === 'specs'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Spesifikasi (RAM/ROM/CPU)
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
            >
              File Manager <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Detail Tab 1: Overview & Live Console */}
          {activeDetailTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Info Bar */}
              <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Interactive Live Terminal</span>
                    <span className="text-slate-400 text-[11px]">
                      Startup: <code className="font-mono text-cyan-300">{activePanel?.startupCommand}</code>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={clearConsole}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Clear Output
                  </button>
                  <button
                    onClick={() => setActiveTab('console')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    Layar Penuh <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Console Output Area */}
              <div className="bg-[#050811] border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
                <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-[11px] text-slate-400 font-semibold ml-2">
                      terminal@{activePanel?.name?.toLowerCase().replace(/\s+/g, '-') || 'server'}:~$
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">{consoleLogs.length} logs recorded</span>
                </div>

                <div className="p-4 h-72 overflow-y-auto space-y-1 select-text">
                  {consoleLogs.length === 0 ? (
                    <div className="text-slate-500 italic py-8 text-center">
                      Terminal siap. Jalankan "Start" untuk memulai proses server.
                    </div>
                  ) : (
                    consoleLogs.slice(-150).map((log) => (
                      <div
                        key={log.id}
                        className={`leading-relaxed break-all ${
                          log.type === 'stderr'
                            ? 'text-rose-400'
                            : log.type === 'system'
                            ? 'text-cyan-400'
                            : log.type === 'command'
                            ? 'text-amber-300 font-bold'
                            : 'text-slate-300'
                        }`}
                      >
                        <span className="text-slate-600 mr-2 select-none">[{log.timestamp}]</span>
                        <span>{log.text}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Input prompt */}
                <form
                  onSubmit={handleSendCommand}
                  className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2"
                >
                  <span className="text-cyan-400 font-bold">$</span>
                  <input
                    type="text"
                    placeholder={
                      isRunning
                        ? 'Ketik perintah terminal atau input server...'
                        : 'Server sedang offline. Klik Start untuk menjalankan.'
                    }
                    disabled={!isRunning}
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 outline-none text-xs placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    disabled={!isRunning || !consoleInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-30 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Detail Tab 2: Spesifikasi (RAM / ROM / CPU / Command / Software) */}
          {activeDetailTab === 'specs' && (
            <div className="bg-[#0d131f] border border-slate-800 p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" /> Atur Spesifikasi &amp; Alokasi Server
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sesuaikan kapasitas RAM, ROM, CPU, dan startup command untuk panel ini.
                  </p>
                </div>
                {specsSaved && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Tersimpan!
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* RAM */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-rose-400" /> RAM (MB)
                  </label>
                  <input
                    type="number"
                    min={128}
                    step={128}
                    value={editRam}
                    onChange={(e) => setEditRam(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs outline-none focus:border-rose-400"
                  />
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[512, 1024, 2048, 4096].map((mb) => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setEditRam(mb)}
                        className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                          editRam === mb
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                        }`}
                      >
                        {mb >= 1024 ? `${mb / 1024}GB` : `${mb}MB`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ROM / Disk */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> ROM / Disk (MB)
                  </label>
                  <input
                    type="number"
                    min={512}
                    step={512}
                    value={editRom}
                    onChange={(e) => setEditRom(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs outline-none focus:border-indigo-400"
                  />
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[2048, 5120, 10240, 20480].map((mb) => (
                      <button
                        key={mb}
                        type="button"
                        onClick={() => setEditRom(mb)}
                        className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                          editRom === mb
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                        }`}
                      >
                        {`${Math.round(mb / 1024)}GB`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CPU */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> CPU Core (%)
                  </label>
                  <input
                    type="number"
                    min={25}
                    step={25}
                    value={editCpu}
                    onChange={(e) => setEditCpu(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs outline-none focus:border-amber-400"
                  />
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[50, 100, 200, 400].map((cpu) => (
                      <button
                        key={cpu}
                        type="button"
                        onClick={() => setEditCpu(cpu)}
                        className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                          editCpu === cpu
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                            : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                        }`}
                      >
                        {cpu}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Startup Command & Server Software */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Startup Command
                  </label>
                  <input
                    type="text"
                    value={editCommand}
                    onChange={(e) => setEditCommand(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 font-mono text-xs outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Server Software
                  </label>
                  <input
                    type="text"
                    value={editSoftware}
                    onChange={(e) => setEditSoftware(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Save Specs Action */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                {panels.length > 1 && (
                  <button
                    onClick={() => {
                      if (activePanel && confirm(`Hapus panel ${activePanel.name}?`)) {
                        deletePanel(activePanel.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Panel Ini
                  </button>
                )}

                <div className="ml-auto">
                  <button
                    onClick={handleSaveSpecs}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Simpan Perubahan Spesifikasi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Create Panel Modal */}
      <CreatePanelModal isOpen={isCreatePanelOpen} onClose={closeCreatePanel} />
    </div>
  );
};
