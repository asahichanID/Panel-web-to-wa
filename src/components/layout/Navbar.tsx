import React from 'react';
import { usePanel } from '../../context/PanelContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  FolderTree,
  Terminal,
  FileText,
  Sliders,
  Play,
  Square,
  RotateCw,
  Server,
  Plus,
  Layers,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    subView,
    setSubView,
    activePanel,
    panels,
    openPanelDetail,
    telemetry,
    powerAction,
    isPowerLoading,
    openCreatePanel,
  } = usePanel();

  const isRunning = telemetry.status === 'running';
  const isStarting = telemetry.status === 'starting';

  const navTabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'My Panels', icon: LayoutDashboard },
    { id: 'files', label: 'Files', icon: FolderTree },
    { id: 'console', label: 'Console', icon: Terminal },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const getStatusColor = () => {
    switch (telemetry.status) {
      case 'running':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'starting':
        return 'bg-amber-500 shadow-amber-500/50 animate-pulse';
      case 'error':
        return 'bg-rose-500 shadow-rose-500/50';
      default:
        return 'bg-slate-500';
    }
  };

  const handleTabClick = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    if (tabId === 'dashboard' && subView === 'panel-detail') {
      // If user clicks My Panels tab while inside, they can go back to My Panels
    }
  };

  return (
    <header className="bg-[#0b0f19] border-b border-slate-800/80 sticky top-0 z-30 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Active Panel Info */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSubView('my-panels');
            }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20 text-slate-950 font-black tracking-tight cursor-pointer hover:opacity-90 transition-opacity"
            title="Kembali ke My Panels"
          >
            <Server className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm tracking-wide">
                {activePanel?.name || 'BY SHIRO ANNA Panel'}
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium">
                <span className={`w-2 h-2 rounded-full ${getStatusColor()} shadow-xs`} />
                <span className="capitalize text-slate-300">
                  {telemetry.status === 'running'
                    ? 'Online'
                    : telemetry.status === 'starting'
                    ? 'Starting...'
                    : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-cyan-400" />
                {activePanel?.nodeDisplayName || 'Node Server'}
              </span>
              {activePanel?.port && (
                <span className="text-slate-500">
                  • Port {activePanel.port}
                </span>
              )}
              {telemetry.pid && (
                <span className="text-slate-500">
                  • PID {telemetry.pid}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 5 Core Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 shadow-inner">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions: Create Panel & Power Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="navbar-create-panel-btn"
            onClick={openCreatePanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
            title="Create New Panel"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Create Panel</span>
          </button>

          {!isRunning ? (
            <button
              id="power-start-btn"
              onClick={() => powerAction('start')}
              disabled={isPowerLoading || isStarting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isStarting ? 'Starting...' : 'Start'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                id="power-restart-btn"
                onClick={() => powerAction('restart')}
                disabled={isPowerLoading}
                title="Restart Process"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isPowerLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Restart</span>
              </button>
              <button
                id="power-stop-btn"
                onClick={() => powerAction('stop')}
                disabled={isPowerLoading}
                title="Stop Process"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-sm transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav Tabs bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 mt-2.5 pt-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[11px] font-medium transition-colors ${
                isActive ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
