import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { WeightForm } from './components/WeightForm';
import { MeasureForm } from './components/MeasureForm';
import { HistoryTable } from './components/HistoryTable';
import { GeminiAssistant } from './components/GeminiAssistant';
import { SettingsModal } from './components/SettingsModal';

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

  // Load initial data
  const loadData = async () => {
    try {
      const [weightsRes, measuresRes] = await Promise.all([
        fetchWeights(),
        fetchMeasures(),
      ]);

      setWeights(weightsRes.data);
      setMeasures(measuresRes.data);
      setConnectionSource(weightsRes.source);
    } catch (e) {
      console.error('Failed to load initial data', e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWeightSubmit = async (record: WeightRecord) => {
    const res = await addWeightRecord(record);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleMeasureSubmit = async (record: MeasureRecord) => {
    const res = await addMeasureRecord(record);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        connectionSource={connectionSource}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Carregando dados da planilha corporal...</p>
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
      />
    </div>
  );
};

export default App;
