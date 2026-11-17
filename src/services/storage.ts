import { WeightRecord, MeasureRecord, WorkoutRecord, PhotoRecord, UserProfile } from '../types';
import { cleanDurationString } from '../utils/formatters';

export const INITIAL_USER_PROFILE: UserProfile = {
  nome: 'Usuário',
  alturaMetros: 1.80,
  alturaAppCm: 176,
  pesoInicial: 113.250,
  dataInicio: '16/11/2026',
  idade: 33,
};

export const INITIAL_WEIGHT_RECORDS: WeightRecord[] = [
  {
    id: 'w-1',
    data: '16/11/2026',
    diaSemana: 'segunda-feira',
    contexto: 'Horário do almoço, após a academia / 12:21',
    peso: 113.250,
    variacaoAnterior: 0.000,
    variacaoInicial: 0.000,
    imc: 34.95,
    gorduraPercent: 35.6,
    pesoGordura: 40.3,
    massaMuscEsqPercent: 32.3,
    pesoMassaMuscEsq: 36.5,
    massaMuscularPercent: 61.8,
    pesoMassaMuscular: 70.0,
    aguaPercent: 48.5,
    pesoAgua: 54.9,
    gorduraVisceral: 26.5,
    metabolismo: 2146.0,
    imcApp: 36.6,
    alturaApp: 176,
    idadeApp: 33,
    melhorPeso30d: 107.85,
    observacoes: 'Primeiro registro de pesagem (início do plano)',
  },
  {
    id: 'w-2',
    data: '17/11/2026',
    diaSemana: 'terça-feira',
    contexto: 'Manhã 06:41',
    peso: 111.750,
    variacaoAnterior: -1.500,
    variacaoInicial: -1.500,
    imc: 34.49,
    gorduraPercent: 35.2,
    pesoGordura: 39.4,
    massaMuscEsqPercent: 32.5,
    pesoMassaMuscEsq: 36.3,
    massaMuscularPercent: 62.1,
    pesoMassaMuscular: 69.5,
    aguaPercent: 48.6,
    pesoAgua: 54.4,
    gorduraVisceral: 26.0,
    metabolismo: 2126.0,
    imcApp: 36.1,
    alturaApp: 176,
    idadeApp: 33,
    melhorPeso30d: 107.85,
    observacoes: 'Aferição matinal em jejum',
  },
];

export const INITIAL_MEASURE_RECORDS: MeasureRecord[] = [
  {
    id: 'm-1',
    data: '16/11/2026',
    abdomen: 127,
    observacoes: 'medição preliminar com trena na altura do umbigo, soltando o ar até ficar sem fôlego; aguardando fita métrica',
  },
];

export const INITIAL_WORKOUT_RECORDS: WorkoutRecord[] = [
  {
    id: 't-1',
    data: '16/11/2026',
    diaSemana: 'segunda-feira',
    contexto: 'Entardecer 18:12',
    modalidade: 'Caminhada',
    local: 'Strava • Bariri, SP',
    distanciaKm: 5.70,
    tempoMovimento: '00:58:43',
    passos: 6944,
    elevacaoM: 51,
    calorias: 470,
    observacoes: 'Caminhada pós-treino no ritmo de recuperação',
  },
];

export const INITIAL_PHOTO_RECORDS: PhotoRecord[] = [
  {
    id: 'f-1',
    semana: 'Semana 1',
    data: '16/11/2026',
    fotoFrente: '',
    fotoLado: '',
    fotoCosta: '',
    observacoes: 'Semana 1 inicial pronta para fotos do Google Drive',
  },
];

const STORAGE_KEYS = {
  WEIGHTS: 'mc_weight_records_v2',
  MEASURES: 'mc_measure_records_v2',
  WORKOUTS: 'mc_workout_records_v2',
  PHOTOS: 'mc_photo_records_v2',
  PROFILE: 'mc_user_profile_v2',
  API_CONFIG: 'mc_api_config_v2',
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

export function getStoredWorkouts(): WorkoutRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) {
      saveStoredWorkouts(INITIAL_WORKOUT_RECORDS);
      return INITIAL_WORKOUT_RECORDS;
    }
    const list: WorkoutRecord[] = JSON.parse(raw);
    return list.map((w) => ({
      ...w,
      tempoMovimento: cleanDurationString(w.tempoMovimento),
    }));
  } catch {
    return INITIAL_WORKOUT_RECORDS;
  }
}

export function saveStoredWorkouts(records: WorkoutRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving workouts to localStorage', e);
  }
}

export function getStoredPhotos(): PhotoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    if (!raw) {
      saveStoredPhotos(INITIAL_PHOTO_RECORDS);
      return INITIAL_PHOTO_RECORDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PHOTO_RECORDS;
  }
}

export function saveStoredPhotos(records: PhotoRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving photos to localStorage', e);
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
