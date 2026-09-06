import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Server,
  Cpu,
  HardDrive,
  Terminal,
  Play,
  X,
  Sparkles,
  Layers,
  Gamepad2,
  Code2,
  Boxes,
  Database,
  Globe,
  Check,
  Zap,
} from 'lucide-react';
import { usePanel } from '../../context/PanelContext';
import { PanelNodeCategory } from '../../types';
import { DEFAULT_PRESET_NODES } from '../../data/presetNodes';

interface CreatePanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePanelModal: React.FC<CreatePanelModalProps> = ({ isOpen, onClose }) => {
  const { createPanel, presetNodes } = usePanel();

  // Always fallback to DEFAULT_PRESET_NODES to guarantee nodes exist in preview, deploy & production
  const activePresets = presetNodes && presetNodes.length > 0 ? presetNodes : DEFAULT_PRESET_NODES;

  const [panelName, setPanelName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PanelNodeCategory | 'all'>('all');
  const [selectedNodeType, setSelectedNodeType] = useState('nodejs-22');
  const [ramMb, setRamMb] = useState(1024);
  const [diskRomMb, setDiskRomMb] = useState(5120);
  const [cpuPercent, setCpuPercent] = useState(100);
  const [port, setPort] = useState(8085);
  const [serverSoftware, setServerSoftware] = useState('Express Web Server');
  const [startupCommand, setStartupCommand] = useState('npm start');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Node selection and auto-configure recommended software/command/port
  const handleSelectNode = (nodeType: string) => {
    setSelectedNodeType(nodeType);
    const found = activePresets.find((n) => n.type === nodeType);
    if (found) {
      setServerSoftware(found.defaultSoftware);
      setPort(found.defaultPort);
      setStartupCommand(found.defaultCommand.replace(/{{RAM}}/g, String(found.defaultRam || 1024)));
      if (!ramMb || ramMb === 1024) setRamMb(found.defaultRam);
      if (!diskRomMb || diskRomMb === 5120) setDiskRomMb(found.defaultRom);
      if (!cpuPercent || cpuPercent === 100) setCpuPercent(found.defaultCpu);
    }
  };

  const filteredNodes = activePresets.filter((n) => {
    if (selectedCategory === 'all') return true;
    return n.category === selectedCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!panelName.trim()) {
      setErrorMsg('Harap masukkan nama panel terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const created = await createPanel({
        name: panelName.trim(),
        nodeType: selectedNodeType,
        serverSoftware,
        ramMb,
        diskRomMb,
        cpuPercent,
        port,
        startupCommand,
      });

      if (created) {
        onClose();
      } else {
        setErrorMsg('Gagal membuat panel. Periksa kembali parameter Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedNodeObj = activePresets.find((n) => n.type === selectedNodeType) || activePresets[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-[#0d131f] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                  Create New Panel
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Dedicated Instance
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Konfigurasi spesifikasi Server (RAM, ROM, CPU, Node & Egg). Siap jalan di production.
                </p>
              </div>
            </div>

            <button
              id="close-create-panel-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="font-semibold">Perhatian:</span> {errorMsg}
              </div>
            )}

            {/* 1. Nama Panel & Server Software */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> Nama Panel / Server
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Minecraft Survival SMP / Bot Shiro / API Node"
                  value={panelName}
                  onChange={(e) => setPanelName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-white text-sm outline-none transition-all placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-400">Nama identitas panel yang muncul di My Panels.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Server Mau Pake Apa? (Software)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Express, Fastify, PaperSpigot, BDS, FastAPI"
                    value={serverSoftware}
                    onChange={(e) => setServerSoftware(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 focus:border-cyan-400 rounded-xl text-white text-sm outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {['Express Web Engine', 'Fastify', 'PaperSpigot Core', 'Purpur Engine', 'Bedrock BDS', 'FastAPI ASGI', 'Bun Native'].map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => setServerSoftware(sw)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        serverSoftware === sw
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Node / Environment Selector (Wajib Lengkap: Minecraft, Node.js, Python, Runtimes) */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> Node &amp; Egg Environment (Wajib Lengkap)
                </label>

                {/* Category filter tabs */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('minecraft')}
                    className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      selectedCategory === 'minecraft' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Gamepad2 className="w-3.5 h-3.5" /> Minecraft
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('nodejs')}
                    className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      selectedCategory === 'nodejs' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" /> Node.js
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('python')}
                    className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all cursor-pointer ${
                      selectedCategory === 'python' ? 'bg-indigo-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('runtimes')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedCategory === 'runtimes' ? 'bg-purple-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Runtimes
                  </button>
                </div>
              </div>

              {/* Node Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {filteredNodes.map((item) => {
                  const isSelected = selectedNodeType === item.type;
                  return (
                    <div
                      key={item.type}
                      onClick={() => handleSelectNode(item.type)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400/80 shadow-md shadow-cyan-500/15 ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            {item.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          Port {item.defaultPort}
                        </span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Resource Allocation: RAM, ROM / Disk, CPU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* RAM Allocation */}
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-rose-400" /> RAM
                  </span>
                  <span className="text-sm font-bold text-rose-400 font-mono">
                    {ramMb >= 1024 ? `${(ramMb / 1024).toFixed(ramMb % 1024 === 0 ? 0 : 1)} GB` : `${ramMb} MB`}
                  </span>
                </div>
                <input
                  type="number"
                  min={128}
                  max={32768}
                  step={128}
                  value={ramMb}
                  onChange={(e) => setRamMb(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs outline-none focus:border-rose-400"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[512, 1024, 2048, 4096].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setRamMb(mb)}
                      className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                        ramMb === mb
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                      }`}
                    >
                      {mb >= 1024 ? `${mb / 1024}GB` : `${mb}MB`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ROM / Disk Allocation */}
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" /> ROM / Disk
                  </span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">
                    {diskRomMb >= 1024 ? `${(diskRomMb / 1024).toFixed(0)} GB` : `${diskRomMb} MB`}
                  </span>
                </div>
                <input
                  type="number"
                  min={512}
                  max={102400}
                  step={512}
                  value={diskRomMb}
                  onChange={(e) => setDiskRomMb(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs outline-none focus:border-indigo-400"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[2048, 5120, 10240, 20480].map((mb) => (
                    <button
                      key={mb}
                      type="button"
                      onClick={() => setDiskRomMb(mb)}
                      className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                        diskRomMb === mb
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold'
                          : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-slate-200'
                      }`}
                    >
                      {`${Math.round(mb / 1024)}GB`}
                    </button>
                  ))}
                </div>
              </div>

              {/* CPU Cores / Limit */}
              <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> CPU Core
                  </span>
                  <span className="text-sm font-bold text-amber-400 font-mono">
                    {cpuPercent}% ({cpuPercent / 100} Core)
                  </span>
                </div>
                <input
                  type="number"
                  min={25}
                  max={800}
                  step={25}
                  value={cpuPercent}
                  onChange={(e) => setCpuPercent(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs outline-none focus:border-amber-400"
                />
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[50, 100, 200, 400].map((cpu) => (
                    <button
                      key={cpu}
                      type="button"
                      onClick={() => setCpuPercent(cpu)}
                      className={`text-[10px] py-1 rounded border transition-all cursor-pointer ${
                        cpuPercent === cpu
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

            {/* 4. Startup Command & Port */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Startup Command (Fleksibel)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={startupCommand}
                    onChange={(e) => setStartupCommand(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 font-mono text-cyan-300 border border-slate-800 rounded-xl text-xs outline-none focus:border-cyan-400"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Otomatis terkonfigurasi untuk {selectedNodeObj?.name || 'Node'}. Bebas Anda sesuaikan kapan saja.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Server Port
                </label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 font-mono text-white border border-slate-800 rounded-xl text-xs outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400">Port internal listening.</p>
              </div>
            </div>
          </form>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Otomatis masuk ke panel setelah dibuat</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Membuat Panel...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-current" />
                    <span>Create Panel Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
