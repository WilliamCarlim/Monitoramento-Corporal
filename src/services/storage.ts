import { WeightRecord, MeasureRecord, CardioRecord, WorkoutRecord, PhotoRecord, UserProfile } from '../types';
import { cleanDurationString } from '../utils/formatters';

export const INITIAL_USER_PROFILE: UserProfile = {
  nome: 'Usuário',
  alturaMetros: 1.76,
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
    observacoes: 'Primeiro registro de pesagem (início do plano) • App 16/11 12:21 (vs 20/10 +5,40 kg)',
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
    observacoes: 'Pesagem matinal (Gordura corporal: 35,2%)',
  },
  {
    id: 'w-3',
    data: '18/11/2026',
    diaSemana: 'quarta-feira',
    contexto: 'Manhã 06:30',
    peso: 111.500,
    variacaoAnterior: -0.250,
    variacaoInicial: -1.750,
    imc: 36.00,
    gorduraPercent: 35.2,
    pesoGordura: 39.2,
    massaMuscEsqPercent: 32.5,
    pesoMassaMuscEsq: 36.2,
    massaMuscularPercent: 62.2,
    pesoMassaMuscular: 69.4,
    aguaPercent: 48.6,
    pesoAgua: 54.2,
    gorduraVisceral: 25.5,
    metabolismo: 2123.0,
    imcApp: 36.0,
    alturaApp: 176,
    idadeApp: 33,
    melhorPeso30d: 107.85,
    observacoes: 'Pesagem matinal (Evolução contínua: 111,500 kg)',
  },
  {
    id: 'w-4',
    data: '19/11/2026',
    diaSemana: 'quinta-feira',
    contexto: 'Manhã 06:15',
    peso: 111.450,
    variacaoAnterior: -0.050,
    variacaoInicial: -1.800,
    imc: 35.98,
    gorduraPercent: 35.2,
    pesoGordura: 39.2,
    massaMuscEsqPercent: 32.5,
    pesoMassaMuscEsq: 36.2,
    massaMuscularPercent: 62.2,
    pesoMassaMuscular: 69.3,
    aguaPercent: 48.6,
    pesoAgua: 54.2,
    gorduraVisceral: 25.5,
    metabolismo: 2122.0,
    imcApp: 36.0,
    alturaApp: 176,
    idadeApp: 33,
    melhorPeso30d: 107.85,
    observacoes: 'Pesagem matinal 06:15 • Ossos: 2,9 kg, Proteína: 13,5%, LBM: 72,3 kg, Idade metabólica: 43',
  },
];

export const INITIAL_MEASURE_RECORDS: MeasureRecord[] = [
  {
    id: 'm-0',
    data: '17/11/2026',
    pesoAvaliacao: 112.0,
    gorduraAvaliacao: 40.3,
    massaGordura: 45.1,
    massaSemGordura: 66.9,
    observacoes: 'Avaliação Panobianco Bariri • Ticket 1038, Máquina 8678 (Altura: 176 cm, Idade: 34)',
  },
  {
    id: 'm-1',
    data: '16/11/2026',
    abdomen: 127,
    observacoes: 'Medição preliminar com trena na altura do umbigo, soltando o ar até ficar sem fôlego (aguardando fita métrica oficial)',
  },
];

export const INITIAL_CARDIO_RECORDS: CardioRecord[] = [
  {
    id: 'c-1',
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
    observacoes: 'Caminhada ao entardecer registrada no Strava (ritmo médio ~10,3 min/km)',
  },
  {
    id: 'c-2',
    data: '17/11/2026',
    diaSemana: 'terça-feira',
    contexto: 'Entardecer 17:40',
    modalidade: 'Caminhada',
    local: 'Strava • Bariri, SP',
    distanciaKm: 5.70,
    tempoMovimento: '00:57:28',
    passos: 6968,
    elevacaoM: 50,
    calorias: 444,
    observacoes: 'Caminhada ao entardecer registrada no Strava (ritmo médio ~10,1 min/km)',
  },
  {
    id: 'c-3',
    data: '18/11/2026',
    diaSemana: 'quarta-feira',
    contexto: 'Manhã 05:21',
    modalidade: 'Caminhada',
    local: 'Strava • Lago Municipal',
    distanciaKm: 5.34,
    tempoMovimento: '01:01:19',
    passos: 6948,
    elevacaoM: 48,
    calorias: 452,
    observacoes: 'Caminhada matinal no Lago Municipal registrada no Strava',
  },
];

export const INITIAL_WORKOUT_RECORDS: WorkoutRecord[] = [
  {
    id: 't-1',
    data: '16/11/2026',
    diaSemana: 'segunda-feira',
    contexto: 'Academia Fast fit',
    focoDivisao: 'Peitoral / Tríceps',
    duracaoMin: 55,
    exerciciosCargas: 'Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50); Crucifixo na polia - 3 séries (7.5); Tríceps francês - 3 séries; Tríceps corda - 3 séries (17.5); Tríceps testa com halteres - 3 séries',
    calorias: 348,
    observacoes: '7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...',
  },
  {
    id: 't-2',
    data: '17/11/2026',
    diaSemana: 'terça-feira',
    contexto: 'Fast fit • 11:59',
    focoDivisao: 'Quadríceps',
    duracaoMin: 40,
    exerciciosCargas: 'Agachamento máquina - 4 séries; Leg press 45° - 4 séries; Cadeira extensora - 4 séries; Panturrilha no leg - 3 séries',
    calorias: 285,
    observacoes: 'Treino de pernas / quadríceps executado • Fast fit • 11:59',
  },
  {
    id: 't-3',
    data: '18/11/2026',
    diaSemana: 'quarta-feira',
    contexto: 'Fast fit',
    focoDivisao: 'Costas / Bíceps',
    duracaoMin: 40,
    exerciciosCargas: 'Puxada alta frente - 4 séries; Remada baixa triângulo - 4 séries; Remada curvada máquina - 3 séries; Rosca direta - 3 séries; Rosca alternada com halteres - 3 séries',
    calorias: 283,
    observacoes: 'Treino de costas e bíceps • Fast fit (estimativa 283 kcal)',
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
  WEIGHTS: 'mc_weight_records_v7',
  MEASURES: 'mc_measure_records_v7',
  CARDIOS: 'mc_cardio_records_v7',
  WORKOUTS: 'mc_workout_records_v7',
  PHOTOS: 'mc_photo_records_v7',
  PROFILE: 'mc_user_profile_v7',
  API_CONFIG: 'mc_api_config_v6',
};

export function getStoredWeights(): WeightRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEIGHTS);
    if (!raw) {
      const oldRaw = localStorage.getItem('mc_weight_records_v6');
      if (oldRaw) {
        try {
          const oldList: WeightRecord[] = JSON.parse(oldRaw);
          const merged = [...oldList];
          INITIAL_WEIGHT_RECORDS.forEach(init => {
            if (!merged.some(m => m.data === init.data || m.id === init.id)) {
              merged.push(init);
            }
          });
          saveStoredWeights(merged);
          return merged;
        } catch {}
      }
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
      const oldRaw = localStorage.getItem('mc_measure_records_v6');
      if (oldRaw) {
        try {
          const oldList: MeasureRecord[] = JSON.parse(oldRaw);
          const merged = [...oldList];
          INITIAL_MEASURE_RECORDS.forEach(init => {
            if (!merged.some(m => m.data === init.data || m.id === init.id)) {
              merged.push(init);
            }
          });
          saveStoredMeasures(merged);
          return merged;
        } catch {}
      }
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

export function getStoredCardios(): CardioRecord[] {
  try {
    let list: CardioRecord[] = [];
    const raw = localStorage.getItem(STORAGE_KEYS.CARDIOS);
    if (!raw) {
      const oldRaw = localStorage.getItem('mc_cardio_records_v6');
      if (oldRaw) {
        try {
          const oldList: CardioRecord[] = JSON.parse(oldRaw);
          const merged = [...oldList];
          INITIAL_CARDIO_RECORDS.forEach(init => {
            if (!merged.some(m => m.data === init.data || m.id === init.id)) {
              merged.push(init);
            }
          });
          list = merged;
        } catch {}
      }
      if (list.length === 0) {
        list = INITIAL_CARDIO_RECORDS;
      }
      saveStoredCardios(list);
    } else {
      list = JSON.parse(raw);
    }
    return list.map((c) => ({
      ...c,
      tempoMovimento: cleanDurationString(c.tempoMovimento),
    }));
  } catch {
    return INITIAL_CARDIO_RECORDS;
  }
}

export function saveStoredCardios(records: CardioRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDIOS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving cardios to localStorage', e);
  }
}

export function getStoredWorkouts(): WorkoutRecord[] {
  try {
    let list: WorkoutRecord[] = [];
    const raw = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!raw) {
      const oldRaw = localStorage.getItem('mc_workout_records_v6');
      if (oldRaw) {
        try {
          const oldList: WorkoutRecord[] = JSON.parse(oldRaw);
          const merged = [...oldList];
          INITIAL_WORKOUT_RECORDS.forEach(init => {
            if (!merged.some(m => m.data === init.data || m.id === init.id)) {
              merged.push(init);
            }
          });
          list = merged;
        } catch {}
      }
      if (list.length === 0) {
        list = INITIAL_WORKOUT_RECORDS;
      }
      saveStoredWorkouts(list);
    } else {
      list = JSON.parse(raw);
    }
    return list;
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
    let raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) {
      raw = localStorage.getItem('mc_user_profile_v6');
    }
    if (!raw) {
      saveStoredProfile(INITIAL_USER_PROFILE);
      return INITIAL_USER_PROFILE;
    }
    const parsed: UserProfile = JSON.parse(raw);
    if (parsed.alturaMetros === 1.80 || parsed.alturaMetros === 1.8) {
      parsed.alturaMetros = 1.76;
    }
    if (parsed.alturaAppCm === 180) {
      parsed.alturaAppCm = 176;
    }
    saveStoredProfile(parsed);
    return parsed;
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

export interface ApiSettings {
  spreadsheetId: string;
  scriptUrl: string;
  geminiKey: string;
}

export function getApiSettings(): ApiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {
    spreadsheetId: '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U',
    scriptUrl: '',
    geminiKey: '',
  };
}

export function saveApiSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving API settings', e);
  }
}
