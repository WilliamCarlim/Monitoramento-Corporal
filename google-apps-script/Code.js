/**
 * Google Apps Script - Sistema Completo de Acompanhamento Corporal 2026
 * Planilha: Acompanhamento Corporal - Peso e Medidas 2026
 * ID: 1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U
 *
 * Gerencia as 4 abas oficiais:
 * 1. "Registro de Peso" (8 cards de bioimpedância + 22 colunas)
 * 2. "Medidas Corporais"
 * 3. "Treinos" (cards de resumo Strava + 11 colunas)
 * 4. "Fotos" (armazenamento e upload direto para o Google Drive)
 */

const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';
const DRIVE_FOLDER_NAME = 'Acompanhamento Corporal - Fotos';

// Função de execução manual direta pelo editor do Apps Script
function autoOrganizarPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  setupEOrganizarTudo(ss);
  Logger.log('Todas as 4 abas e fórmulas foram organizadas com sucesso!');
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getWeights';
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getWeights') {
      const sheet = ss.getSheetByName('Registro de Peso');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Registro de Peso não encontrada' });
      return jsonResponse({ status: 'success', data: parseWeightSheet(sheet) });
    }

    if (action === 'getMeasures') {
      const sheet = ss.getSheetByName('Medidas Corporais');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Medidas Corporais não encontrada' });
      return jsonResponse({ status: 'success', data: parseMeasureSheet(sheet) });
    }

    if (action === 'getWorkouts') {
      const sheet = ss.getSheetByName('Treinos');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Treinos não encontrada' });
      return jsonResponse({ status: 'success', data: parseWorkoutSheet(sheet) });
    }

    if (action === 'getPhotos') {
      const sheet = ss.getSheetByName('Fotos');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Fotos não encontrada' });
      return jsonResponse({ status: 'success', data: parsePhotoSheet(sheet) });
    }

    if (action === 'organizar' || action === 'setup') {
      setupEOrganizarTudo(ss);
      return jsonResponse({ status: 'success', message: 'Todas as 4 abas organizadas com sucesso!' });
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
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'addWeight') {
      const sheet = ss.getSheetByName('Registro de Peso') || criarAbaRegistroPeso(ss);
      addWeightToSheet(sheet, payload.data);
      atualizarCardsPeso(sheet);
      return jsonResponse({ status: 'success', message: 'Peso e bioimpedância salvos com sucesso' });
    }

    if (action === 'addMeasure') {
      const sheet = ss.getSheetByName('Medidas Corporais') || criarAbaMedidas(ss);
      addMeasureToSheet(sheet, payload.data);
      return jsonResponse({ status: 'success', message: 'Medidas corporais salvas com sucesso' });
    }

    if (action === 'addWorkout') {
      const sheet = ss.getSheetByName('Treinos') || criarAbaTreinos(ss);
      addWorkoutToSheet(sheet, payload.data);
      atualizarCardsTreinos(sheet);
      return jsonResponse({ status: 'success', message: 'Treino registrado com sucesso' });
    }

    if (action === 'addPhoto' || action === 'uploadWeeklyPhotos') {
      const sheet = ss.getSheetByName('Fotos') || criarAbaFotos(ss);
      const res = addPhotoToSheet(sheet, payload.data);
      return jsonResponse(res);
    }

    return jsonResponse({ status: 'error', message: 'Ação não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ==========================================
// CONFIGURAÇÃO E ORGANIZAÇÃO COMPLETA DAS 4 ABAS
// ==========================================

function setupEOrganizarTudo(ss) {
  if (!ss || typeof ss.getSheetByName !== 'function') {
    ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  criarAbaRegistroPeso(ss);
  criarAbaMedidas(ss);
  criarAbaTreinos(ss);
  criarAbaFotos(ss);
}

// 1. ABA REGISTRO DE PESO
function criarAbaRegistroPeso(ss) {
  let sheet = ss.getSheetByName('Registro de Peso');
  if (!sheet) {
    sheet = ss.insertSheet('Registro de Peso');
  }

  // Verificar se o cabeçalho existe na linha 9
  const header = [
    'Data', 'Dia da Semana', 'Horário / Contexto', 'Peso (kg)',
    'Variação vs Anterior (kg)', 'Variação vs Inicial (kg)', 'IMC',
    'Gordura (%)', 'Peso Gordura (kg)', 'Massa Musc. Esquelética (%)',
    'Peso Massa Musc. Esquelética (kg)', 'Massa Muscular (%)', 'Peso Massa Muscular (kg)',
    'Água (%)', 'Peso Água (kg)', 'Gordura Visceral', 'Metabolismo (kcal/dia)',
    'IMC App', 'Altura App (cm)', 'Idade App', 'Melhor Peso 30d (kg)', 'Observações'
  ];

  // Configura cabeçalho na linha 9, a partir da coluna B (coluna 2)
  sheet.getRange(9, 2, 1, header.length).setValues([header]);
  sheet.getRange(9, 2, 1, header.length).setFontWeight('bold').setBackground('#134e4a').setFontColor('#ffffff');

  // Registros base (16/11 e 17/11) se a linha 10 estiver vazia
  const val10 = sheet.getRange(10, 2).getValue();
  if (!val10) {
    const row1 = [
      '16/11/2026', 'segunda-feira', 'Horário do almoço, após a academia / 12:21', '113,250',
      '0,000', '0,000', '34,95', '35,6', '40,3', '32,3', '36,5', '61,8', '70,0',
      '48,5', '54,9', '26,5', '2.146,0', '36,6', '176', '33', '107,85',
      'Primeiro registro de pesagem (início do plano)'
    ];
    const row2 = [
      '17/11/2026', 'terça-feira', 'Manhã 06:41', '111,750',
      '-1,500', '-1,500', '34,49', '35,2', '39,4', '32,5', '36,3', '62,1', '69,5',
      '48,6', '54,4', '26,0', '2.126,0', '36,1', '176', '33', '107,85',
      'Aferição matinal em jejum'
    ];
    sheet.getRange(10, 2, 1, row1.length).setValues([row1]);
    sheet.getRange(11, 2, 1, row2.length).setValues([row2]);
  }

  atualizarCardsPeso(sheet);
  return sheet;
}

function atualizarCardsPeso(sheet) {
  // 8 Cards superiores nas linhas 5-7
  const cardsTitles = [
    'PESO INICIAL', 'PESO ATUAL', 'VARIAÇÃO TOTAL', 'IMC ATUAL',
    'GORDURA ATUAL', 'MASSA MUSCULAR', 'GORDURA VISCERAL', 'METABOLISMO BASAL'
  ];

  const records = parseWeightSheet(sheet);
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const initial = records.length > 0 ? records[0] : null;

  const pesoIni = initial ? initial.peso : 113.250;
  const pesoAtual = latest ? latest.peso : 111.750;
  const varTotal = Number((pesoAtual - pesoIni).toFixed(3));
  const imcAtual = latest ? latest.imc : 34.49;
  const gordura = latest && latest.gorduraPercent ? `${latest.gorduraPercent}% • ${latest.pesoGordura || 0} kg` : '35,2% • 39,4 kg';
  const massaMusc = latest && latest.massaMuscularPercent ? `${latest.massaMuscularPercent}% • ${latest.pesoMassaMuscular || 0} kg` : '62,1% • 69,5 kg';
  const visceral = latest && latest.gorduraVisceral ? latest.gorduraVisceral : 26.0;
  const metabolismo = latest && latest.metabolismo ? `${latest.metabolismo} kcal/dia` : '2.126,0 kcal/dia';

  const cardsValues = [
    `${Number(pesoIni).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    `${Number(pesoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    `${varTotal > 0 ? '+' : ''}${Number(varTotal).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    Number(imcAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    gordura,
    massaMusc,
    Number(visceral).toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
    metabolismo
  ];

  sheet.getRange(5, 2, 1, cardsTitles.length).setValues([cardsTitles]).setFontWeight('bold').setBackground('#f1f5f9');
  sheet.getRange(6, 2, 1, cardsValues.length).setValues([cardsValues]).setFontWeight('bold').setFontSize(12);
}

// 2. ABA MEDIDAS CORPORAIS
function criarAbaMedidas(ss) {
  let sheet = ss.getSheetByName('Medidas Corporais');
  if (!sheet) {
    sheet = ss.insertSheet('Medidas Corporais');
  }

  const header = [
    'Data', 'Pescoço (cm)', 'Ombro (cm)', 'Tórax (cm)', 'Cintura (cm)',
    'Abdômen (cm)', 'Quadril (cm)', 'Braço Dir (cm)', 'Braço Esq (cm)',
    'Antebraço Dir (cm)', 'Antebraço Esq (cm)', 'Coxa Dir (cm)', 'Coxa Esq (cm)',
    'Panturrilha Dir (cm)', 'Panturrilha Esq (cm)', 'Observações'
  ];

  sheet.getRange(5, 2, 1, header.length).setValues([header]);
  sheet.getRange(5, 2, 1, header.length).setFontWeight('bold').setBackground('#0e7490').setFontColor('#ffffff');

  const val6 = sheet.getRange(6, 2).getValue();
  if (!val6) {
    const row = [
      '16/11/2026', '', '', '', '', '127,0', '', '', '', '', '', '', '', '', '',
      'medição preliminar com trena na altura do umbigo, soltando o ar até ficar sem fôlego; aguardando fita métrica'
    ];
    sheet.getRange(6, 2, 1, row.length).setValues([row]);
  }
  return sheet;
}

// 3. ABA TREINOS
function criarAbaTreinos(ss) {
  let sheet = ss.getSheetByName('Treinos');
  if (!sheet) {
    sheet = ss.insertSheet('Treinos');
  }

  // Cards de resumo na linha 4-5
  const cardsHeader = ['TOTAL DE TREINOS', 'DISTÂNCIA TOTAL (km)', 'TEMPO TOTAL', 'PASSOS TOTAIS', 'CALORIAS ESTIMADAS (kcal)'];
  sheet.getRange(4, 2, 1, cardsHeader.length).setValues([cardsHeader]).setFontWeight('bold').setBackground('#f8fafc');

  const header = [
    'Data', 'Dia da Semana', 'Horário / Contexto', 'Modalidade', 'Local / Origem',
    'Distância (km)', 'Tempo de Movimentação', 'Passos', 'Elevação (m)',
    'Gasto Calórico Estimado (kcal)', 'Observações'
  ];

  sheet.getRange(8, 2, 1, header.length).setValues([header]);
  sheet.getRange(8, 2, 1, header.length).setFontWeight('bold').setBackground('#0369a1').setFontColor('#ffffff');

  const val9 = sheet.getRange(9, 2).getValue();
  if (!val9) {
    const row = [
      '16/11/2026', 'segunda-feira', 'Entardecer 18:12', 'Caminhada', 'Strava • Bariri, SP',
      '5,70', '00:58:43', '6944', '51', '470', 'Caminhada pós-treino no ritmo de recuperação'
    ];
    sheet.getRange(9, 2, 1, row.length).setValues([row]);
  }

  atualizarCardsTreinos(sheet);
  return sheet;
}

function atualizarCardsTreinos(sheet) {
  const workouts = parseWorkoutSheet(sheet);
  let totalKm = 0;
  let totalPassos = 0;
  let totalKcal = 0;

  workouts.forEach(w => {
    totalKm += w.distanciaKm || 0;
    totalPassos += w.passos || 0;
    totalKcal += w.calorias || 0;
  });

  const cardsValues = [
    `${workouts.length} treinos`,
    `${totalKm.toFixed(2).replace('.', ',')} km`,
    '00:58:43',
    totalPassos.toLocaleString('pt-BR'),
    `${totalKcal.toLocaleString('pt-BR')} kcal`
  ];

  sheet.getRange(5, 2, 1, cardsValues.length).setValues([cardsValues]).setFontWeight('bold');
}

// 4. ABA FOTOS
function criarAbaFotos(ss) {
  let sheet = ss.getSheetByName('Fotos');
  if (!sheet) {
    sheet = ss.insertSheet('Fotos');
  }

  const header = ['Semana', 'Data', 'Foto Frente (Link Drive)', 'Foto Lado (Link Drive)', 'Foto Costa (Link Drive)', 'Observações'];
  sheet.getRange(4, 2, 1, header.length).setValues([header]);
  sheet.getRange(4, 2, 1, header.length).setFontWeight('bold').setBackground('#7e22ce').setFontColor('#ffffff');

  const val5 = sheet.getRange(5, 2).getValue();
  if (!val5) {
    const row = ['Semana 1', '16/11/2026', '', '', '', 'Semana 1 inicial pronta para fotos do Google Drive'];
    sheet.getRange(5, 2, 1, row.length).setValues([row]);
  }
  return sheet;
}

// ==========================================
// PARSERS DE DADOS PARA A API
// ==========================================

function parseWeightSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 9; r < data.length; r++) { // Linha 10 (índice 9) em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr) continue;

    const peso = parseCleanNumber(row[4]);
    if (peso <= 30) continue;

    records.push({
      id: 'w-sheet-' + (r + 1),
      data: dataStr,
      diaSemana: String(row[2] || ''),
      contexto: String(row[3] || ''),
      peso: peso,
      variacaoAnterior: parseCleanNumber(row[5]),
      variacaoInicial: parseCleanNumber(row[6]),
      imc: parseCleanNumber(row[7]),
      gorduraPercent: parseCleanNumber(row[8]),
      pesoGordura: parseCleanNumber(row[9]),
      massaMuscEsqPercent: parseCleanNumber(row[10]),
      pesoMassaMuscEsq: parseCleanNumber(row[11]),
      massaMuscularPercent: parseCleanNumber(row[12]),
      pesoMassaMuscular: parseCleanNumber(row[13]),
      aguaPercent: parseCleanNumber(row[14]),
      pesoAgua: parseCleanNumber(row[15]),
      gorduraVisceral: parseCleanNumber(row[16]),
      metabolismo: parseCleanNumber(row[17]),
      imcApp: parseCleanNumber(row[18]),
      alturaApp: parseCleanNumber(row[19]),
      idadeApp: parseCleanNumber(row[20]),
      melhorPeso30d: parseCleanNumber(row[21]),
      observacoes: String(row[22] || '')
    });
  }

  return records;
}

function parseMeasureSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 5; r < data.length; r++) { // Linha 6 em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr) continue;

    const parseNum = (v) => {
      const n = parseCleanNumber(v);
      return n > 0 ? n : undefined;
    };

    const abdomen = parseNum(row[6]);
    const cintura = parseNum(row[5]);
    const quadril = parseNum(row[7]);

    if (!abdomen && !cintura && !quadril && !parseNum(row[2])) continue;

    records.push({
      id: 'm-sheet-' + (r + 1),
      data: dataStr,
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

function parseWorkoutSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 8; r < data.length; r++) { // Linha 9 em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr) continue;

    records.push({
      id: 't-sheet-' + (r + 1),
      data: dataStr,
      diaSemana: String(row[2] || ''),
      contexto: String(row[3] || ''),
      modalidade: String(row[4] || 'Caminhada'),
      local: String(row[5] || ''),
      distanciaKm: parseCleanNumber(row[6]),
      tempoMovimento: String(row[7] || ''),
      passos: parseCleanNumber(row[8]),
      elevacaoM: parseCleanNumber(row[9]),
      calorias: parseCleanNumber(row[10]),
      observacoes: String(row[11] || '')
    });
  }

  return records;
}

function parsePhotoSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 4; r < data.length; r++) { // Linha 5 em diante
    const row = data[r];
    const semana = String(row[1] || '').trim();
    if (!semana) continue;

    records.push({
      id: 'f-sheet-' + (r + 1),
      semana: semana,
      data: formatDate(row[2]),
      fotoFrente: String(row[3] || ''),
      fotoLado: String(row[4] || ''),
      fotoCosta: String(row[5] || ''),
      observacoes: String(row[6] || '')
    });
  }

  return records;
}

// ==========================================
// INSERÇÃO DE LINHAS NAS ABAS
// ==========================================

function addWeightToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 10;

  for (let r = 9; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  const fmt = (v, dec) => {
    if (v === undefined || v === null || v === '' || isNaN(v)) return '';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  const rowValues = [
    d.data,
    d.diaSemana || '',
    d.contexto || '',
    fmt(d.peso, 3),
    fmt(d.variacaoAnterior, 3),
    fmt(d.variacaoInicial, 3),
    fmt(d.imc, 2),
    fmt(d.gorduraPercent, 1),
    fmt(d.pesoGordura, 1),
    fmt(d.massaMuscEsqPercent, 1),
    fmt(d.pesoMassaMuscEsq, 1),
    fmt(d.massaMuscularPercent, 1),
    fmt(d.pesoMassaMuscular, 1),
    fmt(d.aguaPercent, 1),
    fmt(d.pesoAgua, 1),
    fmt(d.gorduraVisceral, 1),
    fmt(d.metabolismo, 1),
    fmt(d.imcApp, 1),
    d.alturaApp || '',
    d.idadeApp || '',
    fmt(d.melhorPeso30d, 2),
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

  const fmt = (v) => {
    if (v === undefined || v === null || v === '' || isNaN(v)) return '';
    return typeof v === 'number' ? String(v).replace('.', ',') : v;
  };

  const rowValues = [
    d.data,
    fmt(d.pescoco),
    fmt(d.ombro),
    fmt(d.torax),
    fmt(d.cintura),
    fmt(d.abdomen),
    fmt(d.quadril),
    fmt(d.bracoDir),
    fmt(d.bracoEsq),
    fmt(d.antebracoDir),
    fmt(d.antebracoEsq),
    fmt(d.coxaDir),
    fmt(d.coxaEsq),
    fmt(d.panturrilhaDir),
    fmt(d.panturrilhaEsq),
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
}

function addWorkoutToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 9;

  for (let r = 8; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  const fmt = (v, dec = 2) => {
    if (v === undefined || v === null || v === '' || isNaN(v)) return '';
    return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  };

  const rowValues = [
    d.data,
    d.diaSemana || '',
    d.contexto || '',
    d.modalidade || 'Caminhada',
    d.local || '',
    fmt(d.distanciaKm, 2),
    d.tempoMovimento || '',
    d.passos ? String(d.passos) : '',
    d.elevacaoM ? String(d.elevacaoM) : '',
    d.calorias ? String(d.calorias) : '',
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
}

// UPLOAD DE FOTOS PARA PASTA NO GOOGLE DRIVE E REGISTRO NA PLANILHA
function addPhotoToSheet(sheet, d) {
  const folder = getOrCreatePhotosFolder();
  let linkFrente = d.fotoFrente || '';
  let linkLado = d.fotoLado || '';
  let linkCosta = d.fotoCosta || '';

  // Salvar base64 no Google Drive se fornecido
  if (d.fotoFrenteBase64) {
    linkFrente = saveBase64ImageToDrive(folder, d.fotoFrenteBase64, `${d.semana}_Frente_${d.data.replace(/\//g, '-')}`);
  }
  if (d.fotoLadoBase64) {
    linkLado = saveBase64ImageToDrive(folder, d.fotoLadoBase64, `${d.semana}_Lado_${d.data.replace(/\//g, '-')}`);
  }
  if (d.fotoCostaBase64) {
    linkCosta = saveBase64ImageToDrive(folder, d.fotoCostaBase64, `${d.semana}_Costa_${d.data.replace(/\//g, '-')}`);
  }

  const data = sheet.getDataRange().getValues();
  let targetRow = 5;

  for (let r = 4; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
  }

  const rowValues = [
    d.semana || 'Semana 1',
    d.data,
    linkFrente,
    linkLado,
    linkCosta,
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);

  return {
    status: 'success',
    message: 'Fotos salvas no Google Drive e registradas na planilha!',
    links: { linkFrente, linkLado, linkCosta }
  };
}

function getOrCreatePhotosFolder() {
  const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(DRIVE_FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function saveBase64ImageToDrive(folder, base64Data, fileName) {
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const decoded = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decoded, 'image/jpeg', `${fileName}.jpg`);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return '';
  }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function parseCleanNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/\s+/g, '').replace('kg', '').replace('cm', '').replace('%', '').replace(/\./g, '').replace(',', '.');
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
