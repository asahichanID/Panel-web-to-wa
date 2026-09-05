import React from 'react';
import { usePanel } from '../../context/PanelContext';
import { LogCategory } from '../../types';
import {
  FileText,
  Search,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  Power,
  Activity,
} from 'lucide-react';

export const LogsView: React.FC = () => {
  const {
    logs,
    logsCategory,
    setLogsCategory,
    logsSearch,
    setLogsSearch,
    refreshLogs,
    clearLogs,
  } = usePanel();

  const categories: { id: LogCategory | 'all'; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'all', label: 'All Logs', icon: FileText },
    { id: 'startup', label: 'Startup Log', icon: Power },
    { id: 'install', label: 'Install Log', icon: PackageCheck },
    { id: 'error', label: 'Error Log', icon: AlertCircle },
    { id: 'process', label: 'Process Log', icon: Activity },
  ];

  const handleExportLogs = () => {
    const content = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.category.toUpperCase()}] [${l.type.toUpperCase()}] ${l.text}`
      )
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot-logs-${logsCategory}-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getCategoryColor = (cat: LogCategory) => {
    switch (cat) {
      case 'startup':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'install':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
      case 'error':
        return 'text-rose-400 bg-rose-950/60 border-rose-800';
      case 'process':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-4 flex flex-col h-[calc(100vh-80px)]">
      {/* 1. Header & Category Filters */}
      <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = logsCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setLogsCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-semibold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportLogs}
              title="Export Logs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={refreshLogs}
              title="Refresh Logs"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={clearLogs}
              title="Clear Logs"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={logsSearch}
            onChange={(e) => setLogsSearch(e.target.value)}
            placeholder="Cari kata kunci di log (contoh: error, connected, started, npm)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>
      </div>

      {/* 2. Logs Stream Content */}
      <div className="flex-1 bg-[#050811] border border-slate-800 rounded-2xl p-4 overflow-y-auto font-mono text-xs shadow-2xl space-y-1">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 select-none">
            <FileText className="w-10 h-10 opacity-30 text-slate-400" />
            <p>Tidak ada log dalam kategori ini.</p>
          </div>
        ) : (
          logs.map((log) => {
            const time = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
            return (
              <div
                key={log.id}
                className="flex items-start gap-3 py-1 px-2 rounded hover:bg-slate-900/50 transition-colors"
              >
                <span className="text-slate-600 text-[11px] shrink-0 select-none">
                  [{time}]
                </span>

                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 select-none ${getCategoryColor(
                    log.category
                  )}`}
                >
                  {log.category}
                </span>

                <span
                  className={`break-all ${
                    log.type === 'stderr' || log.category === 'error'
                      ? 'text-rose-400'
                      : log.category === 'install'
                      ? 'text-cyan-300'
                      : log.category === 'startup'
                      ? 'text-emerald-300'
                      : log.type === 'command'
                      ? 'text-amber-300'
                      : 'text-slate-200'
                  }`}
                >
                  {log.text}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
