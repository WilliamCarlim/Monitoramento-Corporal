import React from 'react';
import { Activity, Scale, Ruler, History, Sparkles, Settings, ExternalLink } from 'lucide-react';
import { SPREADSHEET_ID } from '../services/api';

interface NavbarProps {
  activeTab: 'dashboard' | 'weight' | 'measure' | 'history' | 'assistant';
  setActiveTab: (tab: 'dashboard' | 'weight' | 'measure' | 'history' | 'assistant') => void;
  onOpenSettings: () => void;
  connectionSource: 'cloud' | 'script' | 'local';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
  connectionSource,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Planilha Conectada (Web App)
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
            Conectar Planilha
          </button>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Monitor Corporal
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                  2026
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Acompanhamento em Tempo Real & Gemini AI
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'weight'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Scale className="w-4 h-4" />
              Lançar Peso
            </button>
            <button
              onClick={() => setActiveTab('measure')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'measure'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Ruler className="w-4 h-4" />
              Medidas
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'assistant'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              Gemini AI
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block">{getBadge()}</div>

            <a
              href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
              title="Abrir Planilha do Google Sheets"
            >
              <ExternalLink className="w-5 h-5" />
            </a>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Configurações e Integração"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Activity className="w-5 h-5" />
          Início
        </button>
        <button
          onClick={() => setActiveTab('weight')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            activeTab === 'weight' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Scale className="w-5 h-5" />
          Peso
        </button>
        <button
          onClick={() => setActiveTab('measure')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            activeTab === 'measure' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Ruler className="w-5 h-5" />
          Medidas
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            activeTab === 'history' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-5 h-5" />
          Tabela
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs ${
            activeTab === 'assistant' ? 'text-purple-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          Gemini
        </button>
      </div>
    </header>
  );
};
