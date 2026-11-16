/**
 * Google Apps Script - Ponte Web para Acompanhamento Corporal 2026
 * Planilha: Acompanhamento Corporal - Peso e Medidas 2026
 * ID: 1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U
 *
 * Como instalar:
 * 1. Abra sua planilha do Google Sheets.
 * 2. Clique em "Extensões" > "Apps Script".
 * 3. Cole este código no editor (substituindo o conteúdo existente).
 * 4. Clique em "Implantar" (Deploy) > "Nova implantação" (New deployment).
 * 5. Tipo: "Aplicativo da Web" (Web app).
 * 6. Executar como: "Eu" (seu email).
 * 7. Quem tem acesso: "Qualquer pessoa" (Anyone).
 * 8. Clique em "Implantar", autorize o acesso e copie o link (URL do Web App).
 * 9. Cole o link no Cloudflare Secrets como GOOGLE_SCRIPT_URL ou nas Configurações do site.
 */

const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

function doGet(e) {
  try {
    const action = e.parameter.action || 'getWeights';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getWeights') {
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) {
        return jsonResponse({ status: 'error', message: 'Aba Registro de Peso não encontrada' });
      }
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return jsonResponse({ status: 'success', data: [] });
      }

      // Skip header row
      const rows = data.slice(1);
      const records = rows.map((row, idx) => {
        const parseNum = (val) => {
          if (!val) return 0;
          return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
        };

        return {
          id: 'w-sheet-' + (idx + 1),
          data: formatDate(row[0]),
          diaSemana: String(row[1] || ''),
          contexto: String(row[2] || ''),
          peso: parseNum(row[3]),
          variacaoAnterior: parseNum(row[4]),
          variacaoInicial: parseNum(row[5]),
          imc: parseNum(row[6]),
          observacoes: String(row[7] || '')
        };
      });

      return jsonResponse({ status: 'success', data: records });
    }

    if (action === 'getMeasures') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) {
        return jsonResponse({ status: 'error', message: 'Aba Medidas Corporais não encontrada' });
      }
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return jsonResponse({ status: 'success', data: [] });
      }

      const rows = data.slice(1);
      const parseNum = (val) => {
        if (!val) return undefined;
        const parsed = parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
        return isNaN(parsed) ? undefined : parsed;
      };

      const records = rows.map((row, idx) => ({
        id: 'm-sheet-' + (idx + 1),
        data: formatDate(row[0]),
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
        observacoes: String(row[15] || '')
      }));

      return jsonResponse({ status: 'success', data: records });
    }

    return jsonResponse({ status: 'error', message: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'addWeight') {
      const sheet = ss.getSheetByName('Registro de Peso') || ss.insertSheet('Registro de Peso');
      const d = payload.data;

      const formatBR = (num, decimals) => {
        if (num === undefined || num === null || isNaN(num)) return '0,000';
        return Number(num).toLocaleString('pt-BR', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
      };

      // Header fallback if sheet was empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Data', 'Dia da Semana', 'Horário / Contexto', 'Peso (kg)',
          'Variação vs Anterior (kg)', 'Variação vs Inicial (kg)', 'IMC', 'Observações'
        ]);
      }

      sheet.appendRow([
        d.data,
        d.diaSemana,
        d.contexto,
        formatBR(d.peso, 3),
        formatBR(d.variacaoAnterior, 3),
        formatBR(d.variacaoInicial, 3),
        formatBR(d.imc, 2),
        d.observacoes || ''
      ]);

      return jsonResponse({ status: 'success', message: 'Peso adicionado com sucesso' });
    }

    if (action === 'addMeasure') {
      const sheet = ss.getSheetByName('Medidas Corporais') || ss.insertSheet('Medidas Corporais');
      const d = payload.data;

      const formatVal = (v) => {
        if (v === '' || v === undefined || v === null) return '';
        return typeof v === 'number' ? String(v).replace('.', ',') : v;
      };

      // Header fallback if empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Data', 'Pescoço (cm)', 'Ombro (cm)', 'Tórax (cm)', 'Cintura (cm)',
          'Abdômen (cm)', 'Quadril (cm)', 'Braço Dir (cm)', 'Braço Esq (cm)',
          'Antebraço Dir (cm)', 'Antebraço Esq (cm)', 'Coxa Dir (cm)', 'Coxa Esq (cm)',
          'Panturrilha Dir (cm)', 'Panturrilha Esq (cm)', 'Observações'
        ]);
      }

      sheet.appendRow([
        d.data,
        formatVal(d.pescoco),
        formatVal(d.ombro),
        formatVal(d.torax),
        formatVal(d.cintura),
        formatVal(d.abdomen),
        formatVal(d.quadril),
        formatVal(d.bracoDir),
        formatVal(d.bracoEsq),
        formatVal(d.antebracoDir),
        formatVal(d.antebracoEsq),
        formatVal(d.coxaDir),
        formatVal(d.coxaEsq),
        formatVal(d.panturrilhaDir),
        formatVal(d.panturrilhaEsq),
        d.observacoes || ''
      ]);

      return jsonResponse({ status: 'success', message: 'Medidas adicionadas com sucesso' });
    }

    return jsonResponse({ status: 'error', message: 'Ação não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(val);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
