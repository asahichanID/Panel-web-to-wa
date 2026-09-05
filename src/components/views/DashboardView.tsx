import React, { useState } from 'react';
import { usePanel } from '../../context/PanelContext';
import { BotEngineType } from '../../types';
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
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    telemetry,
    config,
    powerAction,
    isPowerLoading,
    saveSettings,
    consoleLogs,
    setActiveTab,
  } = usePanel();

  const [isEditingCommand, setIsEditingCommand] = useState(false);
  const [commandInput, setCommandInput] = useState(config.startupCommand);
  const [commandSaved, setCommandSaved] = useState(false);

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

  const handleEngineChange = async (engine: BotEngineType) => {
    try {
      await saveSettings({ engine });
    } catch (err) {
      console.error('Failed to change engine', err);
    }
  };

  const handleSaveCommand = async () => {
    try {
      await saveSettings({ startupCommand: commandInput.trim() || 'node index.js' });
      setIsEditingCommand(false);
      setCommandSaved(true);
      setTimeout(() => setCommandSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save command', err);
    }
  };

  const ramPercent = Math.min(100, Math.round((telemetry.memoryUsageMb / (telemetry.ramLimitMb || 1)) * 100));

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Main Status Hero Card */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-100 tracking-tight">
                {config.botName || 'BY SHIRO ANNA'}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                  isRunning
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : isStarting
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800 animate-pulse'
                    : telemetry.status === 'error'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isRunning
                      ? 'bg-emerald-400 animate-ping'
                      : isStarting
                      ? 'bg-amber-400'
                      : telemetry.status === 'error'
                      ? 'bg-rose-400'
                      : 'bg-slate-500'
                  }`}
                />
                {telemetry.status}
              </span>
            </div>
            <p className="text-sm text-slate-400">
              WhatsApp Bot Engine & Process Daemon Workspace • Modern Independent Runtime Panel
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <button
                id="dash-start-btn"
                onClick={() => powerAction('start')}
                disabled={isPowerLoading || isStarting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isStarting ? 'Starting Bot...' : 'Start Bot'}</span>
              </button>
            ) : (
              <>
                <button
                  id="dash-restart-btn"
                  onClick={() => powerAction('restart')}
                  disabled={isPowerLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-all cursor-pointer"
                >
                  <RotateCw className={`w-4 h-4 text-amber-400 ${isPowerLoading ? 'animate-spin' : ''}`} />
                  <span>Restart</span>
                </button>
                <button
                  id="dash-stop-btn"
                  onClick={() => powerAction('stop')}
                  disabled={isPowerLoading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1">Process PID</span>
            <div className="text-lg font-bold text-slate-100">
              {telemetry.pid ? `#${telemetry.pid}` : '—'}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" /> Uptime
            </span>
            <div className="text-lg font-bold text-slate-100">
              {formatUptime(telemetry.uptimeSeconds)}
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-rose-400" /> RAM Usage
            </span>
            <div className="text-lg font-bold text-slate-100">
              {telemetry.memoryUsageMb} <span className="text-xs font-normal text-slate-400">/ {telemetry.ramLimitMb} MB</span>
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
            <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400" /> CPU Core
            </span>
            <div className="text-lg font-bold text-slate-100">
              {telemetry.cpuPercent}% <span className="text-xs font-normal text-slate-400">limit {telemetry.cpuLimitPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Resource Limits & Engine Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RAM & CPU Resource Meters */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-rose-400" />
              Resource Limits & Allocation
            </h2>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              Configure in Settings <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* RAM Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Memory Allocation (RAM)</span>
              <span className="text-slate-400">
                {telemetry.memoryUsageMb} MB used ({ramPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  ramPercent > 90 ? 'bg-rose-500' : ramPercent > 70 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.max(5, ramPercent)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>0 MB</span>
              <span className="font-semibold text-slate-300">Max Limit: {config.ramLimitMb} MB</span>
            </div>
          </div>

          {/* CPU Meter */}
          <div className="space-y-2 pt-2 border-t border-slate-800/60">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">CPU Quota</span>
              <span className="text-slate-400">{telemetry.cpuPercent}% utilized</span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (telemetry.cpuPercent / config.cpuLimitPercent) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>0%</span>
              <span className="font-semibold text-slate-300">Max Limit: {config.cpuLimitPercent}%</span>
            </div>
          </div>

          {/* Quick RAM presets */}
          <div className="pt-2">
            <span className="text-xs text-slate-400 block mb-2">Quick RAM Limit Switch:</span>
            <div className="flex flex-wrap gap-2">
              {[512, 1024, 2048, 4096].map((size) => (
                <button
                  key={size}
                  onClick={() => saveSettings({ ramLimitMb: size })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    config.ramLimitMb === size
                      ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {size >= 1024 ? `${size / 1024} GB` : `${size} MB`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Engine Selection */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Bot Runtime Engine
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              Select Engine
            </span>
          </div>

          <div className="space-y-2.5">
            {/* 1. Baileys bawaan */}
            <div
              onClick={() => handleEngineChange('baileys-default')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                config.engine === 'baileys-default'
                  ? 'bg-rose-950/20 border-rose-500/60 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">Baileys Bawaan</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                    @sairidev/baileys-new
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Engine stabil bawaan terintegrasi dengan WhatsApp multi-device daemon.
                </p>
              </div>
              {config.engine === 'baileys-default' && (
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
            </div>

            {/* 2. Custom Baileys */}
            <div
              onClick={() => handleEngineChange('custom-baileys')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                config.engine === 'custom-baileys'
                  ? 'bg-rose-950/20 border-rose-500/60 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">Custom Baileys</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    @whiskeysockets/baileys
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Gunakan package baileys kustom atau fork Baileys yang didefinisikan di package.json.
                </p>
              </div>
              {config.engine === 'custom-baileys' && (
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
            </div>

            {/* 3. Custom Node.js */}
            <div
              onClick={() => handleEngineChange('custom-node')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between ${
                config.engine === 'custom-node'
                  ? 'bg-rose-950/20 border-rose-500/60 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100">Custom Node.js</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    Any Script
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Menjalankan skrip bot Node.js apa pun (Discord, Telegram, automation, etc.).
                </p>
              </div>
              {config.engine === 'custom-node' && (
                <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Startup Command & Environment Variables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Startup Command Card */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              Startup Command
            </h2>
            {commandSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Perintah eksekusi runner saat bot dinyalakan di direktori root project.
          </p>

          {isEditingCommand ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="node index.js"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={handleSaveCommand}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCommandInput(config.startupCommand);
                  setIsEditingCommand(false);
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400">
              <span>{config.startupCommand || 'node index.js'}</span>
              <button
                onClick={() => setIsEditingCommand(true)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Contoh perintah:</span>
            <button
              onClick={() => {
                setCommandInput('node index.js');
                saveSettings({ startupCommand: 'node index.js' });
              }}
              className="text-slate-400 hover:text-slate-200 underline cursor-pointer font-mono"
            >
              node index.js
            </button>
            <span>•</span>
            <button
              onClick={() => {
                setCommandInput('npm start');
                saveSettings({ startupCommand: 'npm start' });
              }}
              className="text-slate-400 hover:text-slate-200 underline cursor-pointer font-mono"
            >
              npm start
            </button>
          </div>
        </div>

        {/* Environment Variables Quick Preview */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Environment Variables ({config.envVars?.length || 0})
            </h2>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              Manage in Settings <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {config.envVars && config.envVars.length > 0 ? (
              config.envVars.slice(0, 4).map((env, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-2 text-xs font-mono"
                >
                  <span className="text-slate-300 font-semibold">{env.key}</span>
                  <span className="text-slate-400 truncate max-w-[180px]">
                    {env.isSecret ? '••••••••••••' : env.value}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                Belum ada environment variable.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Live Console Preview Banner */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Terminal className="w-4 h-4 text-slate-400" />
            Live Console Output Preview
          </div>
          <button
            id="dash-open-console-btn"
            onClick={() => setActiveTab('console')}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Buka Full Console <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1">
          {consoleLogs.length > 0 ? (
            consoleLogs.slice(-5).map((log, idx) => (
              <div key={idx} className="truncate flex items-start gap-2">
                <span className="text-slate-500 shrink-0 text-[10px]">
                  [{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}]
                </span>
                <span
                  className={
                    log.type === 'stderr' || log.category === 'error'
                      ? 'text-rose-400'
                      : log.type === 'command'
                      ? 'text-amber-400'
                      : log.type === 'system'
                      ? 'text-indigo-400'
                      : 'text-slate-300'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 text-center py-2">
              Belum ada log aktif. Tekan <b>Start Bot</b> untuk memulai process daemon.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
