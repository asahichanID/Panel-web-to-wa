import React, { useState, useEffect } from 'react';
import { usePanel } from '../../context/PanelContext';
import { BotEngineType, EnvironmentVariable } from '../../types';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Check,
  RotateCcw,
  Sparkles,
  HardDrive,
  Cpu,
  Terminal,
  Key,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { config, saveSettings } = usePanel();

  const [botName, setBotName] = useState(config.botName);
  const [engine, setEngine] = useState<BotEngineType>(config.engine);
  const [startupCommand, setStartupCommand] = useState(config.startupCommand);
  const [ramLimitMb, setRamLimitMb] = useState(config.ramLimitMb);
  const [cpuLimitPercent, setCpuLimitPercent] = useState(config.cpuLimitPercent);
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>(config.envVars || []);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<number, boolean>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with config changes
  useEffect(() => {
    setBotName(config.botName);
    setEngine(config.engine);
    setStartupCommand(config.startupCommand);
    setRamLimitMb(config.ramLimitMb);
    setCpuLimitPercent(config.cpuLimitPercent);
    setEnvVars(config.envVars || []);
  }, [config]);

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', isSecret: false }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleEnvVarChange = (index: number, field: keyof EnvironmentVariable, value: any) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const toggleSecretReveal = (index: number) => {
    setRevealedSecrets((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings({
        botName: botName.trim() || 'BY SHIRO ANNA',
        engine,
        startupCommand: startupCommand.trim() || 'node index.js',
        ramLimitMb: Number(ramLimitMb) || 1024,
        cpuLimitPercent: Number(cpuLimitPercent) || 100,
        envVars: envVars.filter((v) => v.key.trim() !== ''),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-400" />
            Pengaturan Bot Panel
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi parameter inti, resource limits, engine, dan environment variables.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4" /> Pengaturan Tersimpan!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Nama Project & Engine */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Identitas & Engine
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Nama Bot / Project</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                placeholder="BY SHIRO ANNA"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Pilihan Runtime / Node</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value as BotEngineType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="custom-node">Node.js Runtime (Standard / npm start)</option>
                <option value="baileys-default">Minecraft / Game Server Node</option>
                <option value="custom-baileys">Python / Multi-runtime Daemon</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Resource Limits */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-rose-400" />
            Resource Limit
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* RAM Limit */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">RAM Limit</span>
                <span className="font-bold text-rose-400 font-mono">{ramLimitMb} MB</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={ramLimitMb}
                onChange={(e) => setRamLimitMb(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[512, 1024, 2048, 4096].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRamLimitMb(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                      ramLimitMb === m
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {m >= 1024 ? `${m / 1024}GB` : `${m}MB`}
                  </button>
                ))}
              </div>
            </div>

            {/* CPU Limit */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">CPU Limit</span>
                <span className="font-bold text-indigo-400 font-mono">{cpuLimitPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={cpuLimitPercent}
                onChange={(e) => setCpuLimitPercent(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCpuLimitPercent(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                      cpuLimitPercent === p
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Startup Command */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Startup Command
          </h2>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">
              Perintah yang dieksekusi saat bot dinyalakan (default: <span className="font-mono text-slate-300">node index.js</span>)
            </label>
            <input
              type="text"
              value={startupCommand}
              onChange={(e) => setStartupCommand(e.target.value)}
              placeholder="node index.js"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-400 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* 4. Environment Variables */}
        <div className="bg-[#0f1523] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Environment Variables
            </h2>
            <button
              type="button"
              onClick={handleAddEnvVar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Variable</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {envVars.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                Belum ada environment variable. Tekan <b>Tambah Variable</b> di atas.
              </div>
            ) : (
              envVars.map((env, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80"
                >
                  <input
                    type="text"
                    value={env.key}
                    onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                    placeholder="KEY"
                    className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500 uppercase"
                  />
                  <div className="flex-1 relative">
                    <input
                      type={env.isSecret && !revealedSecrets[index] ? 'password' : 'text'}
                      value={env.value}
                      onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                      placeholder="VALUE"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
                    />
                    {env.isSecret && (
                      <button
                        type="button"
                        onClick={() => toggleSecretReveal(index)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {revealedSecrets[index] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <label className="flex items-center gap-1 text-[11px] text-slate-400 select-none px-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!env.isSecret}
                      onChange={(e) => handleEnvVarChange(index, 'isSecret', e.target.checked)}
                      className="rounded accent-rose-500"
                    />
                    <span>Secret</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveEnvVar(index)}
                    className="p-1.5 rounded-lg hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            id="save-settings-btn"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
