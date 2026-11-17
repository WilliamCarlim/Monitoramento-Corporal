import { Env } from './sheets-helper';

const BASELINE_CARDIOS = [
  {
    id: 'c-1',
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
    observacoes: 'Caminhada ao entardecer registrada no Strava (ritmo médio ~10,3 min/km)',
  },
];

function cleanDuration(val: any): string {
  if (!val) return '00:00:00';
  const str = String(val).trim();
  const match = str.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) return `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}`;
  const match2 = str.match(/(\d{1,2}):(\d{2})/);
  if (match2) return `00:${match2[1].padStart(2, '0')}:${match2[2]}`;
  return str;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getCardios`, {
        redirect: 'follow',
      });
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          const cleaned = json.data
            .filter((item: any) => item && item.data && String(item.data).match(/\d{2}\/\d{2}\/\d{4}/) && !String(item.data).toLowerCase().includes('data'))
            .map((item: any) => ({
              ...item,
              tempoMovimento: cleanDuration(item.tempoMovimento),
            }));
          return new Response(JSON.stringify(cleaned), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Apps Script getCardios failed', e);
    }
  }

  return new Response(JSON.stringify(BASELINE_CARDIOS), {
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
          action: 'addCardio',
          data: body,
        }),
      });
      if (res.ok) {
        return new Response(JSON.stringify({ success: true, via: 'apps-script' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Apps Script addCardio failed', e);
    }
  }

  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
