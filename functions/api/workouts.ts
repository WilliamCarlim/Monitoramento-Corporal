import { Env, DEFAULT_SPREADSHEET_ID, getGoogleAccessToken } from './sheets-helper';

const BASELINE_WORKOUTS = [
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getWorkouts`, {
        redirect: 'follow',
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          return new Response(JSON.stringify(json.data), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Apps Script getWorkouts failed', e);
    }
  }

  return new Response(JSON.stringify(BASELINE_WORKOUTS), {
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

  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addWorkout',
          data: body,
        }),
      });
      if (res.ok) {
        return new Response(JSON.stringify({ success: true, via: 'apps-script' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Apps Script addWorkout failed', e);
    }
  }

  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
