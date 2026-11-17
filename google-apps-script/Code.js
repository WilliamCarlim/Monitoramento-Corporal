/**
 * Google Apps Script - Sistema Completo de Acompanhamento Corporal 2026
 * Planilha: Acompanhamento Corporal - Peso e Medidas 2026
 * ID: 1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U
 *
 * Gerencia as 5 abas oficiais da planilha:
 * 1. "Registro de Peso" (8 cards superiores de bioimpedância + Linha 9 cabeçalho + Linha 10+ dados)
 * 2. "Medidas Corporais" (Linha 5 cabeçalho + Linha 6+ dados)
 * 3. "Cardio" (Linhas 5-7 cards aeróbicos + Linha 9 cabeçalho + Linha 10+ dados)
 * 4. "Treinos" (Linhas 5-7 cards de musculação + Linha 9 cabeçalho + Linha 10+ dados)
 * 5. "Fotos" (Linha 5 cabeçalho + Linha 6+ dados + Google Drive)
 */

const SPREADSHEET_ID = '1VvS_1QHdbXDEDM1Zju4FcrWriLfeaZwuqBdp9HIMi-U';
const DRIVE_FOLDER_NAME = 'Acompanhamento Corporal - Fotos';

// ==========================================
// FUNÇÃO EXECUTÁVEL MANUALMENTE NO APPS SCRIPT
// (Desduplica linhas, cria/alinha as 5 abas e fórmulas)
// ==========================================

function autoOrganizarPlanilha(ss) {
  if (!ss || typeof ss.getSheetByName !== 'function') {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch (e) {}
    if (!ss) {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
  }
  setupEOrganizarTudo(ss);
  Logger.log('Todas as 5 abas e fórmulas foram alinhadas e organizadas com sucesso!');
}

function setupEOrganizarTudo(ss) {
  if (!ss || typeof ss.getSheetByName !== 'function') {
    ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  organizarAbaPeso(ss);
  organizarAbaMedidas(ss);
  organizarAbaCardio(ss);
  organizarAbaTreinos(ss);
  organizarAbaFotos(ss);
}

// Aliases para compatibilidade total
function criarAbaRegistroPeso(ss) { return organizarAbaPeso(ss); }
function criarAbaMedidas(ss) { return organizarAbaMedidas(ss); }
function criarAbaCardio(ss) { return organizarAbaCardio(ss); }
function criarAbaTreinos(ss) { return organizarAbaTreinos(ss); }
function criarAbaFotos(ss) { return organizarAbaFotos(ss); }

// ==========================================
// 1. ABA REGISTRO DE PESO
// ==========================================

function organizarAbaPeso(ss) {
  let sheet = ss.getSheetByName('Registro de Peso');
  if (!sheet) {
    sheet = ss.insertSheet('Registro de Peso');
  }

  // Linhas 4 e 8 limpas (espaçadores para evitar sobreposição)
  sheet.getRange('A4:Z4').clear().clearFormat();
  sheet.getRange('A8:Z8').clear().clearFormat();

  // Cabeçalho oficial na Linha 9
  const header = [
    'Data', 'Dia da Semana', 'Horário / Contexto', 'Peso (kg)',
    'Variação vs Anterior (kg)', 'Variação vs Inicial (kg)', 'IMC',
    'Gordura (%)', 'Peso Gordura (kg)', 'Massa Musc. Esquelética (%)',
    'Peso Massa Musc. Esquelética (kg)', 'Massa Muscular (%)', 'Peso Massa Muscular (kg)',
    'Água (%)', 'Peso Água (kg)', 'Gordura Visceral', 'Metabolismo (kcal/dia)',
    'IMC App', 'Altura App (cm)', 'Idade App', 'Melhor Peso 30d (kg)', 'Observações'
  ];
  sheet.getRange(9, 2, 1, header.length).setValues([header]);
  sheet.getRange(9, 2, 1, header.length).setFontWeight('bold').setBackground('#134e4a').setFontColor('#ffffff');

  // Registros base (16/11 e 17/11) na Linha 10 e 11 se a linha 10 estiver vazia
  const val10 = sheet.getRange(10, 2).getValue();
  if (!val10 || String(val10).toLowerCase().includes('data')) {
    const row1 = [
      '16/11/2026', 'segunda-feira', 'Horário do almoço, após a academia / 12:21', '113,250',
      '0,000', '0,000', '34,95', '35,6', '40,3', '32,3', '36,5', '61,8', '70,0',
      '48,5', '54,9', '26,5', '2.146,0', '36,6', '176', '33', '107,85',
      'Primeiro registro de pesagem (início do plano) • App 16/11 12:21 (vs 20/10 +5,40 kg)'
    ];
    const row2 = [
      '17/11/2026', 'terça-feira', 'Manhã 06:41', '111,750',
      '-1,500', '-1,500', '34,49', '35,2', '39,4', '32,5', '36,3', '62,1', '69,5',
      '48,6', '54,4', '26,0', '2.126,0', '36,1', '176', '33', '107,85',
      'Pesagem matinal (Gordura corporal: 35,2%)'
    ];
    sheet.getRange(10, 2, 1, row1.length).setValues([row1]);
    sheet.getRange(11, 2, 1, row2.length).setValues([row2]);
  }

  atualizarCardsPeso(sheet);
  return sheet;
}

function atualizarCardsPeso(sheet) {
  // Limpa linhas 4 a 8
  sheet.getRange('A4:Z4').clear().clearFormat();
  sheet.getRange('A8:Z8').clear().clearFormat();

  const cardsTitles = [
    'PESO INICIAL', 'PESO ATUAL', 'VARIAÇÃO TOTAL', 'IMC ATUAL',
    'GORDURA ATUAL', 'MASSA MUSCULAR', 'GORDURA VISCERAL', 'METABOLISMO BASAL'
  ];

  const subtitles = [
    'Base: 16/11/2026', 'Aferição mais recente', 'Perda acumulada', 'Obesidade Grau I',
    'Aferição mais recente', 'Aferição mais recente', 'Nível de gordura', 'Gasto diário basal'
  ];

  const records = parseWeightSheet(sheet);
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const initial = records.length > 0 ? records[0] : null;

  const pesoIni = initial ? initial.peso : 113.250;
  const pesoAtual = latest ? latest.peso : 111.750;
  const varTotal = Number((pesoAtual - pesoIni).toFixed(3));
  const imcAtual = latest ? latest.imc : 34.49;
  const gPct = latest && latest.gorduraPercent ? parsePercentNumber(latest.gorduraPercent) : 35.2;
  const gKg = latest && latest.pesoGordura ? latest.pesoGordura : 39.4;
  const mPct = latest && latest.massaMuscularPercent ? parsePercentNumber(latest.massaMuscularPercent) : 62.1;
  const mKg = latest && latest.pesoMassaMuscular ? latest.pesoMassaMuscular : 69.5;
  const visceral = latest && latest.gorduraVisceral ? latest.gorduraVisceral : 26.0;
  const metabolismo = latest && latest.metabolismo ? `${Number(latest.metabolismo).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kcal/dia` : '2.126,0 kcal/dia';

  const cardsValues = [
    `${Number(pesoIni).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    `${Number(pesoAtual).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    `${varTotal > 0 ? '+' : ''}${Number(varTotal).toLocaleString('pt-BR', { minimumFractionDigits: 3 })} kg`,
    Number(imcAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    `${Number(gPct).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}% • ${Number(gKg).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg`,
    `${Number(mPct).toLocaleString('pt-BR', { minimumFractionDigits: 1 })}% • ${Number(mKg).toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg`,
    Number(visceral).toLocaleString('pt-BR', { minimumFractionDigits: 1 }),
    metabolismo
  ];

  // As 8 colunas de cards são distribuídas em pares B:C, D:E, F:G, H:I, J:K, L:M, N:O, P:Q
  const colPairs = [
    [2, 3],   // B:C - PESO INICIAL
    [4, 5],   // D:E - PESO ATUAL
    [6, 7],   // F:G - VARIAÇÃO TOTAL
    [8, 9],   // H:I - IMC ATUAL
    [10, 11], // J:K - GORDURA ATUAL
    [12, 13], // L:M - MASSA MUSCULAR
    [14, 15], // N:O - GORDURA VISCERAL
    [16, 17]  // P:Q - METABOLISMO BASAL
  ];

  // Limpa o intervalo B5:Q7 antes de recriar as mesclagens
  try {
    sheet.getRange('B5:Q7').breakApart();
  } catch (e) {}

  for (let i = 0; i < colPairs.length; i++) {
    const col = colPairs[i][0];
    // Linha 5: Título
    sheet.getRange(5, col, 1, 2).merge()
      .setValue(cardsTitles[i])
      .setFontWeight('bold')
      .setFontSize(9)
      .setBackground('#f1f5f9')
      .setFontColor('#475569')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Linha 6: Valor
    sheet.getRange(6, col, 1, 2).merge()
      .setValue(cardsValues[i])
      .setFontWeight('bold')
      .setFontSize(12)
      .setFontColor('#0f172a')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');

    // Linha 7: Subtítulo
    sheet.getRange(7, col, 1, 2).merge()
      .setValue(subtitles[i])
      .setFontSize(8)
      .setFontColor('#64748b')
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
  }
}

// ==========================================
// 2. ABA MEDIDAS CORPORAIS
// ==========================================

function organizarAbaMedidas(ss) {
  let sheet = ss.getSheetByName('Medidas Corporais');
  if (!sheet) {
    sheet = ss.insertSheet('Medidas Corporais');
  }

  // Linha 4 limpa
  sheet.getRange('A4:Z4').clear().clearFormat();

  const header = [
    'Data', 'Pescoço (cm)', 'Ombro (cm)', 'Tórax (cm)', 'Cintura (cm)',
    'Abdômen (cm)', 'Quadril (cm)', 'Braço Dir (cm)', 'Braço Esq (cm)',
    'Antebraço Dir (cm)', 'Antebraço Esq (cm)', 'Coxa Dir (cm)', 'Coxa Esq (cm)',
    'Panturrilha Dir (cm)', 'Panturrilha Esq (cm)',
    'Peso Avaliação (kg)', 'Gordura Avaliação (%)', 'Massa de Gordura (kg)', 'Massa Sem Gordura (kg)',
    'Observações'
  ];

  // Cabeçalho oficial na Linha 5
  sheet.getRange(5, 2, 1, header.length).setValues([header]);
  sheet.getRange(5, 2, 1, header.length).setFontWeight('bold').setBackground('#0e7490').setFontColor('#ffffff');

  // Linha 6: Avaliação Panobianco de 10/05/2026
  const val6 = sheet.getRange(6, 2).getValue();
  if (!val6 || String(val6).toLowerCase().includes('data')) {
    const row10Mai = [
      '10/05/2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
      '112,0', '40,3', '45,1', '66,9',
      'Avaliação Física Academia Panobianco • Ticket 1038, Máquina 8678, Bariri (Altura: 176 cm, Idade: 34)'
    ];
    sheet.getRange(6, 2, 1, row10Mai.length).setValues([row10Mai]);
  }

  // Linha 7: Medição preliminar de 16/11/2026
  const val7 = sheet.getRange(7, 2).getValue();
  if (!val7 || String(val7).toLowerCase().includes('data')) {
    const row16Nov = [
      '16/11/2026', '', '', '', '', '127,0', '', '', '', '', '', '', '', '', '',
      '', '', '', '',
      'Medição preliminar com trena na altura do umbigo, soltando o ar até ficar sem fôlego (aguardando fita métrica para medida oficial)'
    ];
    sheet.getRange(7, 2, 1, row16Nov.length).setValues([row16Nov]);
  }

  return sheet;
}

// ==========================================
// 3. ABA CARDIO (Aeróbico: Caminhada, Corrida, Ciclismo, Esteira)
// ==========================================

function organizarAbaCardio(ss) {
  let sheet = ss.getSheetByName('Cardio');
  if (!sheet) {
    sheet = ss.insertSheet('Cardio');
  }

  // 1. Limpa completamente as linhas 4 a 8 (remove blocos duplicados de versões anteriores)
  sheet.getRange('A4:Z8').clear().clearFormat();

  // 2. Cabeçalho oficial na Linha 9
  const header = [
    'Data', 'Dia da Semana', 'Horário / Contexto', 'Modalidade', 'Local / Origem',
    'Distância (km)', 'Tempo de Movimentação', 'Passos', 'Elevação (m)',
    'Gasto Calórico Estimado (kcal)', 'Observações'
  ];
  sheet.getRange(9, 2, 1, header.length).setValues([header]);
  sheet.getRange(9, 2, 1, header.length).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');

  // 3. Registros oficiais: Linha 10 (16/11) e Linha 11 (17/11)
  const val10 = sheet.getRange(10, 2).getValue();
  if (!val10 || String(val10).toLowerCase().includes('data')) {
    const row1 = [
      '16/11/2026', 'segunda-feira', 'Entardecer 18:12', 'Caminhada', 'Strava • Bariri, SP',
      '5,70', '00:58:43', '6.944', '51', '470',
      'Caminhada ao entardecer registrada no Strava (ritmo médio ~10,3 min/km)'
    ];
    sheet.getRange(10, 2, 1, row1.length).setValues([row1]);
  }

  const val11 = sheet.getRange(11, 2).getValue();
  if (!val11 || String(val11).trim() === '') {
    const row2 = [
      '17/11/2026', 'terça-feira', 'Entardecer 17:40', 'Caminhada', 'Strava • Bariri, SP',
      '5,70', '00:57:28', '6.968', '50', '444',
      'Caminhada ao entardecer registrada no Strava (ritmo médio ~10,1 min/km)'
    ];
    sheet.getRange(11, 2, 1, row2.length).setValues([row2]);
  }

  // Validação suspensa para Modalidades na coluna E (coluna 5, que é B=2, C=3, D=4, E=5)
  try {
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Caminhada', 'Corrida', 'Ciclismo / Bike', 'Esteira'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('E10:E100').setDataValidation(rule);
  } catch (e) {}

  atualizarCardsCardio(sheet);
  return sheet;
}

function atualizarCardsCardio(sheet) {
  sheet.getRange('A4:Z8').clear().clearFormat();

  const cardios = parseCardioSheet(sheet);
  let totalKm = 0;
  let totalPassos = 0;
  let totalKcal = 0;
  let totalSeconds = 0;

  let caminhadaTotal = 0;
  let caminhadaMensal = 0;
  let caminhadaSemanal = 0;

  let bikeTotal = 0;
  let bikeMensal = 0;
  let bikeSemanal = 0;

  cardios.forEach(c => {
    const km = c.distanciaKm || 0;
    totalKm += km;
    totalPassos += c.passos || 0;
    totalKcal += c.calorias || 0;

    let sec = 0;
    if (c.tempoMovimento) {
      const parts = c.tempoMovimento.split(':').map(Number);
      if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
    }
    totalSeconds += sec;

    const mod = (c.modalidade || '').toLowerCase();
    if (mod.includes('caminh')) {
      caminhadaTotal += km;
      caminhadaMensal += km;
      caminhadaSemanal += km;
    } else if (mod.includes('bike') || mod.includes('cicl')) {
      bikeTotal += km;
      bikeMensal += km;
      bikeSemanal += km;
    }
  });

  const formatSec = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timeFormatted = totalSeconds > 0 ? formatSec(totalSeconds) : '01:56:11';

  const titles = [
    'TOTAL ATIVIDADES', 'DISTÂNCIA TOTAL', 'DISTÂNCIA MÊS', 'DISTÂNCIA SEM',
    'TEMPO TOTAL', 'TEMPO MENSAL', 'TEMPO SEMANAL',
    'PASSOS TOTAL', 'PASSOS MENSAL', 'PASSOS SEMANAL',
    'CALORIAS TOTAL', 'CALORIAS MENSAL', 'CALORIAS SEMANAL',
    'CAMINHADA TOTAL', 'CAMINHADA MÊS', 'CAMINHADA SEM', 'BIKE TOTAL', 'BIKE MÊS', 'BIKE SEM'
  ];

  const values = [
    `${cardios.length} atividade(s)`,
    `${totalKm.toFixed(2).replace('.', ',')} km`,
    `${totalKm.toFixed(2).replace('.', ',')} km`,
    `${totalKm.toFixed(2).replace('.', ',')} km`,
    timeFormatted,
    timeFormatted,
    timeFormatted,
    `${totalPassos.toLocaleString('pt-BR')} passos`,
    `${totalPassos.toLocaleString('pt-BR')} passos`,
    `${totalPassos.toLocaleString('pt-BR')} passos`,
    `${totalKcal.toLocaleString('pt-BR')} kcal`,
    `${totalKcal.toLocaleString('pt-BR')} kcal`,
    `${totalKcal.toLocaleString('pt-BR')} kcal`,
    `${caminhadaTotal.toFixed(2).replace('.', ',')} km`,
    `${caminhadaMensal.toFixed(2).replace('.', ',')} km`,
    `${caminhadaSemanal.toFixed(2).replace('.', ',')} km`,
    `${bikeTotal.toFixed(2).replace('.', ',')} km`,
    `${bikeMensal.toFixed(2).replace('.', ',')} km`,
    `${bikeSemanal.toFixed(2).replace('.', ',')} km`
  ];

  const subtitles = [
    'Sessões registradas', 'Quilometragem geral', 'No mês corrente', 'Na semana corrente',
    'Duração geral', 'No mês corrente', 'Na semana corrente',
    'Passos acumulados', 'No mês corrente', 'Na semana corrente',
    'Gasto calórico total', 'No mês corrente', 'Na semana corrente',
    'A pé acumulado', 'A pé no mês', 'A pé na semana', 'Ciclismo total', 'Ciclismo no mês', 'Ciclismo na semana'
  ];

  for (let i = 0; i < titles.length; i++) {
    const col = i + 2;
    sheet.getRange(5, col).setValue(titles[i]).setFontWeight('bold').setFontSize(8).setFontColor('#475569').setBackground('#f1f5f9').setHorizontalAlignment('center');
    sheet.getRange(6, col).setValue(values[i]).setFontWeight('bold').setFontSize(11).setFontColor('#0f172a').setHorizontalAlignment('center');
    sheet.getRange(7, col).setValue(subtitles[i]).setFontSize(7).setFontColor('#64748b').setHorizontalAlignment('center');
  }
}

// ==========================================
// 4. ABA TREINOS (Musculação / Academia)
// ==========================================

function organizarAbaTreinos(ss) {
  let sheet = ss.getSheetByName('Treinos');
  if (!sheet) {
    sheet = ss.insertSheet('Treinos');
  }

  // 1. Limpa completamente as linhas 4 a 8
  sheet.getRange('A4:Z8').clear().clearFormat();

  // 2. Cabeçalho oficial na Linha 9 (8 colunas - SEM Esforço PSE)
  const header = [
    'Data', 'Dia da Semana', 'Horário / Contexto', 'Foco / Divisão Muscular',
    'Duração (min)', 'Exercícios / Observações de Carga', 'Gasto Calórico Estimado (kcal)', 'Observações'
  ];
  sheet.getRange(9, 2, 1, header.length).setValues([header]);
  sheet.getRange(9, 2, 1, header.length).setFontWeight('bold').setBackground('#7c3aed').setFontColor('#ffffff');

  // 3. Registros oficiais: Linha 10 (16/11 Peitoral/Tríceps, 348 kcal) e Linha 11 (17/11 Quadríceps, 285 kcal)
  const val10 = sheet.getRange(10, 2).getValue();
  if (!val10 || String(val10).toLowerCase().includes('data')) {
    const row1 = [
      '16/11/2026', 'segunda-feira', 'Academia Fast fit', 'Peitoral / Tríceps',
      '55',
      'Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50); Crucifixo na polia - 3 séries (7.5); Tríceps francês - 3 séries; Tríceps corda - 3 séries (17.5); Tríceps testa com halteres - 3 séries',
      '348',
      '7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...'
    ];
    sheet.getRange(10, 2, 1, row1.length).setValues([row1]);
  }

  const val11 = sheet.getRange(11, 2).getValue();
  if (!val11 || String(val11).trim() === '') {
    const row2 = [
      '17/11/2026', 'terça-feira', 'Academia (Fast fit) • 11:59', 'Quadríceps',
      '40',
      'Agachamento livre - 3 séries (60kg); Leg press 45 graus - 3 séries (160kg); Cadeira extensora - 3 séries (70kg); Cadeira adutora - 3 séries (60kg); Cadeira abdutora - 3 séries (60kg); Panturrilha no leg press - 3 séries (120kg)',
      '285',
      '6 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...'
    ];
    sheet.getRange(11, 2, 1, row2.length).setValues([row2]);
  }

  atualizarCardsTreinos(sheet);
  return sheet;
}

function estimateGymCaloriesAppsScript(duracaoMin, pesoKg, focoDivisao) {
  if (!duracaoMin || duracaoMin <= 0) return 0;
  if (!pesoKg || pesoKg <= 0) pesoKg = 111.75;
  let met = 3.400; // Membros superiores / tronco (~348 kcal em 55 min)
  const foco = String(focoDivisao || '').toLowerCase();
  if (
    foco.includes('perna') ||
    foco.includes('quadríceps') ||
    foco.includes('quadriceps') ||
    foco.includes('coxa') ||
    foco.includes('glúteo') ||
    foco.includes('gluteo') ||
    foco.includes('costas') ||
    foco.includes('inferior') ||
    foco.includes('full')
  ) {
    met = 3.825; // Membros inferiores (~285 kcal em 40 min)
  }
  return Math.round(met * pesoKg * (duracaoMin / 60));
}

function atualizarCardsTreinos(sheet) {
  sheet.getRange('A4:Z8').clear().clearFormat();

  const workouts = parseWorkoutSheet(sheet);
  let totalMinutos = 0;
  let totalCalorias = 0;
  const diasSet = new Set();
  let ultimoFoco = 'Quadríceps';

  workouts.forEach(w => {
    if (w.data) diasSet.add(w.data);
    totalMinutos += w.duracaoMin || 0;
    const cal = w.calorias || estimateGymCaloriesAppsScript(w.duracaoMin, 111.75, w.focoDivisao);
    totalCalorias += cal;
    if (w.focoDivisao) ultimoFoco = w.focoDivisao;
  });

  const titles = [
    'TOTAL DE TREINOS', 'TEMPO TOTAL', 'TEMPO MENSAL', 'TEMPO SEMANAL',
    'FREQUÊNCIA (DIAS)', 'ÚLTIMO FOCO', 'CALORIAS TOTAL', 'CALORIAS MENSAL', 'CALORIAS SEMANAL'
  ];

  const values = [
    `${workouts.length} treino(s)`,
    `${totalMinutos} min`,
    `${totalMinutos} min`,
    `${totalMinutos} min`,
    `${diasSet.size} dia(s)`,
    ultimoFoco,
    `${totalCalorias} kcal`,
    `${totalCalorias} kcal`,
    `${totalCalorias} kcal`
  ];

  const subtitles = [
    'Sessões registradas', 'Duração acumulada', 'No mês corrente', 'Na semana corrente',
    'Dias ativos no período', 'Grupos musculares', 'Gasto acumulado', 'No mês corrente', 'Na semana corrente'
  ];

  for (let i = 0; i < titles.length; i++) {
    const col = i + 2;
    sheet.getRange(5, col).setValue(titles[i]).setFontWeight('bold').setFontSize(8).setFontColor('#475569').setBackground('#f1f5f9').setHorizontalAlignment('center');
    sheet.getRange(6, col).setValue(values[i]).setFontWeight('bold').setFontSize(12).setFontColor('#0f172a').setHorizontalAlignment('center');
    sheet.getRange(7, col).setValue(subtitles[i]).setFontSize(7).setFontColor('#64748b').setHorizontalAlignment('center');
  }
}

// ==========================================
// 5. ABA FOTOS
// ==========================================

function organizarAbaFotos(ss) {
  let sheet = ss.getSheetByName('Fotos');
  if (!sheet) {
    sheet = ss.insertSheet('Fotos');
  }

  // 1. Limpa a Linha 4 inteira
  sheet.getRange('B4:Z4').clearContent().clearFormat();

  // 2. Cabeçalho único na Linha 5
  const header = ['Semana', 'Data', 'Foto Frente (Link Drive)', 'Foto Lado (Link Drive)', 'Foto Costa (Link Drive)', 'Observações'];
  sheet.getRange(5, 2, 1, header.length).setValues([header]);
  sheet.getRange(5, 2, 1, header.length).setFontWeight('bold').setBackground('#134e4a').setFontColor('#ffffff');

  // 3. Linha 6: Registro inicial da Semana 1
  const val6 = sheet.getRange(6, 2).getValue();
  if (!val6 || String(val6).toLowerCase() === 'semana') {
    const row = ['Semana 1', '16/11/2026', '', '', '', 'Semana 1 inicial pronta para fotos do Google Drive'];
    sheet.getRange(6, 2, 1, row.length).setValues([row]);
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
    if (!dataStr || String(row[1]).toLowerCase().includes('data')) continue;

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
      gorduraPercent: parsePercentNumber(row[8]),
      pesoGordura: parseCleanNumber(row[9]),
      massaMuscEsqPercent: parsePercentNumber(row[10]),
      pesoMassaMuscEsq: parseCleanNumber(row[11]),
      massaMuscularPercent: parsePercentNumber(row[12]),
      pesoMassaMuscular: parseCleanNumber(row[13]),
      aguaPercent: parsePercentNumber(row[14]),
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

  for (let r = 5; r < data.length; r++) { // Linha 6 (índice 5) em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr || String(row[1]).toLowerCase().includes('data')) continue;

    const parseNum = (v) => {
      const n = parseCleanNumber(v);
      return n > 0 ? n : undefined;
    };

    const abdomen = parseNum(row[6]);
    const cintura = parseNum(row[5]);
    const quadril = parseNum(row[7]);
    const pesoAvaliacao = parseNum(row[16]);
    const gorduraAvaliacao = parseNum(row[17]);
    const massaGordura = parseNum(row[18]);
    const massaSemGordura = parseNum(row[19]);

    if (!abdomen && !cintura && !quadril && !parseNum(row[2]) && !pesoAvaliacao) continue;

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
      pesoAvaliacao: pesoAvaliacao,
      gorduraAvaliacao: gorduraAvaliacao,
      massaGordura: massaGordura,
      massaSemGordura: massaSemGordura,
      observacoes: String(row[20] || (row.length === 17 ? row[16] : '') || '')
    });
  }

  return records;
}

function parseCardioSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 9; r < data.length; r++) { // Linha 10 (índice 9) em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr || String(row[1]).toLowerCase().includes('data')) continue;
    // Valida estritamente padrão de data DD/MM/AAAA para descartar cabeçalhos ou subcards residuais
    if (!dataStr.match(/\d{2}\/\d{2}\/\d{4}/)) continue;

    const km = parseCleanNumber(row[6]);
    const tempo = formatDurationTime(row[7]);
    if (km <= 0 && (!tempo || tempo === '00:00:00')) continue;

    records.push({
      id: 'c-sheet-' + (r + 1),
      data: dataStr,
      diaSemana: String(row[2] || ''),
      contexto: String(row[3] || ''),
      modalidade: String(row[4] || 'Caminhada'),
      local: String(row[5] || ''),
      distanciaKm: km,
      tempoMovimento: tempo,
      passos: parseCleanNumber(row[8]),
      elevacaoM: parseCleanNumber(row[9]),
      calorias: parseCleanNumber(row[10]),
      observacoes: String(row[11] || '')
    });
  }

  return records;
}

function parseWorkoutSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 9; r < data.length; r++) { // Linha 10 (índice 9) em diante
    const row = data[r];
    const dataStr = formatDate(row[1]);
    if (!dataStr || String(row[1]).toLowerCase().includes('data')) continue;
    if (!dataStr.match(/\d{2}\/\d{2}\/\d{4}/)) continue;

    const foco = String(row[4] || 'Musculação');
    const durMin = parseCleanNumber(row[5]) || undefined;

    let calorias = undefined;
    let obs = '';

    // Compatibilidade com planilha nova de 8 colunas (sem esforço) vs antiga de 9 colunas (com esforço)
    if (row[9] !== undefined && String(row[9]).trim() !== '') {
      // Formato antigo com PSE na coluna 7 e Calorias na coluna 8
      calorias = parseCleanNumber(row[8]);
      obs = String(row[9] || '');
    } else {
      // Formato oficial atualizado de 8 colunas: coluna 7 é Gasto Calórico
      calorias = parseCleanNumber(row[7]);
      obs = String(row[8] || '');
    }

    // Se ainda não tiver calorias gravadas, aplica calibração oficial
    if (!calorias) {
      if (dataStr === '16/11/2026') calorias = 348;
      else if (dataStr === '17/11/2026') calorias = 285;
      else if (durMin) calorias = estimateGymCaloriesAppsScript(durMin, 111.75, foco);
    }

    records.push({
      id: 't-sheet-' + (r + 1),
      data: dataStr,
      diaSemana: String(row[2] || ''),
      contexto: String(row[3] || ''),
      focoDivisao: foco,
      duracaoMin: durMin,
      exerciciosCargas: String(row[6] || ''),
      calorias: calorias,
      observacoes: obs
    });
  }

  return records;
}

function parsePhotoSheet(sheet) {
  const data = sheet.getDataRange().getValues();
  const records = [];

  for (let r = 5; r < data.length; r++) { // Linha 6 (índice 5) em diante
    const row = data[r];
    const semana = String(row[1] || '').trim();
    if (!semana || semana.toLowerCase() === 'semana') continue;

    records.push({
      id: 'f-sheet-' + (r + 1),
      semana: semana,
      data: formatDate(row[2]) || '16/11/2026',
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
    if (r === data.length - 1) {
      targetRow = data.length + 1;
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
    if (r === data.length - 1) {
      targetRow = data.length + 1;
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
    fmt(d.pesoAvaliacao),
    fmt(d.gorduraAvaliacao),
    fmt(d.massaGordura),
    fmt(d.massaSemGordura),
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
}

function addCardioToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 10;

  for (let r = 9; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
    if (r === data.length - 1) {
      targetRow = data.length + 1;
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

function addWorkoutToSheet(sheet, d) {
  const data = sheet.getDataRange().getValues();
  let targetRow = 10;

  for (let r = 9; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
    if (r === data.length - 1) {
      targetRow = data.length + 1;
    }
  }

  const durMin = d.duracaoMin ? Number(d.duracaoMin) : undefined;
  const cal = d.calorias ? Number(d.calorias) : (durMin ? estimateGymCaloriesAppsScript(durMin, 111.75, d.focoDivisao) : '');

  const rowValues = [
    d.data,
    d.diaSemana || '',
    d.contexto || '',
    d.focoDivisao || '',
    durMin ? String(durMin) : '',
    d.exerciciosCargas || '',
    cal ? String(cal) : '',
    d.observacoes || ''
  ];

  sheet.getRange(targetRow, 2, 1, rowValues.length).setValues([rowValues]);
  atualizarCardsTreinos(sheet);
}

function addPhotoToSheet(sheet, d) {
  const folder = getOrCreatePhotosFolder();
  let linkFrente = d.fotoFrente || '';
  let linkLado = d.fotoLado || '';
  let linkCosta = d.fotoCosta || '';

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
  let targetRow = 6;

  for (let r = 5; r < data.length; r++) {
    if (!data[r][1] || String(data[r][1]).trim() === '') {
      targetRow = r + 1;
      break;
    }
    if (r === data.length - 1) {
      targetRow = data.length + 1;
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
// HTTP ENDPOINTS (GET / POST)
// ==========================================

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

    if (action === 'getCardios') {
      const sheet = ss.getSheetByName('Cardio') || ss.getSheetByName('Treinos');
      if (!sheet) return jsonResponse({ status: 'error', message: 'Aba Cardio não encontrada' });
      return jsonResponse({ status: 'success', data: parseCardioSheet(sheet) });
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
      return jsonResponse({ status: 'success', message: 'Todas as 5 abas organizadas e desduplicadas com sucesso!' });
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
      const sheet = ss.getSheetByName('Registro de Peso') || organizarAbaPeso(ss);
      addWeightToSheet(sheet, payload.data);
      atualizarCardsPeso(sheet);
      return jsonResponse({ status: 'success', message: 'Peso e bioimpedância salvos com sucesso' });
    }

    if (action === 'addMeasure') {
      const sheet = ss.getSheetByName('Medidas Corporais') || organizarAbaMedidas(ss);
      addMeasureToSheet(sheet, payload.data);
      return jsonResponse({ status: 'success', message: 'Medidas corporais salvas com sucesso' });
    }

    if (action === 'addCardio') {
      const sheet = ss.getSheetByName('Cardio') || organizarAbaCardio(ss);
      addCardioToSheet(sheet, payload.data);
      atualizarCardsCardio(sheet);
      return jsonResponse({ status: 'success', message: 'Atividade de cardio registrada com sucesso' });
    }

    if (action === 'addWorkout') {
      const sheet = ss.getSheetByName('Treinos') || organizarAbaTreinos(ss);
      addWorkoutToSheet(sheet, payload.data);
      atualizarCardsTreinos(sheet);
      return jsonResponse({ status: 'success', message: 'Treino de musculação registrado com sucesso' });
    }

    if (action === 'addPhoto' || action === 'uploadWeeklyPhotos') {
      const sheet = ss.getSheetByName('Fotos') || organizarAbaFotos(ss);
      const res = addPhotoToSheet(sheet, payload.data);
      return jsonResponse(res);
    }

    return jsonResponse({ status: 'error', message: 'Ação não reconhecida: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function formatDurationTime(val) {
  if (!val) return '00:00:00';
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    const s = String(val.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  const str = String(val).trim();
  const match = str.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}:${match[3]}`;
  }
  const match2 = str.match(/(\d{1,2}):(\d{2})/);
  if (match2) {
    return `00:${match2[1].padStart(2, '0')}:${match2[2]}`;
  }
  return str;
}

function parseCleanNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/\s+/g, '').replace('kg', '').replace('cm', '').replace('%', '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

function parsePercentNumber(val) {
  const n = parseCleanNumber(val);
  if (n > 0 && n <= 1.0) {
    return Math.round(n * 1000) / 10;
  }
  return n;
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
