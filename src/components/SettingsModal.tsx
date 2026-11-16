import React, { useState } from 'react';
import { X, Key, Database, User, Check, ExternalLink, ShieldCheck, Trash2 } from 'lucide-react';
import { UserProfile } from '../types';
import { SPREADSHEET_ID } from '../services/api';
import { getApiSettings, saveApiSettings, saveStoredProfile } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetCache?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onResetCache,
}) => {
  const currentSettings = getApiSettings();

  const [altura, setAltura] = useState<string>(profile.alturaMetros.toString());
  const [pesoInicial, setPesoInicial] = useState<string>(profile.pesoInicial.toString());
  const [scriptUrl, setScriptUrl] = useState<string>(currentSettings.scriptUrl || '');
  const [geminiKey, setGeminiKey] = useState<string>(currentSettings.geminiApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAltura = parseFloat(altura.replace(',', '.'));
    const parsedPesoInicial = parseFloat(pesoInicial.replace(',', '.'));

    const updatedProfile: UserProfile = {
      ...profile,
      alturaMetros: isNaN(parsedAltura) ? 1.80 : parsedAltura,
      pesoInicial: isNaN(parsedPesoInicial) ? 113.250 : parsedPesoInicial,
    };

    saveStoredProfile(updatedProfile);
    onUpdateProfile(updatedProfile);

    saveApiSettings({
      scriptUrl: scriptUrl.trim() || undefined,
      geminiApiKey: geminiKey.trim() || undefined,
      mode: scriptUrl.trim() ? 'script' : 'cloud',
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      if (onResetCache) onResetCache();
    }, 1000);
  };

  const handleClearCache = () => {
    localStorage.removeItem('mc_weight_records_v1');
    localStorage.removeItem('mc_measure_records_v1');
    setCacheCleared(true);
    setTimeout(() => {
      setCacheCleared(false);
      if (onResetCache) onResetCache();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configurações & Conexões</h3>
              <p className="text-xs text-slate-400">Google Sheets, Gemini e Perfil de Referência</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-5 space-y-5">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl flex items-center gap-2 text-emerald-300 text-sm">
              <Check className="w-4 h-4 text-emerald-400" />
              Configurações salvas e aplicadas!
            </div>
          )}

          {cacheCleared && (
            <div className="p-3 bg-amber-950/60 border border-amber-500/50 rounded-xl flex items-center gap-2 text-amber-300 text-sm">
              <Check className="w-4 h-4 text-amber-400" />
              Registros locais limpos! Buscando da planilha...
            </div>
          )}

          {/* Section: Apps Script Web App URL */}
          <div className="space-y-2 p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              URL do Google Apps Script (Web App)
            </label>
            <input
              type="url"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 font-mono focus:border-cyan-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-300">
              Cole aqui a URL gerada em <strong>Implantar &gt; Gerenciar implantações</strong> no Google Sheets para conectar diretamente o seu navegador à planilha!
            </p>
          </div>

          {/* Section: Planilha Google Sheets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Planilha Oficial
            </label>
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nome:</span>
                <span className="text-slate-200 font-medium">Acompanhamento Corporal - Peso e Medidas 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">ID da Planilha:</span>
                <span className="text-emerald-300 font-mono text-[11px] truncate max-w-[200px]">
                  {SPREADSHEET_ID}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  Abrir planilha original no Google Drive <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Section: Perfil */}
          <div className="space-y-3 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Parâmetros Corporais de Referência
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Altura Padrão (m)</label>
                <input
                  type="text"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  placeholder="1.80"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Peso Inicial (kg)</label>
                <input
                  type="text"
                  value={pesoInicial}
                  onChange={(e) => setPesoInicial(e.target.value)}
                  placeholder="113.250"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Gemini API Key */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              Chave da API do Gemini (GEMINI_API_KEY)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Para análises com inteligência artificial no site.
            </p>
          </div>

          {/* Clear Cache Button */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-500/20 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Registros Locais (Reset)
            </button>
            <p className="text-[10px] text-slate-400 max-w-[220px] text-right">
              Apaga registros de teste do navegador e puxa a planilha limpa.
            </p>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-md transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
