export function getTodayBR(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getDayOfWeekBR(dateStr?: string): string {
  let date: Date;
  if (dateStr && dateStr.includes('/')) {
    const [d, m, y] = dateStr.split('/').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date();
  }
  const days = [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado'
  ];
  return days[date.getDay()];
}

export function parseBRNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const clean = value.toString().replace(/\s+/g, '').replace('kg', '').replace('cm', '').replace('%', '').replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatBRNumber(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '-';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWeightVariation(value: number | undefined | null): { text: string; color: string } {
  if (value === undefined || value === null || isNaN(value)) {
    return { text: '-', color: 'text-slate-400' };
  }
  if (value === 0) {
    return { text: '0,000 kg', color: 'text-slate-400' };
  }
  const formatted = formatBRNumber(Math.abs(value), 3);
  if (value > 0) {
    return { text: `+${formatted} kg`, color: 'text-rose-400' };
  }
  return { text: `-${formatted} kg`, color: 'text-emerald-400' };
}

export function calculateIMC(pesoKg: number, alturaMetros: number): { imc: number; classificacao: string; cor: string } {
  if (!pesoKg || !alturaMetros || alturaMetros <= 0) {
    return { imc: 0, classificacao: 'Indeterminado', cor: 'text-slate-400' };
  }
  const imc = pesoKg / (alturaMetros * alturaMetros);
  let classificacao = '';
  let cor = 'text-slate-400';

  if (imc < 18.5) {
    classificacao = 'Abaixo do peso';
    cor = 'text-amber-400';
  } else if (imc < 24.9) {
    classificacao = 'Peso normal';
    cor = 'text-emerald-400';
  } else if (imc < 29.9) {
    classificacao = 'Sobrepeso';
    cor = 'text-amber-400';
  } else if (imc < 34.9) {
    classificacao = 'Obesidade Grau I';
    cor = 'text-orange-400';
  } else if (imc < 39.9) {
    classificacao = 'Obesidade Grau II';
    cor = 'text-rose-400';
  } else {
    classificacao = 'Obesidade Grau III';
    cor = 'text-red-500';
  }

  return {
    imc: Number(imc.toFixed(2)),
    classificacao,
    cor
  };
}

// Limpa strings de duração que possam vir como Date (ex: "Sat Dec 30 1899 00:58:43 GMT...")
export function cleanDurationString(val: any): string {
  if (!val) return '00:00:00';
  const str = String(val).trim();
  const match = str.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    const s = match[3];
    return `${h}:${m}:${s}`;
  }
  const matchMinSec = str.match(/(\d{1,2}):(\d{2})/);
  if (matchMinSec) {
    return `00:${matchMinSec[1].padStart(2, '0')}:${matchMinSec[2]}`;
  }
  return str;
}

// Convert "00:58:43" or "58:43" or "1h 10m" to decimal hours
export function parseDurationToHours(durationStr: string): number {
  if (!durationStr) return 0;
  const cleaned = cleanDurationString(durationStr);
  const parts = cleaned.split(':').map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return (h || 0) + (m || 0) / 60 + (s || 0) / 3600;
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    return (m || 0) / 60 + (s || 0) / 3600;
  }
  const num = parseFloat(cleaned.replace(',', '.'));
  return isNaN(num) ? 0 : num / 60; // assume minutes if raw number
}

// Estimate calories burned using MET formula, weight, duration and elevation
export function estimateWorkoutCalories(
  modalidade: string,
  pesoKg: number,
  tempoMovimentoStr: string,
  distanciaKm = 0,
  elevacaoM = 0
): number {
  if (!pesoKg || pesoKg <= 0) pesoKg = 111.75;
  const hours = parseDurationToHours(tempoMovimentoStr);
  if (hours <= 0) return 0;

  let met = 3.8; // Caminhada moderada padrão
  const mod = modalidade.toLowerCase();

  if (mod.includes('caminh')) {
    const kmh = hours > 0 && distanciaKm > 0 ? distanciaKm / hours : 4.5;
    if (kmh > 5.5) met = 4.3;
    else if (kmh > 4.5) met = 3.8;
    else met = 3.3;
  } else if (mod.includes('corr')) {
    const kmh = hours > 0 && distanciaKm > 0 ? distanciaKm / hours : 9.0;
    if (kmh > 12) met = 11.5;
    else if (kmh > 9.5) met = 9.8;
    else met = 8.3;
  } else if (mod.includes('muscul') || mod.includes('academia') || mod.includes('força')) {
    met = 5.0;
  } else if (mod.includes('pedal') || mod.includes('cicl')) {
    met = 6.8;
  } else {
    met = 4.5;
  }

  // Base calories: MET * peso (kg) * horas
  let kcal = met * pesoKg * hours;

  // Elevação adiciona trabalho mecânico extra (~0.9 kcal por metro por 100kg)
  if (elevacaoM > 0) {
    kcal += (elevacaoM * pesoKg * 0.009);
  }

  return Math.round(kcal);
}

// Normaliza percentuais vindos de planilhas onde 35,2% pode ser retornado como decimal 0.352
export function normalizePercent(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1.0) {
    return Math.round(num * 1000) / 10;
  }
  return num;
}

// Estima o gasto calórico para Musculação / Academia considerando duração, peso corporal e divisão muscular
export function estimateGymCalories(
  duracaoMin: number,
  pesoKg: number,
  _esforcoPse = 8,
  focoDivisao = ''
): number {
  if (!duracaoMin || duracaoMin <= 0) return 0;
  if (!pesoKg || pesoKg <= 0) pesoKg = 111.75;

  // Base MET para musculação calibrada (Compêndio de Ainsworth):
  // Membros superiores / tronco: MET ~3.400 (55 min a 111,75 kg = 348 kcal)
  // Membros inferiores / quadríceps / pernas: MET ~3.825 (40 min a 111,75 kg = 285 kcal)
  let met = 3.400;
  const foco = (focoDivisao || '').toLowerCase();
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
    met = 3.825;
  }

  const hours = duracaoMin / 60;
  const kcal = met * pesoKg * hours;

  return Math.round(kcal);
}
