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
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return days[date.getDay()];
}

export function parseBRNumber(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  // Replace comma with dot and clean up
  const clean = value.toString().replace(/\s+/g, '').replace(',', '.');
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
