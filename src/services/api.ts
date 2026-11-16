import { WeightRecord, MeasureRecord, AssistantMessage } from '../types';
import {
  getStoredWeights,
  saveStoredWeights,
  getStoredMeasures,
  saveStoredMeasures,
  getStoredProfile,
  getApiSettings
} from './storage';

export const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

// Interface for API responses
interface FetchResponse<T> {
  data: T;
  source: 'cloud' | 'script' | 'local';
  error?: string;
}

function sanitizeWeights(list: any[]): WeightRecord[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((w) => {
      // Auto-heal shifted columns or parse clean values
      let p = typeof w.peso === 'number' ? w.peso : parseFloat(String(w.peso).replace(/\./g, '').replace(',', '.'));
      let varAnt = typeof w.variacaoAnterior === 'number' ? w.variacaoAnterior : parseFloat(String(w.variacaoAnterior).replace(/\./g, '').replace(',', '.'));
      let varIni = typeof w.variacaoInicial === 'number' ? w.variacaoInicial : parseFloat(String(w.variacaoInicial).replace(/\./g, '').replace(',', '.'));

      // If peso was shifted to variacaoAnterior by an old script version
      if ((isNaN(p) || p <= 30) && !isNaN(varAnt) && varAnt > 30) {
        p = varAnt;
        varAnt = 0;
      }

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
      // Ignore titles or header rows
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

      // Auto-heal if 127 was mapped to quadril due to margin column
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
      // Check if at least one measurement is positive
      const hasAny = [
        m.abdomen, m.cintura, m.quadril, m.torax, m.pescoco,
        m.bracoDir, m.bracoEsq, m.antebracoDir, m.antebracoEsq,
        m.coxaDir, m.coxaEsq, m.panturrilhaDir, m.panturrilhaEsq
      ].some((v) => typeof v === 'number' && v > 0);
      return hasAny;
    });
}

export async function fetchWeights(): Promise<FetchResponse<WeightRecord[]>> {
  const settings = getApiSettings();

  // Try 1: Cloudflare Pages Function endpoint
  try {
    const res = await fetch('/api/weights', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeWeights(data);
        if (sanitized.length > 0) {
          saveStoredWeights(sanitized);
          return { data: sanitized, source: 'cloud' };
        }
      }
    }
  } catch {}

  // Try 2: Direct Google Apps Script URL if configured in settings
  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getWeights`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeWeights(json.data);
          if (sanitized.length > 0) {
            saveStoredWeights(sanitized);
            return { data: sanitized, source: 'script' };
          }
        }
      }
    } catch {}
  }

  // Fallback: Local storage
  return { data: sanitizeWeights(getStoredWeights()), source: 'local' };
}

export async function addWeightRecord(record: WeightRecord): Promise<{ success: boolean; source: 'cloud' | 'script' | 'local'; error?: string }> {
  const currentWeights = getStoredWeights();
  const profile = getStoredProfile();

  // Calculate variations
  const pesoInicial = profile.pesoInicial || 113.250;
  const ultimoRegistro = currentWeights.length > 0 ? currentWeights[currentWeights.length - 1] : null;

  const variacaoAnterior = ultimoRegistro ? Number((record.peso - ultimoRegistro.peso).toFixed(3)) : 0;
  const variacaoInicial = Number((record.peso - pesoInicial).toFixed(3));
  const imc = Number((record.peso / (profile.alturaMetros * profile.alturaMetros)).toFixed(2));

  const enrichedRecord: WeightRecord = {
    ...record,
    id: `w-${Date.now()}`,
    variacaoAnterior,
    variacaoInicial,
    imc,
  };

  const settings = getApiSettings();

  // Try 1: Cloudflare Pages Function
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

  // Try 2: Direct Google Apps Script Web App
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

  // Local save
  const updated = [...currentWeights, enrichedRecord];
  saveStoredWeights(updated);
  return { success: true, source: 'local' };
}

export async function fetchMeasures(): Promise<FetchResponse<MeasureRecord[]>> {
  const settings = getApiSettings();

  // Try 1: Cloudflare Pages Function
  try {
    const res = await fetch('/api/measures', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const sanitized = sanitizeMeasures(data);
        if (sanitized.length > 0) {
          saveStoredMeasures(sanitized);
          return { data: sanitized, source: 'cloud' };
        }
      }
    }
  } catch {}

  // Try 2: Direct Google Apps Script
  if (settings.scriptUrl) {
    try {
      const res = await fetch(`${settings.scriptUrl}?action=getMeasures`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const sanitized = sanitizeMeasures(json.data);
          if (sanitized.length > 0) {
            saveStoredMeasures(sanitized);
            return { data: sanitized, source: 'script' };
          }
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

  // Try 1: Cloudflare Pages Function
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

  // Try 2: Direct Google Apps Script
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

  // Local save
  const updated = [...currentMeasures, enrichedRecord];
  saveStoredMeasures(updated);
  return { success: true, source: 'local' };
}

export async function askGemini(
  prompt: string,
  history: AssistantMessage[] = []
): Promise<{ text: string; error?: string }> {
  const weights = getStoredWeights();
  const measures = getStoredMeasures();
  const profile = getStoredProfile();

  const payload = {
    prompt,
    history: history.slice(-6).map(h => ({ role: h.role, parts: [{ text: h.content }] })),
    context: {
      profile,
      weightsRecent: weights.slice(-10),
      measuresRecent: measures.slice(-5),
      spreadsheetId: SPREADSHEET_ID,
    },
  };

  // Try 1: Cloudflare backend endpoint /api/gemini
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

  // Try 2: Direct Gemini API key if configured locally
  const settings = getApiSettings();
  if (settings.geminiApiKey) {
    try {
      const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`;
      const systemInstruction = `Você é um assistente especialista em saúde, avaliação física e composição corporal integrado ao sistema de monitoramento pessoal.
Dados do usuário:
- Altura: ${profile.alturaMetros}m
- Peso Inicial: ${profile.pesoInicial} kg em ${profile.dataInicio}
- Histórico de pesos recentes: ${JSON.stringify(weights.slice(-5))}
- Histórico de medidas recentes: ${JSON.stringify(measures.slice(-3))}

Diretrizes:
1. Responda de forma motivadora, empática, técnica e objetiva em Português do Brasil.
2. Explique oscilações naturais (retenção hídrica pós-treino, glicogênio, sódio, intestino).
3. Leve em conta a diferença entre usar trena metálica vs fita métrica maleável.
4. Destaque variações positivas e dê sugestões práticas de hidratação, sono e consistência.
5. Use formatação markdown limpa (tópicos, negritos).`;

      const body = {
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [
          ...payload.history,
          { role: 'user', parts: [{ text: prompt }] },
        ],
      };

      const res = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text };
      }
    } catch (e: any) {
      console.warn('Direct Gemini call failed', e);
    }
  }

  // Fallback assistant response
  const lastWeight = weights[weights.length - 1];
  const initialWeight = profile.pesoInicial;
  const diffTotal = lastWeight ? (lastWeight.peso - initialWeight).toFixed(3) : '0';
  const lastAbdomen = measures[measures.length - 1]?.abdomen || 127;

  return {
    text: `### 📊 Análise Geral do Assistente

Olá! Aqui está o resumo das suas métricas atuais baseado no seu histórico registrado:

* **Peso Inicial:** ${initialWeight} kg (16/11/2026)
* **Peso Mais Recente:** ${lastWeight?.peso || 113.25} kg (Contexto: *${lastWeight?.contexto || 'Pós-academia'}*)
* **Variação Total:** ${Number(diffTotal) > 0 ? `+${diffTotal} kg` : `${diffTotal} kg`}
* **IMC Atual:** ${lastWeight?.imc || 34.95} (Altura de referência: ${profile.alturaMetros} m)
* **Última Medida Abdominal:** ${lastAbdomen} cm

#### 💡 Observações Importantes:
1. **Oscilações Pós-Treino:** A pesagem após treino reflete inflamação muscular temporária e hidratação. O padrão-ouro de comparação é em jejum pela manhã.
2. **Método de Medição:** Adote uma fita métrica maleável de alfaiate com respiração normal para melhor reprodutibilidade.`,
  };
}
