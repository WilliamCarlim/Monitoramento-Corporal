import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { WeightForm } from './components/WeightForm';
import { MeasureForm } from './components/MeasureForm';
import { HistoryTable } from './components/HistoryTable';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SettingsModal } from './components/SettingsModal';
import { CheckCircle2 } from 'lucide-react';

import { WeightRecord, MeasureRecord, UserProfile } from './types';
import {
  fetchWeights,
  addWeightRecord,
  fetchMeasures,
  addMeasureRecord,
} from './services/api';
import { getStoredProfile } from './services/storage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'weight' | 'measure' | 'history' | 'assistant'>('dashboard');
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [measures, setMeasures] = useState<MeasureRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile>(getStoredProfile());
  const [connectionSource, setConnectionSource] = useState<'cloud' | 'script' | 'local'>('local');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Load and sync data from Cloud / Sheets
  const syncData = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const [weightsRes, measuresRes] = await Promise.all([
        fetchWeights(),
        fetchMeasures(),
      ]);

      setWeights(weightsRes.data);
      setMeasures(measuresRes.data);

      const resolvedSource = weightsRes.source !== 'local' ? weightsRes.source : measuresRes.source;
      setConnectionSource(resolvedSource);

      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(timeStr);

      if (!silent) {
        setSyncToast(`Planilha sincronizada! (${weightsRes.data.length} pesagens)`);
        setTimeout(() => setSyncToast(null), 3000);
      }
    } catch (e) {
      console.error('Failed to sync data', e);
    } finally {
      if (!silent) setIsSyncing(false);
      setInitialLoading(false);
    }
  }, []);

  // 1. Sincroniza ao carregar a página pela primeira vez
  useEffect(() => {
    syncData(false);
  }, [syncData]);

  // 2. Sincroniza automaticamente quando o usuário retorna para a aba do navegador
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncData(true);
      }
    };
    const handleFocus = () => {
      syncData(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncData]);

  // 3. Sincroniza automaticamente após adicionar registro de peso
  const handleWeightSubmit = async (record: WeightRecord) => {
    const res = await addWeightRecord(record);
    if (res.success) {
      await syncData(true);
    }
    return res;
  };

  // 4. Sincroniza automaticamente após adicionar registro de medidas
  const handleMeasureSubmit = async (record: MeasureRecord) => {
    const res = await addMeasureRecord(record);
    if (res.success) {
      await syncData(true);
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast de notificação de sincronização */}
      {syncToast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        connectionSource={connectionSource}
        onSync={() => syncData(false)}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Carregando e sincronizando dados da planilha...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                weights={weights}
                measures={measures}
                profile={profile}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'weight' && (
              <WeightForm
                latestWeight={weights[weights.length - 1]}
                profile={profile}
                onSubmit={handleWeightSubmit}
                onSuccess={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'measure' && (
              <MeasureForm
                onSubmit={handleMeasureSubmit}
                onSuccess={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'history' && (
              <HistoryTable
                weights={weights}
                measures={measures}
              />
            )}

            {activeTab === 'assistant' && (
              <GeminiAssistant
                weights={weights}
                measures={measures}
              />
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onUpdateProfile={(updated) => setProfile(updated)}
        onResetCache={() => syncData(false)}
      />
    </div>
  );
};

export default App;
