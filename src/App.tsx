import React from 'react';
import { PanelProvider, usePanel } from './context/PanelContext';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { FilesView } from './components/views/FilesView';
import { ConsoleView } from './components/views/ConsoleView';
import { LogsView } from './components/views/LogsView';
import { SettingsView } from './components/views/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab, isLoading } = usePanel();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
          <span className="text-xs font-mono text-slate-400">Loading BY SHIRO ANNA Bot Panel...</span>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'files':
        return <FilesView />;
      case 'console':
        return <ConsoleView />;
      case 'logs':
        return <LogsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-rose-500/30">
      <Navbar />
      <main className="flex-1 overflow-x-hidden">
        {renderActiveView()}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <PanelProvider>
      <MainLayout />
    </PanelProvider>
  );
};

export default App;
