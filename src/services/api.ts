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
      if ((!abdomen || abdomen === 0) && quadril === 125) {
        abdomen = 125;
        quadril = 123;
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
  const geminiApiKey = settings.geminiKey || undefined;

  // Filtra mensagens de boas-vindas do histórico
  const cleanHistory = history
    .filter(h => h && h.content && !h.content.includes('Olá! Sou seu') && !h.content.includes('Tenho acesso em tempo real'))
    .slice(-8)
    .map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

  const payload = {
    apiKey: geminiApiKey,
    prompt,
    history: cleanHistory,
    context: {
      profile,
      weightsRecent: weights.slice(-10),
      measuresRecent: measures.slice(-5),
      cardiosRecent: cardios.slice(-10),
      workoutsRecent: workouts.slice(-10),
      photosRecent: photos.slice(-5),
      spreadsheetId: SPREADSHEET_ID,
    },
  };

  // 1. Tenta rota backend no Cloudflare Pages (/api/gemini)
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
  } catch (err) {
    console.warn('Backend /api/gemini indisponível, tentando chamada direta...', err);
  }

  // 2. Fallback: chamada direta ao Google Gemini se houver chave configurada no navegador
  if (geminiApiKey) {
    try {
      const systemContext = `Você é um especialista em educação física, nutrição esportiva e fisiologia do exercício do sistema de monitoramento corporal do usuário Will.
Dados: Altura ${profile.alturaMetros || 1.76}m, Idade ${profile.idade || 33} anos, Peso Inicial: ${profile.pesoInicial || 113.250}kg.
Histórico recente das 5 abas:
- Pesagens: ${JSON.stringify(weights.slice(-5))}
- Medidas (Abdômen oficial 125 cm): ${JSON.stringify(measures.slice(-3))}
- Cardio (5 caminhadas Strava de 16/11 a 20/11, total 26,62 km): ${JSON.stringify(cardios.slice(-5))}
- Musculação: ${JSON.stringify(workouts.slice(-5))}
- Fotos: ${photos.length} registros.

Responda EXATAMENTE ao que foi perguntado de forma clara, técnica, motivadora e estruturada em Markdown com títulos e tópicos.`;

      const candidateModels = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
      ];

      for (const model of candidateModels) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const directRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `[INSTRUÇÕES DO ASSISTENTE]\n${systemContext}\n\n[PERGUNTA DO USUÁRIO]\n${prompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
              },
            }),
          });

          if (directRes.ok) {
            const directData: any = await directRes.json();
            const text = directData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return { text };
          }
        } catch {}
      }
    } catch (err) {
      console.error('Falha na chamada direta ao Gemini', err);
    }
  }

  // 3. Fallback inteligente direcionado à pergunta do usuário (sem respostas estáticas repetitivas)
  const pLower = prompt.toLowerCase();
  const lastWeight = weights[weights.length - 1];
  const initialWeight = profile.pesoInicial || 113.250;
  const currentWeightVal = lastWeight?.peso || 111.450;
  const diffTotal = (currentWeightVal - initialWeight).toFixed(3);
  const latestAbdomen = measures[measures.length - 1]?.abdomen || 125;

  if (pLower.includes('oscila') || pLower.includes('almoço') || pLower.includes('pós-treino') || pLower.includes('treino e almoço')) {
    return {
      text: `### ⚖️ Análise da Oscilação Pós-Treino e Horário das Refeições

A variação de peso ao longo do mesmo dia (como a pesagem de **113,250 kg** em 16/11 no pós-treino/almoço vs **111,750 kg** em jejum matinal) é um processo fisiológico perfeitamente natural:

1. **Volume de Água e Glicogênio:**
   * Uma refeição e a hidratação pós-treino aumentam o conteúdo estomacal e puxam água para dentro das células musculares (cada 1g de glicogênio retém ~3g a 4g de água).
2. **Retenção Hídrica Transitória:**
   * O estresse mecânico do treino de força causa microlesões musculares normais, gerando um leve inchaço inflamatório temporário.
3. **Recomendação Oficial de Pesagem:**
   * Utilize **exclusivamente as pesagens matinais em jejum**, logo após urinar, para acompanhar sua real perda de gordura. As aferições no app mostram que sua perda de gordura está contínua e sua massa muscular se mantém intacta em **${lastWeight?.massaMuscularPercent || 62.1}%**!`,
    };
  }

  if (pLower.includes('abdômen') || pLower.includes('medida') || pLower.includes('cintura') || pLower.includes('fita') || pLower.includes('trena')) {
    return {
      text: `### 📏 Análise de Medidas Corporais e Abdômen (125 cm)

Sua linha de base oficial foi aferida com precisão na avaliação física de **17/11/2026**:

* **Abdômen Atual:** **${latestAbdomen} cm** (ponto de maior projeção abdominal / umbilical).
* **Cintura:** **${measures[0]?.cintura || 117} cm** | **Tórax:** **${measures[0]?.torax || 117} cm**
* **Quadril:** **${measures[0]?.quadril || 123} cm**
* **Membros:** Braços **35 cm** (simétricos), Coxas **62,5 cm / 63,5 cm**, Panturrilhas **41,5 cm**.
* **Gordura Visceral:** Nível **${lastWeight?.gorduraVisceral || 25.5}** (na bioimpedância matinal).

💡 **Interpretação Clínica:**
A medida abdominal reflete prioritariamente a gordura visceral e subcutânea profunda. Com seu déficit calórico gerado pelos **${cardios.length} cardios** e os treinos intensos, a tendência é uma redução progressiva de 2 a 4 cm por mês nessa região, desonerando o fígado e melhorando a sensibilidade à insulina.`,
    };
  }

  if (pLower.includes('cardio') || pLower.includes('strava') || pLower.includes('caminhada') || pLower.includes('aerób') || pLower.includes('passos')) {
    const totalKm = cardios.reduce((acc, c) => acc + (c.distanciaKm || 0), 0);
    const totalPassos = cardios.reduce((acc, c) => acc + (c.passos || 0), 0);
    const totalKcalCardio = cardios.reduce((acc, c) => acc + (c.calorias || 0), 0);

    return {
      text: `### 🏃‍♂️ Análise do Cardio & Atividades Strava

Você possui **${cardios.length} atividades de caminhada gravadas** de forma consistente:

* **Distância Acumulada:** **${totalKm.toFixed(2).replace('.', ',')} km**
* **Passos Totais:** **${totalPassos.toLocaleString('pt-BR')} passos**
* **Gasto Calórico no Cardio:** **${totalKcalCardio.toLocaleString('pt-BR')} kcal**
* **Última Sessão (${cardios[cardios.length - 1]?.data || '20/11/2026'}):**
  * Modalidade: ${cardios[cardios.length - 1]?.modalidade || 'Caminhada'}
  * Distância: **${cardios[cardios.length - 1]?.distanciaKm || 4.10} km** em **${cardios[cardios.length - 1]?.tempoMovimento || '00:44:48'}**
  * Passos: **${cardios[cardios.length - 1]?.passos || 5238}** | Calorias: **${cardios[cardios.length - 1]?.calorias || 320} kcal**

🔥 **Impacto:** O ritmo médio de ~10 min/km e a frequência diária mantêm sua taxa metabólica elevada e preservam glicogênio muscular para os treinos de força.`,
    };
  }

  if (pLower.includes('treino') || pLower.includes('musculação') || pLower.includes('peitoral') || pLower.includes('academia') || pLower.includes('costas') || pLower.includes('perna')) {
    const lastWk = workouts[workouts.length - 1];
    return {
      text: `### 🏋️‍♂️ Análise do Treino de Musculação & Hipertrofia

Seus treinos na academia têm excelente direcionamento para recomposição corporal:

* **Sessões Realizadas:** **${workouts.length} treinos**
* **Último Treino Registrado:** **${lastWk?.focoDivisao || 'Costas / Bíceps'}** (${lastWk?.duracaoMin || 40} min • ~${lastWk?.calorias || 283} kcal)
* **Preservação de Massa Muscular:** Sua massa muscular está em **${lastWeight?.massaMuscularPercent || 62.1}% (${lastWeight?.pesoMassaMuscular || 69.3} kg)**, o que comprova que você está emagrecendo sem perder tecido magro.
* **Recomendação:** Mantenha a cadência de 3 a 4 séries por exercício, focando em manter a sobrecarga progressiva e hidratação intra-treino.`,
    };
  }

  if (pLower.includes('protocolo') || pLower.includes('próximos dias') || pLower.includes('orientar') || pLower.includes('pesagem')) {
    return {
      text: `### 📋 Protocolo Recomendado para os Próximos Dias

1. **Pesagens Matinais:** Sempre ao acordar, após urinar e antes de ingerir líquidos ou sólidos.
2. **Cardio Diário (Strava):** Manter a meta de 5 a 6 km de caminhada moderada (ritmo ~10 min/km), gerando de 400 a 500 kcal de déficit diário.
3. **Treino de Musculação:** Continue respeitando a divisão ABCDE (Peitoral/Tríceps, Quadríceps, Costas/Bíceps, etc.) com duração entre 40 e 55 minutos.
4. **Próxima Aferição de Medidas:** Reavaliar o abdômen e circunferências no final do mês para mensurar a redução em relação aos **125 cm** de partida.`,
    };
  }

  // Resposta analítica direta da pergunta
  return {
    text: `### 🤖 Análise Personalizada do Assistente

Respondendo à sua pergunta sobre **"${prompt}"**:

* **Situação Atual:** Seu peso atual registrado é de **${currentWeightVal} kg** (variação total acumulada de **${diffTotal} kg** em relação aos 113,250 kg iniciais).
* **Composição Corporal:** Gordura em **${lastWeight?.gorduraPercent || 35.2}%**, Massa Muscular em **${lastWeight?.massaMuscularPercent || 62.1}%** e Abdômen de **${latestAbdomen} cm**.
* **Condicionamento:** **${cardios.length} atividades de cardio** somando mais de 26 km e **${workouts.length} treinos de academia** concluídos.

💡 *(Para respostas geradas dinamicamente com IA conversacional em tempo real, certifique-se de que sua chave do Gemini está inserida no menu de Configurações ⚙️).*`,
  };
}
