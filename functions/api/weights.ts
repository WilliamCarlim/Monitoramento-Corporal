import { Env, DEFAULT_SPREADSHEET_ID, getGoogleAccessToken } from './sheets-helper';

const BASELINE_WEIGHTS = [
  {
    id: 'w-1',
    data: '16/11/2026',
    diaSemana: 'Segunda-feira',
    contexto: 'Almoço / pós-academia',
    peso: 113.250,
    variacaoAnterior: 0.000,
    variacaoInicial: 0.000,
    imc: 34.95,
    observacoes: 'Medição inicial pós-treino',
  },
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  const spreadsheetId = env.SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID;

  // 1. Check Apps Script URL
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(`${env.GOOGLE_SCRIPT_URL}?action=getWeights`);
      if (res.ok) {
        const json: any = await res.json();
        if (json.status === 'success' && Array.isArray(json.data)) {
          return new Response(JSON.stringify(json.data), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Apps Script fetch failed', e);
    }
  }

  // 2. Check Service Account credentials
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    try {
      const accessToken = await getGoogleAccessToken(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      const range = encodeURIComponent('Registro de Peso!A2:H');
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

      const res = await fetch(sheetsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        const json: any = await res.json();
        const rows: any[][] = json.values || [];

        const records = rows.map((row, idx) => {
          const parseNum = (val: any) => {
            if (!val) return 0;
            return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
          };

          return {
            id: `w-sheet-${idx + 1}`,
            data: row[0] || '',
            diaSemana: row[1] || '',
            contexto: row[2] || '',
            peso: parseNum(row[3]),
            variacaoAnterior: parseNum(row[4]),
            variacaoInicial: parseNum(row[5]),
            imc: parseNum(row[6]),
            observacoes: row[7] || '',
          };
        });

        if (records.length > 0) {
          return new Response(JSON.stringify(records), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.error('Service Account fetch failed', e);
    }
  }

  // Fallback baseline
  return new Response(JSON.stringify(BASELINE_WEIGHTS), {
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
    diaSemana,
    contexto,
    peso,
    variacaoAnterior = 0,
    variacaoInicial = 0,
    imc = 0,
    observacoes = '',
  } = body;

  const formatBR = (num: number, decimals: number) => {
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const rowValues = [
    data,
    diaSemana,
    contexto,
    formatBR(peso, 3),
    formatBR(variacaoAnterior, 3),
    formatBR(variacaoInicial, 3),
    formatBR(imc, 2),
    observacoes,
  ];

  // 1. Try Apps Script URL
  if (env.GOOGLE_SCRIPT_URL) {
    try {
      const res = await fetch(env.GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'addWeight',
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
      console.error('Apps Script append failed', e);
    }
  }

  // 2. Try Service Account
  if (env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY) {
    try {
      const accessToken = await getGoogleAccessToken(
        env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        env.GOOGLE_PRIVATE_KEY
      );

      const range = encodeURIComponent('Registro de Peso!A:H');
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
      console.error('Google Sheets API append failed', e);
    }
  }

  // Fallback success acknowledgment
  return new Response(JSON.stringify({ success: true, via: 'fallback-local' }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
