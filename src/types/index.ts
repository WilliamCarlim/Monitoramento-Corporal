export interface WeightRecord {
  id?: string;
  data: string; // DD/MM/AAAA
  diaSemana: string; // Segunda-feira, etc.
  contexto: string; // Jejum matinal, Almoço / pós-academia, etc.
  peso: number; // 113.250
  variacaoAnterior?: number; // em kg
  variacaoInicial?: number; // em kg
  imc?: number;
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

export interface UserProfile {
  nome: string;
  alturaMetros: number; // ex: 1.80
  pesoInicial: number; // 113.250
  dataInicio: string; // 16/11/2026
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
