import { Env } from './sheets-helper';

const BASELINE_PHOTOS = [
  {
    id: 'f-1',
    semana: 'Semana 1',
    data: '16/11/2026',
    fotoFrente: '',
    fotoLado: '',
    fotoCosta: '',
    observacoes: 'Semana 1 inicial pronta para fotos do Google Drive',
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getPhotos`, {
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
      console.error('Apps Script getPhotos failed', e);
    }
  }

  return new Response(JSON.stringify(BASELINE_PHOTOS), {
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
          action: 'addPhoto',
          data: body,
        }),
      });
      if (res.ok) {
        const json: any = await res.json();
        return new Response(JSON.stringify(json), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Apps Script addPhoto failed', e);
    }
  }

  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
