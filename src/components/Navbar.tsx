import React from 'react';
import {
  Activity,
  Scale,
  Ruler,
  HeartPulse,
  Dumbbell,
  Camera,
  History,
  Sparkles,
  Settings,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { SPREADSHEET_ID } from '../services/api';

export type NavTab = 'dashboard' | 'weight' | 'measure' | 'cardio' | 'workout' | 'photo' | 'history' | 'assistant';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenSettings: () => void;
  connectionSource: 'cloud' | 'script' | 'local';
  onSync: () => void;
  isSyncing: boolean;
  lastSyncTime?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  connectionSource,
  onSync,
  isSyncing,
  lastSyncTime,
}) => {
  const getBadge = () => {
    switch (connectionSource) {
      case 'cloud':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Planilha Sincronizada
          </span>
        );
      case 'script':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Web App Conectado
          </span>
        );
      case 'local':
      default:
        return (
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer"
            title="Clique para conectar a Planilha nas Configurações"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Modo Local / Conectar
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight whitespace-nowrap">
                Will Fit
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                2026
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'weight'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Peso
            </button>
            <button
              onClick={() => setActiveTab('measure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'measure'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              Medidas
            </button>
            <button
              onClick={() => setActiveTab('cardio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'cardio'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
              Cardio
            </button>
            <button
              onClick={() => setActiveTab('workout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'workout'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5 text-purple-300" />
              Musculação
            </button>
            <button
              onClick={() => setActiveTab('photo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'photo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              Fotos
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Gemini AI
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title={lastSyncTime ? `Última sincronização: ${lastSyncTime}` : 'Sincronizar com a Planilha'}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </button>

            {/* Connection badge */}
            <div className="hidden sm:block">{getBadge()}</div>

            {/* Direct Google Sheets button */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Abrir Planilha Google Sheets"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Configurações e Integração"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar at bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1.5 flex justify-around overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'weight' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Scale className="w-4 h-4" />
          Peso
        </button>
        <button
          onClick={() => setActiveTab('measure')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'measure' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Ruler className="w-4 h-4" />
          Medidas
        </button>
        <button
          onClick={() => setActiveTab('cardio')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'cardio' ? 'text-sky-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          Cardio
        </button>
        <button
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'workout' ? 'text-purple-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Musculação
        </button>
        <button
          onClick={() => setActiveTab('photo')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'photo' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Camera className="w-4 h-4" />
          Fotos
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'history' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          Histórico
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] ${
            activeTab === 'assistant' ? 'text-purple-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Gemini
        </button>
      </div>
    </header>
  );
};
