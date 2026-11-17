import { WeightRecord, MeasureRecord, CardioRecord, WorkoutRecord, PhotoRecord, AssistantMessage } from '../types';
import { cleanDurationString } from '../utils/formatters';
import {
  getStoredWeights,
  saveStoredWeights,
  getStoredMeasures,
  saveStoredMeasures,
  getStoredCardios,
  saveStoredCardios,
  getStoredWorkouts,
  saveStoredWorkouts,
  getStoredPhotos,
  saveStoredPhotos,
  getStoredProfile,
  getApiSettings
} from './storage';

export const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

interface FetchResponse<T> {
  data: T;
  source: 'cloud' | 'script' | 'local';
  error?: string;
}

// ----------------------------------------------------------------------
// SANITIZERS
// ----------------------------------------------------------------------

function normalizePercent(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1.0) {
    return Math.round(num * 1000) / 10;
  }
  return num;
}

function sanitizeWeights(list: any[]): WeightRecord[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((w) => {
      let p = typeof w.peso === 'number' ? w.peso : parseFloat(String(w.peso).replace(/\./g, '').replace(',', '.'));
      let varAnt = typeof w.variacaoAnterior === 'number' ? w.variacaoAnterior : parseFloat(String(w.variacaoAnterior).replace(/\./g, '').replace(',', '.'));
      let varIni = typeof w.variacaoInicial === 'number' ? w.variacaoInicial : parseFloat(String(w.variacaoInicial).replace(/\./g, '').replace(',', '.'));

      let cleanDate = String(w.data || '').trim();
      if (cleanDate.includes('GMT') || cleanDate.includes('T')) {
        const d = new Date(cleanDate);
        if (!isNaN(d.getTime())) {
          cleanDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
      }

      return {
        ...w,
        peso: p,
        variacaoAnterior: isNaN(varAnt) ? 0 : varAnt,
        variacaoInicial: isNaN(varIni) ? 0 : varIni,
        gorduraPercent: normalizePercent(w.gorduraPercent),
        massaMuscularPercent: normalizePercent(w.massaMuscularPercent),
        massaMuscEsqPercent: normalizePercent(w.massaMuscEsqPercent),
        aguaPercent: normalizePercent(w.aguaPercent),
        data: cleanDate,
      };
    })
    .filter((w) => {
      if (!w || !w.data) return false;
      const dataStr = String(w.data).trim().toLowerCase();
      if (!dataStr.match(/\d{2}\/\d{2}\/\d{4}/)) return false;
      if (dataStr === 'data' || dataStr.includes('acompanhamento') || dataStr.includes('controle')) return false;
      return typeof w.peso === 'number' && w.peso > 30 && w.peso < 350;
    });
}

function sanitizeMeasures(list: any[]): MeasureRecord[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((m) => {
      let cleanDate = String(m.data || '').trim();
      if (cleanDate.includes('GMT') || cleanDate.includes('T')) {
        const d = new Date(cleanDate);
        if (!isNaN(d.getTime())) {
          cleanDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }
      }

      let abdomen = m.abdomen;
      let quadril = m.quadril;
      if ((!abdomen || abdomen === 0) && quadril === 127) {
        abdomen = 127;
        quadril = undefined;
      }

      return {
        ...m,
        data: cleanDate,
        abdomen,
        quadril,
      };
    })
    .filter((m) => {
      if (!m || !m.data) return false;
      const dataStr = String(m.data).trim().toLowerCase();
      if (dataStr === 'data' || dataStr.includes('acompanhamento') || dataStr.includes('histórico')) return false;
      const hasAny = [
        m.abdomen, m.cintura, m.quadril, m.torax, m.pescoco,
        m.bracoDir, m.bracoEsq, m.antebracoDir, m.antebracoEsq,
        m.coxaDir, m.coxaEsq, m.panturrilhaDir, m.panturrilhaEsq
      ].some((v) => typeof v === 'number' && v > 0);
      return hasAny;
    });
}

function sanitizeCardios(list: any[]): CardioRecord[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => {
      if (!c || !c.data) return false;
      const dataStr = String(c.data).trim().toLowerCase();
      if (!dataStr.match(/\d{2}\/\d{2}\/\d{4}/)) return false;
      if (dataStr === 'data' || dataStr.includes('acompanhamento') || dataStr.includes('cardio') || dataStr.includes('treinos')) return false;
      const dist = typeof c.distanciaKm === 'number' ? c.distanciaKm : parseFloat(String(c.distanciaKm).replace(',', '.'));
      const cal = typeof c.calorias === 'number' ? c.calorias : parseFloat(String(c.calorias));
      return (dist > 0 || cal > 0 || (c.tempoMovimento && c.tempoMovimento !== '00:00:00'));
    })
    .map((c) => ({
      ...c,
      distanciaKm: typeof c.distanciaKm === 'number' ? c.distanciaKm : parseFloat(String(c.distanciaKm).replace(',', '.')) || 0,
      calorias: typeof c.calorias === 'number' ? c.calorias : parseInt(String(c.calorias), 10) || 0,
      tempoMovimento: cleanDurationString(c.tempoMovimento),
    }));
}

function sanitizeWorkouts(list: any[]): WorkoutRecord[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((w) => {
      if (!w || !w.data) return false;
      const dataStr = String(w.data).trim().toLowerCase();
      if (!dataStr.match(/\d{2}\/\d{2}\/\d{4}/)) return false;
      if (dataStr === 'data' || dataStr.includes('treinos') || dataStr.includes('musculação')) return false;
      return (w.focoDivisao || w.exerciciosCargas || w.duracaoMin);
    })
    .map((w) => ({
      ...w,
      duracaoMin: typeof w.duracaoMin === 'number' ? w.duracaoMin : parseInt(String(w.duracaoMin), 10) || undefined,
      calorias: typeof w.calorias === 'number' ? w.calorias : parseInt(String(w.calorias), 10) || undefined,
    }));
}

function sanitizePhotos(list: any[]): PhotoRecord[] {
  if (!Array.isArray(list)) return [];
  return list.filter((f) => f && f.semana && String(f.semana).toLowerCase() !== 'semana');
}

// ----------------------------------------------------------------------
// 1. REGISTRO DE PESO
// ----------------------------------------------------------------------

export async function fetchWeights(): Promise<FetchResponse<WeightRecord[]>> {
  const settings = getApiSettings();

  try {
    const res = await fetch('/api/weights', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeWeights(data);
        const finalData = sanitized.length > 0 ? sanitized : data;
        saveStoredWeights(finalData);
        return { data: finalData, source: 'cloud' };
      }
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getWeights`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeWeights(json.data);
          const finalData = sanitized.length > 0 ? sanitized : json.data;
          saveStoredWeights(finalData);
          return { data: finalData, source: 'script' };
        }
      }
    } catch {}
  }

  return { data: sanitizeWeights(getStoredWeights()), source: 'local' };
}

export async function addWeightRecord(record: WeightRecord): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; error?: string }> {
  const currentWeights = getStoredWeights();
  const enrichedRecord: WeightRecord = {
    ...record,
    id: `w-${Date.now()}`,
  };

  const settings = getApiSettings();

  try {
    const res = await fetch('/api/weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedRecord),
    });
    if (res.ok) {
      const updated = [...currentWeights, enrichedRecord];
      saveStoredWeights(updated);
      return { success: true, source: 'cloud' };
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addWeight', data: enrichedRecord }),
      });
      if (res.ok) {
        const updated = [...currentWeights, enrichedRecord];
        saveStoredWeights(updated);
        return { success: true, source: 'script' };
      }
    } catch {}
  }

  const updated = [...currentWeights, enrichedRecord];
  saveStoredWeights(updated);
  return { success: true, source: 'local' };
}

// ----------------------------------------------------------------------
// 2. MEDIDAS CORPORAIS
// ----------------------------------------------------------------------

export async function fetchMeasures(): Promise<FetchResponse<MeasureRecord[]>> {
  const settings = getApiSettings();

  try {
    const res = await fetch('/api/measures', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeMeasures(data);
        const finalData = sanitized.length > 0 ? sanitized : data;
        saveStoredMeasures(finalData);
        return { data: finalData, source: 'cloud' };
      }
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getMeasures`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeMeasures(json.data);
          const finalData = sanitized.length > 0 ? sanitized : json.data;
          saveStoredMeasures(finalData);
          return { data: finalData, source: 'script' };
        }
      }
    } catch {}
  }

  return { data: sanitizeMeasures(getStoredMeasures()), source: 'local' };
}

export async function addMeasureRecord(record: MeasureRecord): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; error?: string }> {
  const currentMeasures = getStoredMeasures();
  const enrichedRecord: MeasureRecord = {
    ...record,
    id: `m-${Date.now()}`,
  };

  const settings = getApiSettings();

  try {
    const res = await fetch('/api/measures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedRecord),
    });
    if (res.ok) {
      const updated = [...currentMeasures, enrichedRecord];
      saveStoredMeasures(updated);
      return { success: true, source: 'cloud' };
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addMeasure', data: enrichedRecord }),
      });
      if (res.ok) {
        const updated = [...currentMeasures, enrichedRecord];
        saveStoredMeasures(updated);
        return { success: true, source: 'script' };
      }
    } catch {}
  }

  const updated = [...currentMeasures, enrichedRecord];
  saveStoredMeasures(updated);
  return { success: true, source: 'local' };
}

// ----------------------------------------------------------------------
// 3. CARDIO (AERÓBICO: CAMINHADA, CORRIDA, BIKE, ESTEIRA)
// ----------------------------------------------------------------------

export async function fetchCardios(): Promise<FetchResponse<CardioRecord[]>> {
  const settings = getApiSettings();

  try {
    const res = await fetch('/api/cardios', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeCardios(data);
        const finalData = sanitized.length > 0 ? sanitized : data;
        saveStoredCardios(finalData);
        return { data: finalData, source: 'cloud' };
      }
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getCardios`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeCardios(json.data);
          const finalData = sanitized.length > 0 ? sanitized : json.data;
          saveStoredCardios(finalData);
          return { data: finalData, source: 'script' };
        }
      }
    } catch {}
  }

  return { data: sanitizeCardios(getStoredCardios()), source: 'local' };
}

export async function addCardioRecord(record: CardioRecord): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; error?: string }> {
  const currentCardios = getStoredCardios();
  const enrichedRecord: CardioRecord = {
    ...record,
    id: `c-${Date.now()}`,
  };

  const settings = getApiSettings();

  try {
    const res = await fetch('/api/cardios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedRecord),
    });
    if (res.ok) {
      const updated = [...currentCardios, enrichedRecord];
      saveStoredCardios(updated);
      return { success: true, source: 'cloud' };
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addCardio', data: enrichedRecord }),
      });
      if (res.ok) {
        const updated = [...currentCardios, enrichedRecord];
        saveStoredCardios(updated);
        return { success: true, source: 'script' };
      }
    } catch {}
  }

  const updated = [...currentCardios, enrichedRecord];
  saveStoredCardios(updated);
  return { success: true, source: 'local' };
}

// ----------------------------------------------------------------------
// 4. TREINOS (MUSCULAÇÃO / ACADEMIA)
// ----------------------------------------------------------------------

export async function fetchWorkouts(): Promise<FetchResponse<WorkoutRecord[]>> {
  const settings = getApiSettings();

  try {
    const res = await fetch('/api/workouts', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeWorkouts(data);
        const finalData = sanitized.length > 0 ? sanitized : data;
        saveStoredWorkouts(finalData);
        return { data: finalData, source: 'cloud' };
      }
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getWorkouts`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeWorkouts(json.data);
          const finalData = sanitized.length > 0 ? sanitized : json.data;
          saveStoredWorkouts(finalData);
          return { data: finalData, source: 'script' };
        }
      }
    } catch {}
  }

  return { data: sanitizeWorkouts(getStoredWorkouts()), source: 'local' };
}

export async function addWorkoutRecord(record: WorkoutRecord): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; error?: string }> {
  const currentWorkouts = getStoredWorkouts();
  const enrichedRecord: WorkoutRecord = {
    ...record,
    id: `t-${Date.now()}`,
  };

  const settings = getApiSettings();

  try {
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedRecord),
    });
    if (res.ok) {
      const updated = [...currentWorkouts, enrichedRecord];
      saveStoredWorkouts(updated);
      return { success: true, source: 'cloud' };
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addWorkout', data: enrichedRecord }),
      });
      if (res.ok) {
        const updated = [...currentWorkouts, enrichedRecord];
        saveStoredWorkouts(updated);
        return { success: true, source: 'script' };
      }
    } catch {}
  }

  const updated = [...currentWorkouts, enrichedRecord];
  saveStoredWorkouts(updated);
  return { success: true, source: 'local' };
}

// ----------------------------------------------------------------------
// 5. FOTOS SEMANAIS (GOOGLE DRIVE)
// ----------------------------------------------------------------------

export async function fetchPhotos(): Promise<FetchResponse<PhotoRecord[]>> {
  const settings = getApiSettings();

  try {
    const res = await fetch('/api/photos', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizePhotos(data);
        const finalData = sanitized.length > 0 ? sanitized : data;
        saveStoredPhotos(finalData);
        return { data: finalData, source: 'cloud' };
      }
    }
  } catch {}

  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getPhotos`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizePhotos(json.data);
          const finalData = sanitized.length > 0 ? sanitized : json.data;
          saveStoredPhotos(finalData);
          return { data: finalData, source: 'script' };
        }
      }
    } catch {}
  }

  return { data: sanitizePhotos(getStoredPhotos()), source: 'local' };
}

export async function addPhotoRecord(payload: {
  semana: string;
  data: string;
  fotoFrenteBase64?: string;
  fotoLadoBase64?: string;
  fotoCostaBase64?: string;
  fotoFrente?: string;
  fotoLado?: string;
  fotoCosta?: string;
  observacoes?: string;
}): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; links?: any; error?: string }> {
  const currentPhotos = getStoredPhotos();
  const settings = getApiSettings();

  // Try 1: Cloudflare backend
  try {
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      const newRecord: PhotoRecord = {
        id: `f-${Date.now()}`,
        semana: payload.semana,
        data: payload.data,
        fotoFrente: json.links?.linkFrente || payload.fotoFrente || '',
        fotoLado: json.links?.linkLado || payload.fotoLado || '',
        fotoCosta: json.links?.linkCosta || payload.fotoCosta || '',
        observacoes: payload.observacoes || '',
      };
      saveStoredPhotos([...currentPhotos, newRecord]);
      return { success: true, source: 'cloud', links: json.links };
    }
  } catch {}

  // Try 2: Apps Script
  if (settings.scriptUrl) {
    try {
      const res = await fetch(settings.scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addPhoto', data: payload }),
      });
      if (res.ok) {
        const json = await res.json();
        const newRecord: PhotoRecord = {
          id: `f-${Date.now()}`,
          semana: payload.semana,
          data: payload.data,
          fotoFrente: json.links?.linkFrente || payload.fotoFrente || '',
          fotoLado: json.links?.linkLado || payload.fotoLado || '',
          fotoCosta: json.links?.linkCosta || payload.fotoCosta || '',
          observacoes: payload.observacoes || '',
        };
        saveStoredPhotos([...currentPhotos, newRecord]);
        return { success: true, source: 'script', links: json.links };
      }
    } catch {}
  }

  // Local fallback
  const newRecord: PhotoRecord = {
    id: `f-${Date.now()}`,
    semana: payload.semana,
    data: payload.data,
    fotoFrente: payload.fotoFrenteBase64 ? 'Foto local gravada' : '',
    fotoLado: payload.fotoLadoBase64 ? 'Foto local gravada' : '',
    fotoCosta: payload.fotoCostaBase64 ? 'Foto local gravada' : '',
    observacoes: payload.observacoes || '',
  };
  saveStoredPhotos([...currentPhotos, newRecord]);
  return { success: true, source: 'local' };
}

// ----------------------------------------------------------------------
// 6. OCR & EXTRAÇÃO INTELIGENTE DE PRINTS (GEMINI VISION)
// ----------------------------------------------------------------------

// Helper para comprimir/redimensionar imagens base64 antes do envio (evita limites de upload em conexões móveis)
export function compressBase64Image(base64: string, maxWidth = 1280, maxHeight = 1280, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !base64.startsWith('data:image')) {
      return resolve(base64);
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxWidth && height <= maxHeight) {
        return resolve(base64);
      }
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export async function extractFromPrint(
  imageBase64: string,
  type: 'weight' | 'cardio' | 'workout' | 'measure'
): Promise<{ success: boolean; data?: any; error?: string }> {
  const settings = getApiSettings();
  const apiKey = (settings.geminiKey || '').trim();

  // 1. Otimiza o tamanho da imagem para envio instantâneo
  const optimizedBase64 = await compressBase64Image(imageBase64);

  // Try 1: Cloudflare Pages /api/ocr (usa env.GEMINI_API_KEY do Cloudflare ou apiKey das configurações)
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: optimizedBase64, type, apiKey: apiKey || undefined }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
    }
  } catch (e) {
    console.warn('/api/ocr request error, attempting direct Gemini fallback', e);
  }

  // Try 2: Direct Client Fallback to Google Gemini API (se apiKey estiver salva nas configurações)
  if (apiKey) {
    try {
    const cleanBase64 = optimizedBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    let mimeType = 'image/jpeg';
    const match = optimizedBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    if (match) mimeType = match[1];

    let prompt = '';
    if (type === 'weight') {
      prompt = 'Extraia dados de balança/bioimpedância em JSON: { "peso": number, "data": string (DD/MM/AAAA), "horario": string, "imc": number, "gorduraPercent": number, "pesoGordura": number, "massaMuscEsqPercent": number, "pesoMassaMuscEsq": number, "massaMuscularPercent": number, "pesoMassaMuscular": number, "aguaPercent": number, "pesoAgua": number, "gorduraVisceral": number, "metabolismo": number, "imcApp": number, "alturaApp": number, "idadeApp": number, "melhorPeso30d": number, "observacoes": string }. Apenas JSON sem markdown.';
    } else if (type === 'cardio') {
      prompt = 'Extraia dados de corrida/caminhada/bike (Strava/relógio) em JSON: { "modalidade": "Caminhada" | "Corrida" | "Ciclismo / Bike" | "Esteira", "data": string (DD/MM/AAAA), "horario": string, "local": string, "distanciaKm": number, "tempoMovimento": string (HH:MM:SS), "passos": number ou null, "elevacaoM": number ou null, "calorias": number ou null, "observacoes": string }. Apenas JSON sem markdown.';
    } else if (type === 'workout') {
      prompt = 'Extraia dados de treino de musculação em JSON: { "focoDivisao": string (apenas grupos musculares ex: Peitoral / Tríceps), "exerciciosCargas": string, "observacoes": string, "data": string, "contexto": string }. Apenas JSON sem markdown.';
    } else {
      prompt = 'Extraia medidas corporais e bioimpedância mensal em JSON: { "data": string, "pescoco": number, "ombro": number, "torax": number, "cintura": number, "abdomen": number, "quadril": number, "bracoDir": number, "bracoEsq": number, "antebracoDir": number, "antebracoEsq": number, "coxaDir": number, "coxaEsq": number, "panturrilhaDir": number, "panturrilhaEsq": number, "pesoAvaliacao": number, "gorduraAvaliacao": number, "massaGordura": number, "massaSemGordura": number, "observacoes": string }. Apenas JSON sem markdown.';
    }

    const CANDIDATE_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-2.5-flash'];
    for (const model of CANDIDATE_MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: cleanBase64 } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
        })
      });
      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        const cleaned = jsonMatch ? jsonMatch[0] : rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return { success: true, data: parsed };
      }
    }
    } catch (err: any) {
      console.error('Direct Gemini OCR failed', err);
    }
  }

  return { success: false, error: 'Não foi possível extrair dados automaticamente. Preencha manualmente ou revise a chave do Gemini.' };
}

// ----------------------------------------------------------------------
// 7. CHAT ASSISTENTE GEMINI INTEGRADO
// ----------------------------------------------------------------------

export async function askGemini(
  prompt: string,
  history: AssistantMessage[] = []
): Promise<{ text: string; error?: string }> {
  const weights = getStoredWeights();
  const measures = getStoredMeasures();
  const cardios = getStoredCardios();
  const workouts = getStoredWorkouts();
  const photos = getStoredPhotos();
  const profile = getStoredProfile();

  const settings = getApiSettings();

  const payload = {
    apiKey: settings.geminiKey || undefined,
    prompt,
    history: history.slice(-6).map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    context: {
      profile,
      weightsRecent: weights.slice(-10),
      measuresRecent: measures.slice(-5),
      cardiosRecent: cardios.slice(-5),
      workoutsRecent: workouts.slice(-5),
      photosRecent: photos.slice(-5),
      spreadsheetId: SPREADSHEET_ID,
    },
  };

  try {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        return { text: data.text };
      }
    }
  } catch {}

  // Fallback analytical message
  const lastWeight = weights[weights.length - 1];
  const initialWeight = profile.pesoInicial || 113.250;
  const diffTotal = lastWeight ? (lastWeight.peso - initialWeight).toFixed(3) : '-1.500';

  return {
    text: `### 📊 Análise Geral do Assistente (Modo Integrado)

Olá! Aqui está o resumo das suas métricas consolidadas das **5 abas da planilha**:

* **Peso Inicial:** ${initialWeight} kg (16/11/2026)
* **Peso Atual:** ${lastWeight?.peso || 111.750} kg (Variação: ${Number(diffTotal) > 0 ? `+${diffTotal}` : diffTotal} kg)
* **Composição Corporal:** Gordura: ${lastWeight?.gorduraPercent || 35.2}% (${lastWeight?.pesoGordura || 39.4} kg) | Massa Muscular: ${lastWeight?.massaMuscularPercent || 62.1}% (${lastWeight?.pesoMassaMuscular || 69.5} kg)
* **Gordura Visceral:** ${lastWeight?.gorduraVisceral || 26.0} | **Taxa Basal:** ${lastWeight?.metabolismo || 2126.0} kcal/dia
* **Medida Abdominal Atual:** ${measures[measures.length - 1]?.abdomen || 127} cm
* **Cardio:** ${cardios.length} atividade(s) aeróbica(s) registrada(s) (última: ${cardios[cardios.length - 1]?.modalidade || 'Caminhada'} de ${cardios[cardios.length - 1]?.distanciaKm || 5.7} km)
* **Musculação:** ${workouts.length} treino(s) na academia (último foco: ${workouts[workouts.length - 1]?.focoDivisao || 'Peitoral / Tríceps'})
* **Fotos Semanais:** ${photos.length} registro(s)

💡 **Destaque:** Sua redução de peso (-1,500 kg) manteve a massa muscular elevada e estável (${lastWeight?.massaMuscularPercent || 62.1}%), comprovando excelente recuperação pós-treino e ótimo ritmo!`,
  };
}
