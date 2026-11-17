import { Env, DEFAULT_SPREADSHEET_ID, getGoogleAccessToken } from './sheets-helper';

const BASELINE_WEIGHTS = [
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

function normalizePercent(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1.0) {
    return Math.round(num * 1000) / 10;
  }
  return num;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  // 1. Check Apps Script URL
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getWeights`, {
        redirect: 'follow',
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
          const cleaned = json.data.map((w: any) => ({
            ...w,
            gorduraPercent: normalizePercent(w.gorduraPercent),
            massaMuscularPercent: normalizePercent(w.massaMuscularPercent),
            massaMuscEsqPercent: normalizePercent(w.massaMuscEsqPercent),
            aguaPercent: normalizePercent(w.aguaPercent),
          }));
          return new Response(JSON.stringify(cleaned), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Apps Script fetch failed', e);
    }
  }

  // Fallback baseline
  return new Response(JSON.stringify(BASELINE_WEIGHTS), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  // 1. Try Apps Script URL
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addWeight',
          data: body,
        }),
      });
      if (res.ok) {
        return new Response(JSON.stringify({ success: true, via: 'apps-script' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Apps Script append failed', e);
    }
  }

  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
