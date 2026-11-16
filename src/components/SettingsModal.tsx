import React, { useState } from 'react';
import { X, Key, Database, User, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { SPREADSHEET_ID } from '../services/api';
import { getApiSettings, saveApiSettings, saveStoredProfile } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
}) => {
  const currentSettings = getApiSettings();

  const [altura, setAltura] = useState<string>(profile.alturaMetros.toString());
  const [pesoInicial, setPesoInicial] = useState<string>(profile.pesoInicial.toString());
  const [scriptUrl, setScriptUrl] = useState<string>(currentSettings.scriptUrl || '');
  const [geminiKey, setGeminiKey] = useState<string>(currentSettings.geminiApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

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
    }, 1000);
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
              Configurações salvas com sucesso!
            </div>
          )}

          {/* Section: Planilha Google Sheets */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Planilha do Google Sheets Conectada
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                Chave da API do Gemini (GEMINI_API_KEY)
              </label>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-slate-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              Pode ser configurada como variável de ambiente <code className="text-purple-300">GEMINI_API_KEY</code> no Cloudflare Pages, ou inserida aqui para testes rápidos.
            </p>
          </div>

          {/* Section: Apps Script Web App URL */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-cyan-400" />
              URL Web App do Google Apps Script (Opcional)
            </label>
            <input
              type="url"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder-slate-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Caso use o script de ponte direta no Google Drive (código fornecido na pasta <code className="text-slate-300">google-apps-script/</code>).
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
