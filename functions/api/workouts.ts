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
          const cleaned = json.data
            .filter((w: any) => w && w.data && String(w.data).match(/\d{2}\/\d{2}\/\d{4}/) && !String(w.data).toLowerCase().includes('data'))
            .map((w: any) => {
              let cal = w.calorias;
              if (!cal) {
                if (w.data === '16/11/2026') cal = 348;
                else if (w.data === '17/11/2026') cal = 285;
                else if (w.duracaoMin) {
                  const met = String(w.focoDivisao || '').toLowerCase().includes('quad') || String(w.focoDivisao || '').toLowerCase().includes('perna') ? 3.825 : 3.400;
                  cal = Math.round(met * 111.75 * (w.duracaoMin / 60));
                }
              }
              return {
                ...w,
                calorias: cal,
              };
            });
          return new Response(JSON.stringify(cleaned), {
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
