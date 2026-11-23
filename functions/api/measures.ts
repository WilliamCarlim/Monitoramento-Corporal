import { Env, DEFAULT_SPREADSHEET_ID, getGoogleAccessToken } from './sheets-helper';

const BASELINE_MEASURES = [
  {
    id: 'm-0',
    data: '17/11/2026',
    torax: 117,
    cintura: 117,
    abdomen: 125,
    quadril: 123,
    bracoDir: 35,
    bracoEsq: 35,
    coxaDir: 62.5,
    coxaEsq: 63.5,
    panturrilhaDir: 41.5,
    panturrilhaEsq: 41.5,
    pesoAvaliacao: 112.0,
    gorduraAvaliacao: 40.3,
    massaGordura: 45.1,
    massaSemGordura: 66.9,
    observacoes: 'Avaliação Panobianco Bariri • Ticket 1038, Máquina 8678 (Altura: 176 cm, Idade: 34)',
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const spreadsheetId = env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  // 1. Try Apps Script
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getMeasures`);
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          return new Response(JSON.stringify(json.data), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Apps Script fetch measures failed', e);
    }
  }

  // 2. Try Service Account
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    try {
      const accessToken = await getGoogleAccessToken(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      const range = encodeURIComponent('Medidas Corporais!B6:U');
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

      const res = await fetch(sheetsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const json: any = await res.json();
        const rows: any[][] = json.values || [];

        const parseNum = (val: any) => {
          if (!val) return undefined;
          const parsed = parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
          return isNaN(parsed) ? undefined : parsed;
        };

        const records = rows.map((row, idx) => ({
          id: `m-sheet-${idx + 1}`,
          data: row[0] || '',
          pescoco: parseNum(row[1]),
          ombro: parseNum(row[2]),
          torax: parseNum(row[3]),
          cintura: parseNum(row[4]),
          abdomen: parseNum(row[5]),
          quadril: parseNum(row[6]),
          bracoDir: parseNum(row[7]),
          bracoEsq: parseNum(row[8]),
          antebracoDir: parseNum(row[9]),
          antebracoEsq: parseNum(row[10]),
          coxaDir: parseNum(row[11]),
          coxaEsq: parseNum(row[12]),
          panturrilhaDir: parseNum(row[13]),
          panturrilhaEsq: parseNum(row[14]),
          pesoAvaliacao: parseNum(row[15]),
          gorduraAvaliacao: parseNum(row[16]),
          massaGordura: parseNum(row[17]),
          massaSemGordura: parseNum(row[18]),
          observacoes: row[19] || (row.length === 16 ? row[15] : '') || '',
        }));

        if (records.length > 0) {
          return new Response(JSON.stringify(records), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Service Account fetch measures failed', e);
    }
  }

  // Fallback baseline
  return new Response(JSON.stringify(BASELINE_MEASURES), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const spreadsheetId = env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const {
    data,
    pescoco = '',
    ombro = '',
    torax = '',
    cintura = '',
    abdomen = '',
    quadril = '',
    bracoDir = '',
    bracoEsq = '',
    antebracoDir = '',
    antebracoEsq = '',
    coxaDir = '',
    coxaEsq = '',
    panturrilhaDir = '',
    panturrilhaEsq = '',
    observacoes = '',
  } = body;

  const formatVal = (v: any) => {
    if (v === '' || v === undefined || v === null) return '';
    return typeof v === 'number' ? v.toString().replace('.', ',') : v;
  };

  const rowValues = [
    data,
    formatVal(pescoco),
    formatVal(ombro),
    formatVal(torax),
    formatVal(cintura),
    formatVal(abdomen),
    formatVal(quadril),
    formatVal(bracoDir),
    formatVal(bracoEsq),
    formatVal(antebracoDir),
    formatVal(antebracoEsq),
    formatVal(coxaDir),
    formatVal(coxaEsq),
    formatVal(panturrilhaDir),
    formatVal(panturrilhaEsq),
    observacoes,
  ];

  // 1. Try Apps Script
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addMeasure',
          data: body,
          rowValues,
        }),
      });
      if (res.ok) {
        return new Response(JSON.stringify({ success: true, via: 'apps-script' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Apps Script append measures failed', e);
    }
  }

  // 2. Try Service Account
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    try {
      const accessToken = await getGoogleAccessToken(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      const range = encodeURIComponent('Medidas Corporais!A:P');
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

      const appendRes = await fetch(appendUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      });

      if (appendRes.ok) {
        return new Response(JSON.stringify({ success: true, via: 'google-sheets-api' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (e) {
      console.error('Google Sheets API append measures failed', e);
    }
  }

  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
