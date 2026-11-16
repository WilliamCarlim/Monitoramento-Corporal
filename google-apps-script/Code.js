/**
 * Google Apps Script - Ponte Web Inteligente para Acompanhamento Corporal 2026
 * Planilha: Acompanhamento Corporal - Peso e Medidas 2026
 * ID: 1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U
 */

const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';

function doGet(e) {
  try {
    const action = e.parameter.action || 'getWeights';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getWeights') {
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Registro de Peso não encontrada' });

      const data = sheet.getDataRange().getValues();
      const records = parseWeightSheet(data);
      return jsonResponse({ status: 'success', data: records });
    }

    if (action === 'getMeasures') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Medidas Corporais não encontrada' });

      const data = sheet.getDataRange().getValues();
      const records = parseMeasureSheet(data);
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
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba não encontrada' });
      addWeightToSheet(sheet, payload.data);
      return jsonResponse({ status: 'success', message: 'Peso adicionado com sucesso' });
    }

    if (action === 'addMeasure') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba não encontrada' });
      addMeasureToSheet(sheet, payload.data);
      return jsonResponse({ status: 'success', message: 'Medidas adicionadas com sucesso' });
    }

    return jsonResponse({ status: 'error', message: 'Ação não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ==========================================
// PARSING INTELIGENTE COM DETECÇÃO DE COLUNAS
// ==========================================

function parseWeightSheet(data) {
  // 1. Achar a linha do cabeçalho (que contém 'Data' e 'Peso')
  let headerRowIndex = -1;
  let colMap = {};

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim().toLowerCase();
      if (val === 'data') {
        headerRowIndex = r;
        break;
      }
    }
    if (headerRowIndex !== -1) {
      // Mapear colunas pelo nome do cabeçalho
      for (let c = 0; c < row.length; c++) {
        const h = String(row[c]).trim().toLowerCase();
        if (h === 'data') colMap.data = c;
        else if (h.includes('dia')) colMap.diaSemana = c;
        else if (h.includes('contexto') || h.includes('horário')) colMap.contexto = c;
        else if (h.includes('peso')) colMap.peso = c;
        else if (h.includes('anterior')) colMap.variacaoAnterior = c;
        else if (h.includes('inicial') && h.includes('var')) colMap.variacaoInicial = c;
        else if (h === 'imc') colMap.imc = c;
        else if (h.includes('observa')) colMap.observacoes = c;
      }
      break;
    }
  }

  if (headerRowIndex === -1) return [];

  const records = [];
  // 2. Ler apenas linhas abaixo do cabeçalho
  for (let r = headerRowIndex + 1; r < data.length; r++) {
    const row = data[r];
    const rawData = colMap.data !== undefined ? row[colMap.data] : null;
    const formattedData = formatDate(rawData);

    // Se não tiver data ou se a data for cabeçalho/vazio, ignora
    if (!formattedData || formattedData.trim() === '') continue;

    const rawPeso = colMap.peso !== undefined ? row[colMap.peso] : 0;
    const peso = parseCleanNumber(rawPeso);

    // Ignora linhas vazias de template onde o peso é zero
    if (peso <= 0) continue;

    const rawVarAnt = colMap.variacaoAnterior !== undefined ? row[colMap.variacaoAnterior] : 0;
    const rawVarIni = colMap.variacaoInicial !== undefined ? row[colMap.variacaoInicial] : 0;
    const rawImc = colMap.imc !== undefined ? row[colMap.imc] : 0;

    records.push({
      id: 'w-sheet-' + (r + 1),
      data: formattedData,
      diaSemana: colMap.diaSemana !== undefined ? String(row[colMap.diaSemana] || '') : '',
      contexto: colMap.contexto !== undefined ? String(row[colMap.contexto] || '') : '',
      peso: peso,
      variacaoAnterior: parseCleanNumber(rawVarAnt),
      variacaoInicial: parseCleanNumber(rawVarIni),
      imc: parseCleanNumber(rawImc),
      observacoes: colMap.observacoes !== undefined ? String(row[colMap.observacoes] || '') : ''
    });
  }

  return records;
}

function parseMeasureSheet(data) {
  let headerRowIndex = -1;
  let colMap = {};

  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c]).trim().toLowerCase();
      if (val === 'data') {
        headerRowIndex = r;
        break;
      }
    }
    if (headerRowIndex !== -1) {
      for (let c = 0; c < row.length; c++) {
        const h = String(row[c]).trim().toLowerCase();
        if (h === 'data') colMap.data = c;
        else if (h.includes('pescoço')) colMap.pescoco = c;
        else if (h.includes('ombro')) colMap.ombro = c;
        else if (h.includes('tórax') || h.includes('torax')) colMap.torax = c;
        else if (h.includes('cintura')) colMap.cintura = c;
        else if (h.includes('abdômen') || h.includes('abdomen')) colMap.abdomen = c;
        else if (h.includes('quadril')) colMap.quadril = c;
        else if (h.includes('braço dir')) colMap.bracoDir = c;
        else if (h.includes('braço esq')) colMap.bracoEsq = c;
        else if (h.includes('antebraço dir')) colMap.antebracoDir = c;
        else if (h.includes('antebraço esq')) colMap.antebracoEsq = c;
        else if (h.includes('coxa dir')) colMap.coxaDir = c;
        else if (h.includes('coxa esq')) colMap.coxaEsq = c;
        else if (h.includes('panturrilha dir')) colMap.panturrilhaDir = c;
        else if (h.includes('panturrilha esq')) colMap.panturrilhaEsq = c;
        else if (h.includes('observa')) colMap.observacoes = c;
      }
      break;
    }
  }

  if (headerRowIndex === -1) return [];

  const records = [];
  for (let r = headerRowIndex + 1; r < data.length; r++) {
    const row = data[r];
    const rawData = colMap.data !== undefined ? row[colMap.data] : null;
    const formattedData = formatDate(rawData);

    if (!formattedData || formattedData.trim() === '') continue;

    const abdomen = colMap.abdomen !== undefined ? parseCleanNumber(row[colMap.abdomen]) : undefined;
    const cintura = colMap.cintura !== undefined ? parseCleanNumber(row[colMap.cintura]) : undefined;
    const quadril = colMap.quadril !== undefined ? parseCleanNumber(row[colMap.quadril]) : undefined;
    const torax = colMap.torax !== undefined ? parseCleanNumber(row[colMap.torax]) : undefined;
    const pescoco = colMap.pescoco !== undefined ? parseCleanNumber(row[colMap.pescoco]) : undefined;
    const bracoDir = colMap.bracoDir !== undefined ? parseCleanNumber(row[colMap.bracoDir]) : undefined;
    const bracoEsq = colMap.bracoEsq !== undefined ? parseCleanNumber(row[colMap.bracoEsq]) : undefined;
    const antebracoDir = colMap.antebracoDir !== undefined ? parseCleanNumber(row[colMap.antebracoDir]) : undefined;
    const antebracoEsq = colMap.antebracoEsq !== undefined ? parseCleanNumber(row[colMap.antebracoEsq]) : undefined;
    const coxaDir = colMap.coxaDir !== undefined ? parseCleanNumber(row[colMap.coxaDir]) : undefined;
    const coxaEsq = colMap.coxaEsq !== undefined ? parseCleanNumber(row[colMap.coxaEsq]) : undefined;
    const panturrilhaDir = colMap.panturrilhaDir !== undefined ? parseCleanNumber(row[colMap.panturrilhaDir]) : undefined;
    const panturrilhaEsq = colMap.panturrilhaEsq !== undefined ? parseCleanNumber(row[colMap.panturrilhaEsq]) : undefined;

    // Se nenhuma medida estiver preenchida nesta linha, ignora
    const hasAny = [abdomen, cintura, quadril, torax, pescoco, bracoDir, bracoEsq, antebracoDir, antebracoEsq, coxaDir, coxaEsq, panturrilhaDir, panturrilhaEsq].some(v => v !== undefined && v > 0);
    if (!hasAny) continue;

    records.push({
      id: 'm-sheet-' + (r + 1),
      data: formattedData,
      pescoco: pescoco || undefined,
      ombro: colMap.ombro !== undefined ? parseCleanNumber(row[colMap.ombro]) : undefined,
      torax: torax || undefined,
      cintura: cintura || undefined,
      abdomen: abdomen || undefined,
      quadril: quadril || undefined,
      bracoDir: bracoDir || undefined,
      bracoEsq: bracoEsq || undefined,
      antebracoDir: antebracoDir || undefined,
      antebracoEsq: antebracoEsq || undefined,
      coxaDir: coxaDir || undefined,
      coxaEsq: coxaEsq || undefined,
      panturrilhaDir: panturrilhaDir || undefined,
      panturrilhaEsq: panturrilhaEsq || undefined,
      observacoes: colMap.observacoes !== undefined ? String(row[colMap.observacoes] || '') : ''
    });
  }

  return records;
}

// ==========================================
// INSERÇÃO INTELIGENTE NA LINHA CORRETA
// ==========================================

function addWeightToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let headerRowIndex = -1;
  let dataColIndex = 1; // Coluna B por padrão

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      if (String(data[r][c]).trim().toLowerCase() === 'data') {
        headerRowIndex = r;
        dataColIndex = c;
        break;
      }
    }
    if (headerRowIndex !== -1) break;
  }

  if (headerRowIndex === -1) headerRowIndex = 8; // Linha 9 (índice 8)

  // Encontra a primeira linha vaga abaixo do cabeçalho onde a data está vazia
  let targetRow = -1;
  for (let r = headerRowIndex + 1; r < data.length; r++) {
    const val = data[r][dataColIndex];
    if (!val || String(val).trim() === '') {
      targetRow = r + 1; // 1-indexed para Sheets
      break;
    }
  }

  if (targetRow === -1) {
    targetRow = sheet.getLastRow() + 1;
  }

  const formatBR = (num, dec) => {
    if (num === undefined || num === null || isNaN(num)) return '0,000';
    return Number(num).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  // Escreve a partir da coluna B (dataColIndex + 1)
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

  sheet.getRange(targetRow, dataColIndex + 1, 1, rowValues.length).setValues([rowValues]);
}

function addMeasureToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let headerRowIndex = -1;
  let dataColIndex = 1;

  for (let r = 0; r < data.length; r++) {
    for (let c = 0; c < data[r].length; c++) {
      if (String(data[r][c]).trim().toLowerCase() === 'data') {
        headerRowIndex = r;
        dataColIndex = c;
        break;
      }
    }
    if (headerRowIndex !== -1) break;
  }

  if (headerRowIndex === -1) headerRowIndex = 4; // Linha 5 (índice 4)

  let targetRow = -1;
  for (let r = headerRowIndex + 1; r < data.length; r++) {
    const val = data[r][dataColIndex];
    if (!val || String(val).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  if (targetRow === -1) {
    targetRow = sheet.getLastRow() + 1;
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

  sheet.getRange(targetRow, dataColIndex + 1, 1, rowValues.length).setValues([rowValues]);
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
  // Se for string no formato ISO ou data por extenso
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
