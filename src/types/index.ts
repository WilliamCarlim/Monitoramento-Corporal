export interface WeightRecord {
  id?: string;
  data: string; // DD/MM/AAAA
  diaSemana: string; // Segunda-feira, etc.
  contexto: string; // Horário do almoço, após a academia / 12:21, Manhã 06:41, etc.
  peso: number; // ex: 111.750
  variacaoAnterior?: number; // em kg
  variacaoInicial?: number; // em kg
  imc?: number;
  gorduraPercent?: number; // % (ex: 35.2)
  pesoGordura?: number; // kg (ex: 39.4)
  massaMuscEsqPercent?: number; // % (ex: 32.5)
  pesoMassaMuscEsq?: number; // kg (ex: 36.3)
  massaMuscularPercent?: number; // % (ex: 62.1)
  pesoMassaMuscular?: number; // kg (ex: 69.5)
  aguaPercent?: number; // % (ex: 48.6)
  pesoAgua?: number; // kg (ex: 54.4)
  gorduraVisceral?: number; // (ex: 26.0)
  metabolismo?: number; // kcal/dia (ex: 2126.0)
  imcApp?: number; // (ex: 36.1)
  alturaApp?: number; // cm (ex: 176)
  idadeApp?: number; // (ex: 33)
  melhorPeso30d?: number; // kg (ex: 107.85)
  observacoes?: string;
}

export interface MeasureRecord {
  id?: string;
  data: string; // DD/MM/AAAA
  pescoco?: number;
  ombro?: number;
  torax?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  bracoDir?: number;
  bracoEsq?: number;
  antebracoDir?: number;
  antebracoEsq?: number;
  coxaDir?: number;
  coxaEsq?: number;
  panturrilhaDir?: number;
  panturrilhaEsq?: number;
  observacoes?: string;
}

export interface WorkoutRecord {
  id?: string;
  data: string; // DD/MM/AAAA
  diaSemana: string; // Segunda-feira, etc.
  contexto: string; // Entardecer 18:12, etc.
  modalidade: string; // Caminhada, Corrida, Musculação, Ciclismo, etc.
  local: string; // Strava • Bariri, SP, etc.
  distanciaKm?: number; // 5.70
  tempoMovimento: string; // 00:58:43
  passos?: number; // 6944
  elevacaoM?: number; // 51
  calorias?: number; // 470
  observacoes?: string;
}

export interface PhotoRecord {
  id?: string;
  semana: string; // Semana 1, Semana 2, etc.
  data: string; // DD/MM/AAAA
  fotoFrente?: string; // Link Drive ou URL
  fotoLado?: string;
  fotoCosta?: string;
  observacoes?: string;
}

export interface UserProfile {
  nome: string;
  alturaMetros: number; // ex: 1.80
  alturaAppCm?: number; // ex: 176
  pesoInicial: number; // 113.250
  dataInicio: string; // 16/11/2026
  idade?: number; // 33
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ApiStatus {
  sheetsConfigured: boolean;
  geminiConfigured: boolean;
  mode: 'cloud' | 'script' | 'local';
}
