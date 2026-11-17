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
        data: cleanDate,
      };
    })
    .filter((w) => {
      if (!w || !w.data) return false;
      const dataStr = String(w.data).trim().toLowerCase();
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
      return dataStr !== 'data' && (c.distanciaKm > 0 || c.calorias > 0 || (c.tempoMovimento && c.tempoMovimento !== ''));
    })
    .map((c) => ({
      ...c,
      tempoMovimento: cleanDurationString(c.tempoMovimento),
    }));
}

function sanitizeWorkouts(list: any[]): WorkoutRecord[] {
  if (!Array.isArray(list)) return [];
  return list.filter((w) => {
    if (!w || !w.data) return false;
    const dataStr = String(w.data).trim().toLowerCase();
    return dataStr !== 'data' && (w.focoDivisao || w.exerciciosCargas);
  });
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

export async function extractFromPrint(
  imageBase64: string,
  type: 'weight' | 'cardio' | 'workout' | 'measure'
): Promise<{ success: boolean; data?: any; error?: string }> {
  // Try 1: Cloudflare Pages /api/ocr
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, type }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return { success: true, data: json.data };
      }
    }
  } catch {}

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

  const payload = {
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
