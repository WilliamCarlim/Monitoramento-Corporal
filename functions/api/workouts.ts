import { Env } from './sheets-helper';

const BASELINE_WORKOUTS = [
  {
    id: 't-1',
    data: '16/11/2026',
    diaSemana: 'segunda-feira',
    contexto: 'Academia Fast fit',
    focoDivisao: 'Peitoral / Tríceps',
    duracaoMin: 55,
    exerciciosCargas: 'Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50); Crucifixo na polia - 3 séries (7.5); Tríceps francês - 3 séries; Tríceps corda - 3 séries (17.5); Tríceps testa com halteres - 3 séries',
    esforcoPse: 8,
    calorias: 356,
    observacoes: '7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...',
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
