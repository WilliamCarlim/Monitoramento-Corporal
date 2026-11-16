/**
 * Google Apps Script - Ponte Web Inteligente e Auto-Organizadora para Acompanhamento Corporal 2026
 * Planilha: Acompanhamento Corporal - Peso e Medidas 2026
 * ID: 1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U
 */

const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getWeights';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Auto-organiza e alinha a planilha sempre que chamada
    autoOrganizarPlanilha(ss);

    if (action === 'getWeights') {
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Registro de Peso não encontrada' });
      const records = parseWeightSheet(sheet);
      return jsonResponse({ status: 'success', data: records });
    }

    if (action === 'getMeasures') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Medidas Corporais não encontrada' });
      const records = parseMeasureSheet(sheet);
      return jsonResponse({ status: 'success', data: records });
    }

    if (action === 'organizar') {
      autoOrganizarPlanilha(ss);
      return jsonResponse({ status: 'success', message: 'Planilha organizada com sucesso!' });
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
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba não encontrada' });
      addWeightToSheet(sheet, payload.data);
      autoOrganizarPlanilha(ss);
      return jsonResponse({ status: 'success', message: 'Peso adicionado e organizado com sucesso' });
    }

    if (action === 'addMeasure') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba não encontrada' });
      addMeasureToSheet(sheet, payload.data);
      autoOrganizarPlanilha(ss);
      return jsonResponse({ status: 'success', message: 'Medidas adicionadas e organizadas com sucesso' });
    }

    return jsonResponse({ status: 'error', message: 'Ação não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ==========================================
// AUTO-ORGANIZADOR E ALINHAMENTO DA PLANILHA
// ==========================================

function autoOrganizarPlanilha(ss) {
  organizarAbaPeso(ss.getSheetByName('Registro de Peso'));
  organizarAbaMedidas(ss.getSheetByName('Medidas Corporais'));
}

function organizarAbaPeso(sheet) {
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let headerRow = 9; // Linha 9 é o cabeçalho oficial

  // Coletar todos os registros válidos existentes (mesmo os deslocados na Coluna A ou na linha 26)
  const validRecords = [];

  for (let r = headerRow; r < data.length; r++) {
    const row = data[r];

    // Verificar se há data na Coluna A (deslocada) ou Coluna B (correta)
    let rawDate = row[1]; // Coluna B
    let shifted = false;

    if (!rawDate && row[0]) {
      // Estava deslocada para a Coluna A!
      rawDate = row[0];
      shifted = true;
    }

    const formattedDate = formatDate(rawDate);
    if (!formattedDate || formattedDate.toLowerCase() === 'data') continue;

    // Se estiver deslocada, os dados vieram em colunas -1
    let diaSemana = shifted ? String(row[1] || '') : String(row[2] || '');
    let contexto = shifted ? String(row[2] || '') : String(row[3] || '');
    let peso = shifted ? parseCleanNumber(row[4] || row[3]) : parseCleanNumber(row[4]);
    let varAnt = shifted ? parseCleanNumber(row[6] || row[5]) : parseCleanNumber(row[5]);
    let varIni = shifted ? parseCleanNumber(row[6]) : parseCleanNumber(row[6]);
    let imc = shifted ? parseCleanNumber(row[7]) : parseCleanNumber(row[7]);
    let obs = shifted ? String(row[8] || '') : String(row[8] || '');

    if (peso > 30) {
      validRecords.push({
        data: formattedDate,
        diaSemana: diaSemana,
        contexto: contexto,
        peso: peso,
        variacaoAnterior: varAnt,
        variacaoInicial: varIni,
        imc: imc,
        observacoes: obs
      });
    }
  }

  // Se não encontrou novos, preserva o baseline
  if (validRecords.length === 0) {
    validRecords.push({
      data: '16/11/2026',
      diaSemana: 'segunda-feira',
      contexto: 'Horário do almoço, após a academia',
      peso: 113.250,
      variacaoAnterior: 0.000,
      variacaoInicial: 0.000,
      imc: 34.95,
      observacoes: 'Primeiro registro de pesagem (início do plano)'
    });
  }

  // Limpar a área de dados da tabela (da linha 10 à linha 35, colunas A até J)
  const clearRange = sheet.getRange(10, 1, 26, 10);
  clearRange.clearContent();

  const formatBR = (num, dec) => {
    if (num === undefined || num === null || isNaN(num)) return '0,000';
    return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  // Reescrever organizadamente a partir da linha 10, Coluna B (índice 2)
  for (let i = 0; i < validRecords.length; i++) {
    const rec = validRecords[i];
    const targetRow = 10 + i;

    const rowValues = [
      rec.data,
      rec.diaSemana,
      rec.contexto,
      formatBR(rec.peso, 3),
      formatBR(rec.variacaoAnterior, 3),
      formatBR(rec.variacaoInicial, 3),
      formatBR(rec.imc, 2),
      rec.observacoes
    ];

    sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
  }
}

function organizarAbaMedidas(sheet) {
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  let headerRow = 5;

  const validRecords = [];

  for (let r = headerRow; r < data.length; r++) {
    const row = data[r];
    let rawDate = row[1]; // Coluna B
    let shifted = false;

    if (!rawDate && row[0]) {
      rawDate = row[0];
      shifted = true;
    }

    const formattedDate = formatDate(rawDate);
    if (!formattedDate || formattedDate.toLowerCase() === 'data') continue;

    // Colunas de medidas
    const offset = shifted ? 0 : 1;
    const abdomen = parseCleanNumber(row[offset + 5]); // Coluna G (index 6, offset 1 + 5 = 6)
    const cintura = parseCleanNumber(row[offset + 4]);
    const quadril = parseCleanNumber(row[offset + 6]);

    if (abdomen > 0 || cintura > 0 || quadril > 0) {
      validRecords.push({
        data: formattedDate,
        pescoco: parseCleanNumber(row[offset + 1]) || '',
        ombro: parseCleanNumber(row[offset + 2]) || '',
        torax: parseCleanNumber(row[offset + 3]) || '',
        cintura: cintura || '',
        abdomen: abdomen || '',
        quadril: quadril || '',
        bracoDir: parseCleanNumber(row[offset + 7]) || '',
        bracoEsq: parseCleanNumber(row[offset + 8]) || '',
        antebracoDir: parseCleanNumber(row[offset + 9]) || '',
        antebracoEsq: parseCleanNumber(row[offset + 10]) || '',
        coxaDir: parseCleanNumber(row[offset + 11]) || '',
        coxaEsq: parseCleanNumber(row[offset + 12]) || '',
        panturrilhaDir: parseCleanNumber(row[offset + 13]) || '',
        panturrilhaEsq: parseCleanNumber(row[offset + 14]) || '',
        observacoes: String(row[offset + 15] || '')
      });
    }
  }

  if (validRecords.length === 0) {
    validRecords.push({
      data: '16/11/2026',
      pescoco: '', ombro: '', torax: '', cintura: '',
      abdomen: 127.0, quadril: '', bracoDir: '', bracoEsq: '',
      antebracoDir: '', antebracoEsq: '', coxaDir: '', coxaEsq: '',
      panturrilhaDir: '', panturrilhaEsq: '',
      observacoes: 'Medida preliminar com trena na altura do umbigo expirando até ficar sem fôlego'
    });
  }

  // Limpar da linha 6 à 25
  sheet.getRange(6, 1, 20, 18).clearContent();

  const formatVal = (v) => {
    if (v === '' || v === undefined || v === null) return '';
    return typeof v === 'number' ? String(v).replace('.', ',') : v;
  };

  for (let i = 0; i < validRecords.length; i++) {
    const rec = validRecords[i];
    const targetRow = 6 + i;

    const rowValues = [
      rec.data,
      formatVal(rec.pescoco),
      formatVal(rec.ombro),
      formatVal(rec.torax),
      formatVal(rec.cintura),
      formatVal(rec.abdomen),
      formatVal(rec.quadril),
      formatVal(rec.bracoDir),
      formatVal(rec.bracoEsq),
      formatVal(rec.antebracoDir),
      formatVal(rec.antebracoEsq),
      formatVal(rec.coxaDir),
      formatVal(rec.coxaEsq),
      formatVal(rec.panturrilhaDir),
      formatVal(rec.panturrilhaEsq),
      rec.observacoes
    ];

    sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
  }
}

// ==========================================
// LEITURA PARA A API
// ==========================================

function parseWeightSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 9; r < data.length; r++) { // Linha 10 (índice 9) em diante
    const row = data[r];
    const formattedDate = formatDate(row[1]); // Coluna B
    if (!formattedDate) continue;

    const peso = parseCleanNumber(row[4]); // Coluna E
    if (peso <= 30) continue;

    records.push({
      id: 'w-sheet-' + (r + 1),
      data: formattedDate,
      diaSemana: String(row[2] || ''),
      contexto: String(row[3] || ''),
      peso: peso,
      variacaoAnterior: parseCleanNumber(row[5]),
      variacaoInicial: parseCleanNumber(row[6]),
      imc: parseCleanNumber(row[7]),
      observacoes: String(row[8] || '')
    });
  }

  return records;
}

function parseMeasureSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 5; r < data.length; r++) { // Linha 6 (índice 5) em diante
    const row = data[r];
    const formattedDate = formatDate(row[1]); // Coluna B
    if (!formattedDate) continue;

    const parseNum = (val) => {
      const p = parseCleanNumber(val);
      return p > 0 ? p : undefined;
    };

    const abdomen = parseNum(row[6]); // Coluna G
    const cintura = parseNum(row[5]); // Coluna F
    const quadril = parseNum(row[7]); // Coluna H

    if (!abdomen && !cintura && !quadril && !parseNum(row[2])) continue;

    records.push({
      id: 'm-sheet-' + (r + 1),
      data: formattedDate,
      pescoco: parseNum(row[2]),
      ombro: parseNum(row[3]),
      torax: parseNum(row[4]),
      cintura: cintura,
      abdomen: abdomen,
      quadril: quadril,
      bracoDir: parseNum(row[8]),
      bracoEsq: parseNum(row[9]),
      antebracoDir: parseNum(row[10]),
      antebracoEsq: parseNum(row[11]),
      coxaDir: parseNum(row[12]),
      coxaEsq: parseNum(row[13]),
      panturrilhaDir: parseNum(row[14]),
      panturrilhaEsq: parseNum(row[15]),
      observacoes: String(row[16] || '')
    });
  }

  return records;
}

// Inserção direta
function addWeightToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 10;

  for (let r = 9; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  const formatBR = (num, dec) => {
    if (num === undefined || num === null || isNaN(num)) return '0,000';
    return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  const rowValues = [
    d.data,
    d.diaSemana,
    d.contexto,
    formatBR(d.peso, 3),
    formatBR(d.variacaoAnterior, 3),
    formatBR(d.variacaoInicial, 3),
    formatBR(d.imc, 2),
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
}

function addMeasureToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 6;

  for (let r = 5; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  const formatVal = (v) => {
    if (v === '' || v === undefined || v === null) return '';
    return typeof v === 'number' ? String(v).replace('.', ',') : v;
  };

  const rowValues = [
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
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
}

function parseCleanNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/\s+/g, '').replace('kg', '').replace('cm', '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(val).trim();
  if (s.includes('GMT') || s.includes('T')) {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }
  }
  return s;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
