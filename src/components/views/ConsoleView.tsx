import React, { useState, useEffect, useRef } from 'react';
import { usePanel } from '../../context/PanelContext';
import {
  Terminal,
  Send,
  Trash2,
  Copy,
  Check,
  Play,
  Square,
  RotateCw,
  Cpu,
  HardDrive,
  Clock,
  ArrowDownCircle,
  Package,
  AlertCircle,
} from 'lucide-react';

export const ConsoleView: React.FC = () => {
  const {
    telemetry,
    consoleLogs,
    sendCommand,
    clearConsole,
    powerAction,
    isPowerLoading,
    installDependencies,
    isInstalling,
    depsStatus,
  } = usePanel();

  const [inputCmd, setInputCmd] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const isRunning = telemetry.status === 'running';

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs, autoScroll]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCmd.trim()) return;
    const cmd = inputCmd.trim();
    setInputCmd('');
    await sendCommand(cmd);
  };

  const handleQuickCommand = async (cmd: string) => {
    await sendCommand(cmd);
  };

  const handleCopyLogs = () => {
    const text = consoleLogs
      .map((l) => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.text}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4 flex flex-col h-[calc(100vh-80px)]">
      {/* 1. Terminal Status Header Bar */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md shrink-0">
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-emerald-400 shadow-emerald-400/50 shadow-xs' : 'bg-slate-500'
              }`}
            />
            <span className="font-bold uppercase text-slate-200">
              {telemetry.status}
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          <div className="text-slate-400">
            PID: <span className="text-slate-200 font-semibold">{telemetry.pid || '—'}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-slate-200 font-semibold">{formatUptime(telemetry.uptimeSeconds)}</span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          <div className="flex items-center gap-1 text-slate-400">
            <HardDrive className="w-3 h-3 text-rose-400" />
            <span className="text-slate-200 font-semibold">{telemetry.memoryUsageMb} MB</span>
            <span className="text-slate-500">/ {telemetry.ramLimitMb} MB</span>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              autoScroll
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/80'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Auto-scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={installDependencies}
            disabled={isInstalling}
            title="Install dependencies (npm install)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium border border-indigo-800/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Package className={`w-3.5 h-3.5 ${isInstalling ? 'animate-bounce text-indigo-400' : ''}`} />
            <span>{isInstalling ? 'Installing...' : 'Install Deps'}</span>
          </button>

          <button
            onClick={handleCopyLogs}
            title="Copy Terminal Logs"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={clearConsole}
            title="Clear Console"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {!isRunning ? (
            <button
              onClick={() => powerAction('start')}
              disabled={isPowerLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start</span>
            </button>
          ) : (
            <button
              onClick={() => powerAction('restart')}
              disabled={isPowerLoading}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3 h-3 ${isPowerLoading ? 'animate-spin' : ''}`} />
              <span>Restart</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning/Status Banner if dependencies missing or installing */}
      {isInstalling && (
        <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/80 flex items-center gap-3 text-xs text-indigo-200 shrink-0">
          <Package className="w-4 h-4 text-indigo-400 animate-bounce shrink-0" />
          <span>Sedang menjalankan <code>npm install</code> untuk memasang dependencies bot. Silakan pantau log di bawah.</span>
        </div>
      )}
      {!isInstalling && depsStatus.hasPackageJson && !depsStatus.hasNodeModules && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/80 flex items-center justify-between gap-3 text-xs text-amber-200 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Folder <code>node_modules</code> belum ada. Klik tombol <strong>Install Deps</strong> agar bot tidak error saat dijalankan.</span>
          </div>
          <button
            onClick={installDependencies}
            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs cursor-pointer shrink-0"
          >
            Install Sekarang
          </button>
        </div>
      )}

      {/* 2. Main Terminal Output View */}
      <div className="flex-1 bg-[#050811] border border-slate-800 rounded-2xl p-4 overflow-y-auto font-mono text-xs leading-relaxed shadow-2xl relative space-y-1 select-text">
        {consoleLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
            <Terminal className="w-10 h-10 opacity-30 text-slate-400" />
            <p>Konsol siap. Belum ada aktivitas proses.</p>
            <p className="text-[11px] text-slate-700">
              Tekan Start Bot di navbar atau Dashboard untuk menjalankan daemon.
            </p>
          </div>
        ) : (
          consoleLogs.map((log) => {
            const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
            return (
              <div key={log.id} className="flex items-start gap-2.5 hover:bg-slate-900/40 py-0.5 px-1 rounded">
                <span className="text-slate-600 shrink-0 text-[11px] select-none">
                  [{time}]
                </span>

                <span
                  className={`break-all ${
                    log.type === 'stderr' || log.category === 'error'
                      ? 'text-rose-400 font-semibold'
                      : log.type === 'command'
                      ? 'text-amber-300 font-semibold'
                      : log.type === 'system'
                      ? 'text-indigo-400'
                      : log.category === 'install'
                      ? 'text-cyan-400'
                      : 'text-slate-200'
                  }`}
                >
                  {log.text}
                </span>
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* 3. Quick Shortcut Command Chips */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto py-1 shrink-0">
        <span className="text-slate-500 font-medium shrink-0">Preset:</span>
        {['npm install', 'npm start', 'ping', 'status', 'help', 'node index.js'].map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleQuickCommand(cmd)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[11px] transition-colors cursor-pointer shrink-0"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* 4. Terminal Command Input Bar */}
      <form onSubmit={handleSendCommand} className="flex items-center gap-2 shrink-0">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 font-mono font-bold select-none">
            &gt;
          </span>
          <input
            id="console-input"
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            placeholder={
              isRunning
                ? 'Ketik perintah stdin / nomor telepon WhatsApp untuk pairing...'
                : 'Ketik perintah terminal (contoh: npm install)...'
            }
            className="w-full bg-[#0f1523] border border-slate-800 focus:border-rose-500 rounded-xl pl-8 pr-4 py-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!inputCmd.trim()}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
};
