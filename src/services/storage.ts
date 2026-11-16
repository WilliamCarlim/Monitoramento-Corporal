import { WeightRecord, MeasureRecord, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  nome: 'Usuário',
  alturaMetros: 1.80,
  pesoInicial: 113.250,
  dataInicio: '16/11/2026',
};

export const INITIAL_WEIGHT_RECORDS: WeightRecord[] = [
  {
    id: 'w-1',
    data: '16/11/2026',
    diaSemana: 'Segunda-feira',
    contexto: 'Almoço / pós-academia',
    peso: 113.250,
    variacaoAnterior: 0.000,
    variacaoInicial: 0.000,
    imc: 34.95,
    observacoes: 'Medição inicial pós-treino (baseline)',
  },
];

export const INITIAL_MEASURE_RECORDS: MeasureRecord[] = [
  {
    id: 'm-1',
    data: '16/11/2026',
    abdomen: 127,
    observacoes: 'Medida preliminar com trena na altura do umbigo expirando até ficar sem fôlego',
  },
];

const STORAGE_KEYS = {
  WEIGHTS: 'mc_weight_records_v1',
  MEASURES: 'mc_measure_records_v1',
  PROFILE: 'mc_user_profile_v1',
  API_CONFIG: 'mc_api_config_v1',
};

export function getStoredWeights(): WeightRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
    if (!raw) {
      saveStoredWeights(INITIAL_WEIGHT_RECORDS);
      return INITIAL_WEIGHT_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_WEIGHT_RECORDS;
  }
}

export function saveStoredWeights(records: WeightRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WEIGHTS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving weights to localStorage', e);
  }
}

export function getStoredMeasures(): MeasureRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEASURES);
    if (!raw) {
      saveStoredMeasures(INITIAL_MEASURE_RECORDS);
      return INITIAL_MEASURE_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEASURE_RECORDS;
  }
}

export function saveStoredMeasures(records: MeasureRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEASURES, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving measures to localStorage', e);
  }
}

export function getStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      saveStoredProfile(INITIAL_USER_PROFILE);
      return INITIAL_USER_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USER_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile to localStorage', e);
  }
}

export function getApiSettings(): { scriptUrl?: string; geminiApiKey?: string; mode: 'cloud' | 'script' | 'local' } {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { mode: 'cloud' };
}

export function saveApiSettings(settings: { scriptUrl?: string; geminiApiKey?: string; mode: 'cloud' | 'script' | 'local' }): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving API settings', e);
  }
}
