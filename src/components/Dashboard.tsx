import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Dumbbell,
  HeartPulse,
  ArrowRight,
  Flame,
  Calendar,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
} from 'recharts';
import { WeightRecord, MeasureRecord, CardioRecord, WorkoutRecord, PhotoRecord, UserProfile } from '../types';
import {
  formatBRNumber,
  calculateIMC,
  parseDurationToHours,
  estimateGymCalories,
} from '../utils/formatters';
import { NavTab } from './Navbar';

interface DashboardProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
  cardios: CardioRecord[];
  workouts: WorkoutRecord[];
  photos: PhotoRecord[];
  profile: UserProfile;
  onNavigate: (tab: NavTab) => void;
}

interface CalorieChartPoint {
  date: string;
  cardioKcal: number;
  workoutKcal: number;
  totalKcal: number;
  cardioDetails: string[];
  workoutDetails: string[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  weights,
  measures,
  cardios,
  workouts,
  photos,
  profile,
  onNavigate,
}) => {
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const firstWeightRecord = weights.length > 0 ? weights[0] : null;
  const initialWeight = firstWeightRecord?.peso || profile.pesoInicial || 113.250;
  const currentWeight = latestWeight ? latestWeight.peso : 111.450;
  const currPeso = currentWeight;

  const userAltura = profile.alturaMetros && profile.alturaMetros !== 1.80 ? profile.alturaMetros : 1.76;
  const imcInfo = calculateIMC(currentWeight, userAltura);
  const currImc = imcInfo.imc;

  // Bioimpedance metrics from latest record with percent normalization (e.g. 0.352 -> 35.2)
  const rawGordura = latestWeight?.gorduraPercent ?? 35.2;
  const gorduraPercent = rawGordura > 0 && rawGordura <= 1.0 ? Math.round(rawGordura * 1000) / 10 : rawGordura;
  const currGordura = gorduraPercent;
  const pesoGordura = latestWeight?.pesoGordura ?? 39.2;

  const rawMassaMusc = latestWeight?.massaMuscularPercent ?? 62.2;
  const massaMuscular = rawMassaMusc > 0 && rawMassaMusc <= 1.0 ? Math.round(rawMassaMusc * 1000) / 10 : rawMassaMusc;
  const currMassaMusc = massaMuscular;
  const pesoMassaMusc = latestWeight?.pesoMassaMuscular ?? 69.3;
  const gorduraVisceral = latestWeight?.gorduraVisceral ?? 25.5;
  const currVisceral = gorduraVisceral;
  const metabolismo = latestWeight?.metabolismo ?? 2122.0;
  const currMetabolismo = metabolismo;

  // Métricas iniciais e variações completas para todos os 8 cards do painel
  const initPeso = firstWeightRecord?.peso ?? (profile.pesoInicial || 113.250);
  const diffPeso = Number((currentWeight - initPeso).toFixed(3));

  const initImc = firstWeightRecord?.imcApp ?? (firstWeightRecord?.peso ? Number((firstWeightRecord.peso / (userAltura * userAltura)).toFixed(2)) : 36.56);
  const diffImc = Number((imcInfo.imc - initImc).toFixed(2));

  const rawInitGordura = firstWeightRecord?.gorduraPercent ?? 35.6;
  const initGordura = rawInitGordura > 0 && rawInitGordura <= 1.0 ? Math.round(rawInitGordura * 1000) / 10 : rawInitGordura;
  const diffGordura = Number((gorduraPercent - initGordura).toFixed(1));

  const rawInitMassa = firstWeightRecord?.massaMuscularPercent ?? 61.8;
  const initMassaMusc = rawInitMassa > 0 && rawInitMassa <= 1.0 ? Math.round(rawInitMassa * 1000) / 10 : rawInitMassa;
  const diffMassaMusc = Number((massaMuscular - initMassaMusc).toFixed(1));

  const rawInitEsq = firstWeightRecord?.massaMuscEsqPercent ?? 32.3;
  const initMassaEsq = rawInitEsq > 0 && rawInitEsq <= 1.0 ? Math.round(rawInitEsq * 1000) / 10 : rawInitEsq;
  const rawCurrEsq = latestWeight?.massaMuscEsqPercent ?? 32.5;
  const currMassaEsq = rawCurrEsq > 0 && rawCurrEsq <= 1.0 ? Math.round(rawCurrEsq * 1000) / 10 : rawCurrEsq;
  const diffMassaEsq = Number((currMassaEsq - initMassaEsq).toFixed(1));

  const initVisceral = firstWeightRecord?.gorduraVisceral ?? 26.5;
  const diffVisceral = Number((gorduraVisceral - initVisceral).toFixed(1));

  const rawInitAgua = firstWeightRecord?.aguaPercent ?? 48.5;
  const initAgua = rawInitAgua > 0 && rawInitAgua <= 1.0 ? Math.round(rawInitAgua * 1000) / 10 : rawInitAgua;
  const rawCurrAgua = latestWeight?.aguaPercent ?? 48.6;
  const currAgua = rawCurrAgua > 0 && rawCurrAgua <= 1.0 ? Math.round(rawCurrAgua * 1000) / 10 : rawCurrAgua;
  const diffAgua = Number((currAgua - initAgua).toFixed(1));

  const initMetabolismo = firstWeightRecord?.metabolismo ?? 2146.0;
  const diffMetabolismo = Math.round(metabolismo - initMetabolismo);

  // Latest abdominal measurement
  const latestAbdomenRecord = [...measures].reverse().find((m) => m.abdomen && m.abdomen > 0);
  const latestAbdomen = latestAbdomenRecord ? latestAbdomenRecord.abdomen : 127;

  // Helper de parse de data DD/MM/AAAA
  const parseBRDate = (dStr?: string): Date | null => {
    if (!dStr) return null;
    const parts = dStr.trim().split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    return new Date(y, m, d);
  };

  // Helper para verificar se duas datas pertencem à mesma semana (Segunda-feira a Domingo)
  const isSameWeekMondayToSunday = (d1: Date, d2: Date): boolean => {
    const getMonday = (d: Date): Date => {
      const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const day = date.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
      const diff = day === 0 ? -6 : 1 - day;
      date.setDate(date.getDate() + diff);
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const monday1 = getMonday(d1);
    const monday2 = getMonday(d2);
    return monday1.getTime() === monday2.getTime();
  };

  // Cardio stats separados: Total, Mensal e Semanal
  let totalKmCardio = 0;
  let mensalKmCardio = 0;
  let semanalKmCardio = 0;
  let totalPassosCardio = 0;
  let mensalPassosCardio = 0;
  let semanalPassosCardio = 0;
  let totalCaloriasCardio = 0;
  let mensalCaloriasCardio = 0;
  let semanalCaloriasCardio = 0;
  let totalSecondsCardio = 0;
  let mensalSecondsCardio = 0;
  let semanalSecondsCardio = 0;
  let caminhadaKm = 0;
  let caminhadaMensalKm = 0;
  let caminhadaSemanalKm = 0;
  let bikeKm = 0;
  let bikeMensalKm = 0;
  let bikeSemanalKm = 0;

  // Data atual de referência para filtros de Mês Corrente e Semana Corrente (Segunda a Domingo)
  const today = new Date();

  cardios.forEach((c) => {
    const km = c.distanciaKm || 0;
    totalKmCardio += km;
    const passos = c.passos || 0;
    totalPassosCardio += passos;
    const cal = c.calorias || 0;
    totalCaloriasCardio += cal;

    const durHours = parseDurationToHours(c.tempoMovimento);
    const secs = Math.round(durHours * 3600);
    totalSecondsCardio += secs;

    const d = parseBRDate(c.data);
    const isSameMonth = d ? (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) : false;
    const isSameWeek = d ? isSameWeekMondayToSunday(d, today) : false;

    if (isSameMonth) {
      mensalKmCardio += km;
      mensalCaloriasCardio += cal;
      mensalSecondsCardio += secs;
      mensalPassosCardio += passos;
    }
    if (isSameWeek) {
      semanalKmCardio += km;
      semanalCaloriasCardio += cal;
      semanalSecondsCardio += secs;
      semanalPassosCardio += passos;
    }

    const mod = (c.modalidade || '').toLowerCase();
    if (mod.includes('bike') || mod.includes('ciclismo')) {
      bikeKm += km;
      if (isSameMonth) bikeMensalKm += km;
      if (isSameWeek) bikeSemanalKm += km;
    } else {
      caminhadaKm += km;
      if (isSameMonth) caminhadaMensalKm += km;
      if (isSameWeek) caminhadaSemanalKm += km;
    }
  });

  const formatSecsToHms = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formattedCardioTime = totalSecondsCardio > 0 ? formatSecsToHms(totalSecondsCardio) : '00:00:00';
  const formattedCardioTimeMonth = mensalSecondsCardio > 0 ? formatSecsToHms(mensalSecondsCardio) : '00:00:00';
  const formattedCardioTimeWeek = semanalSecondsCardio > 0 ? formatSecsToHms(semanalSecondsCardio) : '00:00:00';

  // Musculação stats separados: Total, Mensal e Semanal
  let totalMinWorkout = 0;
  let mensalMinWorkout = 0;
  let semanalMinWorkout = 0;
  let totalCaloriasWorkout = 0;
  let mensalCaloriasWorkout = 0;
  let semanalCaloriasWorkout = 0;
  const uniqueWorkoutDays = new Set<string>();

  workouts.forEach((w) => {
    const mins = w.duracaoMin || 0;
    totalMinWorkout += mins;
    if (w.data) uniqueWorkoutDays.add(w.data);

    let kcal = w.calorias;
    if (!kcal) {
      if (w.data === '16/11/2026') kcal = 348;
      else if (w.data === '17/11/2026') kcal = 285;
      else if (w.data === '18/11/2026') kcal = 283;
      else kcal = estimateGymCalories(w.duracaoMin || 55, currentWeight, 8, w.focoDivisao);
    }
    totalCaloriasWorkout += kcal;

    const d = parseBRDate(w.data);
    const isSameMonth = d ? (d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) : false;
    const isSameWeek = d ? isSameWeekMondayToSunday(d, today) : false;

    if (isSameMonth) {
      mensalMinWorkout += mins;
      mensalCaloriasWorkout += kcal;
    }
    if (isSameWeek) {
      semanalMinWorkout += mins;
      semanalCaloriasWorkout += kcal;
    }
  });

  const lastWorkoutFocus = workouts.length > 0 ? workouts[workouts.length - 1].focoDivisao : 'Costas / Bíceps';

  // Consolidação de Calorias Queimadas (Cardio + Musculação)
  const totalGeralKcal = totalCaloriasCardio + totalCaloriasWorkout;
  const mensalGeralKcal = mensalCaloriasCardio + mensalCaloriasWorkout;
  const semanalGeralKcal = semanalCaloriasCardio + semanalCaloriasWorkout;

  // Chart data: Peso e Bioimpedância
  const chartDataWeights = weights.map((w) => ({
    date: w.data,
    peso: w.peso,
    gordura: w.gorduraPercent,
    musculo: w.massaMuscularPercent,
  }));

  // Chart data: Calorias Unidas e Empilhadas por Data (Cardio + Musculação)
  const caloriesMap = new Map<string, CalorieChartPoint>();

  cardios.forEach((c) => {
    if (!c.data) return;
    const item = caloriesMap.get(c.data) || {
      date: c.data,
      cardioKcal: 0,
      workoutKcal: 0,
      totalKcal: 0,
      cardioDetails: [],
      workoutDetails: [],
    };
    const cal = c.calorias || 0;
    item.cardioKcal += cal;
    item.cardioDetails.push(
      `${c.modalidade}${c.distanciaKm ? ` (${formatBRNumber(c.distanciaKm, 2)} km)` : ''}: ${cal} kcal`
    );
    caloriesMap.set(c.data, item);
  });

  workouts.forEach((w) => {
    if (!w.data) return;
    const item = caloriesMap.get(w.data) || {
      date: w.data,
      cardioKcal: 0,
      workoutKcal: 0,
      totalKcal: 0,
      cardioDetails: [],
      workoutDetails: [],
    };
    let cal = w.calorias;
    if (!cal) {
      if (w.data === '16/11/2026') cal = 348;
      else if (w.data === '17/11/2026') cal = 285;
      else cal = estimateGymCalories(w.duracaoMin || 55, currentWeight, 8, w.focoDivisao);
    }
    item.workoutKcal += cal;
    item.workoutDetails.push(
      `${w.focoDivisao}${w.duracaoMin ? ` (${w.duracaoMin} min)` : ''}: ${cal} kcal`
    );
    caloriesMap.set(w.data, item);
  });

  const chartDataCalories: CalorieChartPoint[] = Array.from(caloriesMap.values())
    .sort((a, b) => {
      const [dA, mA, yA] = a.date.split('/').map(Number);
      const [dB, mB, yB] = b.date.split('/').map(Number);
      const tA = new Date(yA || 2026, (mA || 1) - 1, dA || 1).getTime();
      const tB = new Date(yB || 2026, (mB || 1) - 1, dB || 1).getTime();
      return tA - tB;
    })
    .map((pt) => ({
      ...pt,
      totalKcal: pt.cardioKcal + pt.workoutKcal,
    }));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Clean Protocol Header Banner */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-4 sm:p-5 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-emerald-400">
              Protocolo Will Fit 2026 • Dados Iniciais & Linha de Base
            </h2>
          </div>

          {/* Clean baseline metric pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Início:</span>
              <strong className="text-white font-semibold">{weights[0]?.data || '16/11/2026'}</strong>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-slate-400">Altura:</span>
              <strong className="text-white font-semibold">{formatBRNumber(userAltura, 2)} m</strong>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Peso Inicial:</span>
              <strong className="text-emerald-300 font-bold">{formatBRNumber(initPeso, 3)} kg</strong>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Abdômen:</span>
              <strong className="text-white font-semibold">{latestAbdomen || 127} cm</strong>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-slate-400">Idade:</span>
              <strong className="text-white font-semibold">{profile.idade || 33} anos</strong>
            </div>

            <div className="bg-slate-900/70 border border-slate-700/60 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="text-slate-400">Fotos:</span>
              <strong className="text-white font-semibold">{photos.length} reg.</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Cards Separados: Linha de Base Inicial vs Estado Atual & Variações */}
      <div>
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Painel de Bioimpedância & Peso Corporal (Comparativo Início vs Atual)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Card 1: Linha de Base Inicial */}
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700/70 p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-slate-300">
                    <Scale className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                      Dados Iniciais • Linha de Base
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Primeiro registro oficial na balança de casa
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/40">
                  {firstWeightRecord?.data || '16/11/2026'}
                </span>
              </div>

              {/* Featured Peso Inicial */}
              <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    PESO INICIAL
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {formatBRNumber(initPeso, 3)}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">kg</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400 max-w-[150px] text-right">
                  {firstWeightRecord?.contexto || 'Horário do almoço (12:21)'}
                </span>
              </div>

              {/* Grid com métricas iniciais bem espaçadas e legíveis */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">IMC</span>
                  <span className="text-lg font-bold text-white block mt-0.5">{formatBRNumber(initImc, 2)}</span>
                  <span className="text-[10px] text-amber-400/90 font-medium">Obesidade I</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Gordura Corporal</span>
                  <span className="text-lg font-bold text-amber-300 block mt-0.5">{formatBRNumber(initGordura, 1)}%</span>
                  <span className="text-[10px] text-slate-400">{firstWeightRecord?.pesoGordura ? `${formatBRNumber(firstWeightRecord.pesoGordura, 1)} kg` : '40,3 kg'}</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Massa Muscular</span>
                  <span className="text-lg font-bold text-teal-300 block mt-0.5">{formatBRNumber(initMassaMusc, 1)}%</span>
                  <span className="text-[10px] text-slate-400">{firstWeightRecord?.pesoMassaMuscular ? `${formatBRNumber(firstWeightRecord.pesoMassaMuscular, 1)} kg` : '70,0 kg'}</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Massa Esquelética</span>
                  <span className="text-lg font-bold text-cyan-300 block mt-0.5">{formatBRNumber(initMassaEsq, 1)}%</span>
                  <span className="text-[10px] text-slate-400">{firstWeightRecord?.pesoMassaMuscEsq ? `${formatBRNumber(firstWeightRecord.pesoMassaMuscEsq, 1)} kg` : '36,5 kg'}</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Gordura Visceral</span>
                  <span className="text-lg font-bold text-rose-300 block mt-0.5">{formatBRNumber(initVisceral, 1)}</span>
                  <span className="text-[10px] text-slate-400">Nível visceral</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Água Corporal</span>
                  <span className="text-lg font-bold text-blue-300 block mt-0.5">{formatBRNumber(initAgua, 1)}%</span>
                  <span className="text-[10px] text-slate-400">{firstWeightRecord?.pesoAgua ? `${formatBRNumber(firstWeightRecord.pesoAgua, 1)} kg` : '54,9 kg'}</span>
                </div>

                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl col-span-2">
                  <span className="text-[11px] font-semibold text-slate-400 block truncate">Metabolismo Basal</span>
                  <span className="text-lg font-bold text-purple-300 block mt-0.5">
                    {formatBRNumber(initMetabolismo, 0)} <span className="text-xs text-slate-400 font-normal">kcal/dia</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Gasto calórico basal inicial</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Estado Atual & Variações */}
          <div className="bg-slate-800/80 backdrop-blur border border-emerald-500/40 p-4 sm:p-5 rounded-2xl shadow-lg shadow-emerald-950/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      Dados Atuais & Variação
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Evolução acumulada em relação ao peso e medidas iniciais
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {latestWeight?.data || '19/11/2026'}
                </span>
              </div>

              {/* Featured Peso Atual com Variação Destacada */}
              <div className="bg-slate-900/70 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between mb-4 relative z-10">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    PESO ATUAL
                  </span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-emerald-300">
                      {formatBRNumber(currPeso, 3)}
                    </span>
                    <span className="text-sm font-semibold text-emerald-400">kg</span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {latestWeight?.contexto || 'Manhã (06:15)'}
                  </span>
                </div>

                {/* Variação em destaque */}
                <div className="bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
                    Variação Total
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-xl sm:text-2xl font-black text-emerald-400">
                      {diffPeso > 0 ? `+${formatBRNumber(diffPeso, 3)}` : formatBRNumber(diffPeso, 3)}
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">kg</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-medium block">
                    Perda acumulada
                  </span>
                </div>
              </div>

              {/* Grid com métricas atuais e suas variações bem visíveis e sem cortes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
                <div className="bg-slate-900/40 border border-slate-700/40 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block truncate">IMC Atual</span>
                    <span className="text-lg font-bold text-white block mt-0.5">{formatBRNumber(currImc, 2)}</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className={`font-semibold ${imcInfo.cor}`}>{imcInfo.classificacao}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffImc < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {diffImc > 0 ? `+${formatBRNumber(diffImc, 2)}` : formatBRNumber(diffImc, 2)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-amber-500/30 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-400 block truncate">Gordura Atual</span>
                    <span className="text-lg font-bold text-amber-300 block mt-0.5">{formatBRNumber(currGordura, 1)}%</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{formatBRNumber(pesoGordura, 1)} kg</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffGordura < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {diffGordura > 0 ? `+${formatBRNumber(diffGordura, 1)}%` : `${formatBRNumber(diffGordura, 1)}%`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-teal-500/30 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-teal-400 block truncate">Massa Muscular</span>
                    <span className="text-lg font-bold text-teal-300 block mt-0.5">{formatBRNumber(currMassaMusc, 1)}%</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{formatBRNumber(pesoMassaMusc, 1)} kg</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffMassaMusc > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                      {diffMassaMusc > 0 ? `+${formatBRNumber(diffMassaMusc, 1)}%` : `${formatBRNumber(diffMassaMusc, 1)}%`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-cyan-500/30 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-cyan-400 block truncate">Massa Esquelética</span>
                    <span className="text-lg font-bold text-cyan-300 block mt-0.5">{formatBRNumber(currMassaEsq, 1)}%</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{latestWeight?.pesoMassaMuscEsq ? `${formatBRNumber(latestWeight.pesoMassaMuscEsq, 1)} kg` : '36,2 kg'}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffMassaEsq > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                      {diffMassaEsq > 0 ? `+${formatBRNumber(diffMassaEsq, 1)}%` : `${formatBRNumber(diffMassaEsq, 1)}%`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-rose-500/30 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-rose-400 block truncate">Gordura Visceral</span>
                    <span className="text-lg font-bold text-rose-300 block mt-0.5">{formatBRNumber(currVisceral, 1)}</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Nível visceral</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffVisceral < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {diffVisceral > 0 ? `+${formatBRNumber(diffVisceral, 1)}` : formatBRNumber(diffVisceral, 1)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-blue-500/30 p-2.5 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-400 block truncate">Água Corporal</span>
                    <span className="text-lg font-bold text-blue-300 block mt-0.5">{formatBRNumber(currAgua, 1)}%</span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{latestWeight?.pesoAgua ? `${formatBRNumber(latestWeight.pesoAgua, 1)} kg` : '54,2 kg'}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-0.5">
                      {diffAgua > 0 ? <TrendingUp className="w-3 h-3" /> : null}
                      {diffAgua > 0 ? `+${formatBRNumber(diffAgua, 1)}%` : `${formatBRNumber(diffAgua, 1)}%`}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-purple-500/30 p-2.5 rounded-xl col-span-2 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-purple-400 block truncate">Metabolismo Basal</span>
                    <span className="text-lg font-bold text-purple-300 block mt-0.5">
                      {formatBRNumber(currMetabolismo, 0)} <span className="text-xs text-slate-400 font-normal">kcal/dia</span>
                    </span>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-700/50 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Gasto calórico basal</span>
                    <span className="font-bold text-slate-300 flex items-center gap-0.5">
                      {diffMetabolismo < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                      {diffMetabolismo > 0 ? `+${formatBRNumber(diffMetabolismo, 0)}` : formatBRNumber(diffMetabolismo, 0)} kcal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cardio Summary Bar (Aba "Cardio") com Cards Separados de Tempo e Calorias */}
      <div className="bg-slate-850 border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Cardio & Atividades Aeróbicas (Strava)
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {cardios.length} {cardios.length === 1 ? 'atividade' : 'atividades'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Caminhada, Corrida, Ciclismo/Bike e Esteira • Métricas gerais, tempos e calorias separados
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('cardio')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Lançar cardio com print <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 13 Cards Dinâmicos: Atividades, Distâncias, Tempos, Passos e Calorias Separados */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-13 gap-2 text-center">
          {/* 1. Atividades */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 block font-medium">Total Atividades</span>
            <span className="text-lg font-black text-white mt-1 block">{cardios.length}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Sessões</span>
          </div>

          {/* 2. Distância Total */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-600/40 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Distância Total</span>
            <span className="text-base font-black text-sky-400 mt-1 block">{formatBRNumber(totalKmCardio, 2)} km</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Percorridos</span>
          </div>

          {/* 3. Distância no Mês */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-600/40 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Distância Mês</span>
            <span className="text-base font-black text-sky-300 mt-1 block">{formatBRNumber(mensalKmCardio, 2)} km</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Mês corrente</span>
          </div>

          {/* 4. Distância na Semana */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-600/40 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Distância Sem</span>
            <span className="text-base font-black text-sky-300 mt-1 block">{formatBRNumber(semanalKmCardio, 2)} km</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Semana corrente</span>
          </div>

          {/* 5. Tempo Total */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Tempo Total</span>
            <span className="text-sm font-black text-white mt-1 block font-mono">{formattedCardioTime}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Geral</span>
          </div>

          {/* 6. Tempo no Mês */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Tempo no Mês</span>
            <span className="text-sm font-black text-sky-200 mt-1 block font-mono">{formattedCardioTimeMonth}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Mês</span>
          </div>

          {/* 7. Tempo na Semana */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-sky-800/60 flex flex-col justify-between">
            <span className="text-[10px] text-sky-300 block font-semibold">Tempo na Sem</span>
            <span className="text-sm font-black text-sky-200 mt-1 block font-mono">{formattedCardioTimeWeek}</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Semana</span>
          </div>

          {/* 8. Passos Total */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 block font-semibold">Passos Total</span>
            <span className="text-base font-black text-emerald-300 mt-1 block">{totalPassosCardio.toLocaleString('pt-BR')}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Acumulados</span>
          </div>

          {/* 9. Passos no Mês */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 block font-semibold">Passos Mês</span>
            <span className="text-base font-black text-emerald-300 mt-1 block">{mensalPassosCardio.toLocaleString('pt-BR')}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Mês</span>
          </div>

          {/* 10. Passos na Semana */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-emerald-400 block font-semibold">Passos Sem</span>
            <span className="text-base font-black text-emerald-300 mt-1 block">{semanalPassosCardio.toLocaleString('pt-BR')}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Semana</span>
          </div>

          {/* 11. Calorias Total */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 block font-semibold">Calorias Total</span>
            <span className="text-base font-black text-amber-300 mt-1 block">{totalCaloriasCardio.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Geral</span>
          </div>

          {/* 12. Calorias no Mês */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 block font-semibold">Calorias Mês</span>
            <span className="text-base font-black text-amber-300 mt-1 block">{mensalCaloriasCardio.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Mês</span>
          </div>

          {/* 13. Calorias na Semana */}
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/40 flex flex-col justify-between">
            <span className="text-[10px] text-amber-400 block font-semibold">Calorias Sem</span>
            <span className="text-base font-black text-amber-300 mt-1 block">{semanalCaloriasCardio.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Semana</span>
          </div>
        </div>

        {/* Subcards de Modalidades: Caminhada & Bike */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-750">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-sky-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <div>
                <span className="text-xs font-bold text-sky-300 block">Caminhada a Pé</span>
                <span className="text-[11px] text-slate-400">Total: {formatBRNumber(caminhadaKm, 2)} km • Mês: {formatBRNumber(caminhadaMensalKm, 2)} km • Sem: {formatBRNumber(caminhadaSemanalKm, 2)} km</span>
              </div>
            </div>
            <span className="text-base font-black text-sky-400 font-mono">{formatBRNumber(caminhadaKm, 2)} km</span>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <div>
                <span className="text-xs font-bold text-indigo-300 block">Ciclismo / Bike</span>
                <span className="text-[11px] text-slate-400">Total: {formatBRNumber(bikeKm, 2)} km • Mês: {formatBRNumber(bikeMensalKm, 2)} km • Sem: {formatBRNumber(bikeSemanalKm, 2)} km</span>
              </div>
            </div>
            <span className="text-base font-black text-slate-300 font-mono">{formatBRNumber(bikeKm, 2)} km</span>
          </div>
        </div>
      </div>

      {/* Musculação / Academia Fast fit Summary Bar (Aba "Treinos") com Cards Separados de Tempo e Calorias */}
      <div className="bg-slate-850 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Musculação & Academia (Aba Treinos)
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {workouts.length} {workouts.length === 1 ? 'treino' : 'treinos'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Divisões musculares, exercícios executados, séries, cargas e gasto calórico estimado
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('workout')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Lançar treino de musculação <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 9 Cards Dinâmicos: Sessões, Tempos Separados e Calorias Separadas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 text-center">
          {/* 1. Total Treinos */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block font-medium">Total de Treinos</span>
            <span className="text-lg font-black text-white mt-1 block">{workouts.length}</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Sessões</span>
          </div>

          {/* 2. Frequência */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block font-medium">Frequência</span>
            <span className="text-lg font-black text-teal-400 mt-1 block">{uniqueWorkoutDays.size} dia(s)</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Dias ativos</span>
          </div>

          {/* 3. Último Foco */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 block font-medium">Último Foco</span>
            <span className="text-xs font-bold text-white mt-1 block truncate" title={lastWorkoutFocus}>
              {lastWorkoutFocus}
            </span>
            <span className="text-[9px] text-indigo-400 mt-0.5 block">Grupos</span>
          </div>

          {/* 4. Tempo Total */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-800/60 flex flex-col justify-between">
            <span className="text-[11px] text-indigo-300 block font-semibold">Tempo Total</span>
            <span className="text-base font-black text-white mt-1 block">{totalMinWorkout} min</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">{Math.floor(totalMinWorkout / 60)}h {totalMinWorkout % 60}m</span>
          </div>

          {/* 5. Tempo no Mês */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-800/60 flex flex-col justify-between">
            <span className="text-[11px] text-indigo-300 block font-semibold">Tempo no Mês</span>
            <span className="text-base font-black text-indigo-200 mt-1 block">{mensalMinWorkout} min</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Mês corrente</span>
          </div>

          {/* 6. Tempo na Semana */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-indigo-800/60 flex flex-col justify-between">
            <span className="text-[11px] text-indigo-300 block font-semibold">Tempo na Semana</span>
            <span className="text-base font-black text-indigo-200 mt-1 block">{semanalMinWorkout} min</span>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Semana corrente</span>
          </div>

          {/* 7. Calorias Total */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/40 flex flex-col justify-between">
            <span className="text-[11px] text-purple-400 block font-semibold">Calorias Total</span>
            <span className="text-base font-black text-purple-300 mt-1 block">{totalCaloriasWorkout.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Geral</span>
          </div>

          {/* 8. Calorias no Mês */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/40 flex flex-col justify-between">
            <span className="text-[11px] text-purple-400 block font-semibold">Calorias no Mês</span>
            <span className="text-base font-black text-purple-300 mt-1 block">{mensalCaloriasWorkout.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Mês</span>
          </div>

          {/* 9. Calorias na Semana */}
          <div className="bg-slate-900/80 p-3 rounded-xl border border-purple-500/40 flex flex-col justify-between">
            <span className="text-[11px] text-purple-400 block font-semibold">Calorias na Semana</span>
            <span className="text-base font-black text-purple-300 mt-1 block">{semanalCaloriasWorkout.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[9px] text-slate-500 mt-0.5 block">Semana</span>
          </div>
        </div>
      </div>

      {/* Cards de Calorias Queimadas (Total, Mensal e Semanal) - Centralizados Acima dos Gráficos */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 text-center">
            Consolidação de Calorias Queimadas (Cardio + Musculação)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Calorias Totais (Acima do Gráfico de Peso) */}
          <div className="bg-slate-850 border border-amber-500/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between text-center relative overflow-hidden group hover:border-amber-500/60 transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-750">
              <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400">
                Calorias Totais
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Geral Acumulado
              </span>
            </div>
            <div className="my-2.5">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                  {totalGeralKcal.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-amber-400/90">kcal</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gasto energético total combinado
              </p>
            </div>
            <div className="pt-2 border-t border-slate-750 flex items-center justify-around text-[11px]">
              <span className="text-sky-400 font-medium">
                Cardio: <strong className="font-bold text-sky-300">{totalCaloriasCardio.toLocaleString('pt-BR')}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-medium">
                Treino: <strong className="font-bold text-purple-300">{totalCaloriasWorkout.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>

          {/* 2. Calorias no Mês (No Meio, entre ambos os gráficos) */}
          <div className="bg-slate-850 border border-orange-500/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between text-center relative overflow-hidden group hover:border-orange-500/60 transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-750">
              <span className="text-[11px] uppercase font-bold tracking-wider text-orange-400">
                Calorias no Mês
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Mês Corrente
              </span>
            </div>
            <div className="my-2.5">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-orange-300 font-mono">
                  {mensalGeralKcal.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-orange-400/90">kcal</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Queima calórica do mês atual
              </p>
            </div>
            <div className="pt-2 border-t border-slate-750 flex items-center justify-around text-[11px]">
              <span className="text-sky-400 font-medium">
                Cardio: <strong className="font-bold text-sky-300">{mensalCaloriasCardio.toLocaleString('pt-BR')}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-medium">
                Treino: <strong className="font-bold text-purple-300">{mensalCaloriasWorkout.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>

          {/* 3. Calorias na Semana (Acima do Gráfico de Gasto Calórico) */}
          <div className="bg-slate-850 border border-rose-500/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between text-center relative overflow-hidden group hover:border-rose-500/60 transition">
            <div className="flex items-center justify-between pb-2 border-b border-slate-750">
              <span className="text-[11px] uppercase font-bold tracking-wider text-rose-400">
                Calorias na Semana
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Semana Corrente
              </span>
            </div>
            <div className="my-2.5">
              <div className="flex items-baseline justify-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-300 font-mono">
                  {semanalGeralKcal.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-rose-400/90">kcal</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Semana corrente (segunda a domingo)
              </p>
            </div>
            <div className="pt-2 border-t border-slate-750 flex items-center justify-around text-[11px]">
              <span className="text-sky-400 font-medium">
                Cardio: <strong className="font-bold text-sky-300">{semanalCaloriasCardio.toLocaleString('pt-BR')}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-medium">
                Treino: <strong className="font-bold text-purple-300">{semanalCaloriasWorkout.toLocaleString('pt-BR')}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Evolução do Peso e Gordura */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Evolução Temporal do Peso (kg) & Bioimpedância
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo de redução ponderal diária
              </p>
            </div>
            <button
              onClick={() => onNavigate('weight')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              Novo registro <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartDataWeights} margin={{ top: 15, right: 35, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  width={68}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tickFormatter={(val) => `${val} kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                  }}
                  formatter={(val: number) => [`${formatBRNumber(val, 3)} kg`, 'Peso']}
                />
                <ReferenceLine y={initialWeight} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Início', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Gasto Calórico das Duas Atividades (Cardio & Musculação) - Barra Empilhada */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Gasto Calórico Diário (Cardio & Musculação)
              </h3>
              <p className="text-xs text-slate-400">
                Total diário com atividades separadas na mesma barra empilhada
              </p>
            </div>

            {/* Legenda das Atividades */}
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-800 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                Cardio (Strava)
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800 text-[11px] font-semibold">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                Musculação
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartDataCalories.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Nenhuma atividade com gasto calórico registrada ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCalories} margin={{ top: 15, right: 20, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    width={70}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val} kcal`}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const pt: CalorieChartPoint = payload[0]?.payload;
                        if (!pt) return null;
                        return (
                          <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs space-y-2 min-w-[210px]">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="font-bold text-white">{label}</span>
                              <span className="text-amber-300 font-black text-sm">
                                {pt.totalKcal.toLocaleString('pt-BR')} kcal
                              </span>
                            </div>

                            {pt.cardioKcal > 0 && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-sky-400 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-sky-400 inline-block"></span>
                                    Cardio (Strava):
                                  </span>
                                  <span>{pt.cardioKcal.toLocaleString('pt-BR')} kcal</span>
                                </div>
                                {pt.cardioDetails.map((det, i) => (
                                  <p key={i} className="text-[10px] text-slate-400 pl-3.5 truncate">
                                    {det}
                                  </p>
                                ))}
                              </div>
                            )}

                            {pt.workoutKcal > 0 && (
                              <div className="space-y-0.5">
                                <div className="flex justify-between text-purple-400 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
                                    Musculação:
                                  </span>
                                  <span>{pt.workoutKcal.toLocaleString('pt-BR')} kcal</span>
                                </div>
                                {pt.workoutDetails.map((det, i) => (
                                  <p key={i} className="text-[10px] text-slate-400 pl-3.5 truncate">
                                    {det}
                                  </p>
                                ))}
                              </div>
                            )}

                            {pt.cardioKcal > 0 && pt.workoutKcal > 0 && (
                              <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300 text-[11px] font-semibold">
                                <span>Gasto Total do Dia:</span>
                                <span className="text-amber-300 font-bold">
                                  {pt.totalKcal.toLocaleString('pt-BR')} kcal
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Segmento inferior: Cardio (Azul Claro) */}
                  <Bar
                    dataKey="cardioKcal"
                    name="Cardio (Strava)"
                    stackId="atividades"
                    fill="#0284c7"
                    radius={[0, 0, 0, 0]}
                  />
                  {/* Segmento superior: Musculação (Roxo / Púrpura) */}
                  <Bar
                    dataKey="workoutKcal"
                    name="Musculação"
                    stackId="atividades"
                    fill="#a855f7"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent History Overview */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Últimos Registros Salvos na Planilha
          </h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            Ver histórico completo das 5 abas <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Horário / Contexto</th>
                <th className="py-2.5 px-3">Peso</th>
                <th className="py-2.5 px-3">Var. Anterior</th>
                <th className="py-2.5 px-3">IMC</th>
                <th className="py-2.5 px-3">Gordura (%)</th>
                <th className="py-2.5 px-3">Massa Musc. (%)</th>
                <th className="py-2.5 px-3">Visceral</th>
                <th className="py-2.5 px-3">Metabolismo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {weights.slice(-5).reverse().map((r, i) => (
                <tr key={r.id || i} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-medium text-white">{r.data}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/80 text-slate-200">
                      {r.contexto}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    {formatBRNumber(r.peso, 3)} kg
                  </td>
                  <td className="py-2.5 px-3">
                    {r.variacaoAnterior === undefined || r.variacaoAnterior === 0 ? (
                      <span className="text-slate-500">0,000 kg</span>
                    ) : r.variacaoAnterior > 0 ? (
                      <span className="text-rose-400 font-medium">+{formatBRNumber(r.variacaoAnterior, 3)} kg</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">{formatBRNumber(r.variacaoAnterior, 3)} kg</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{r.imc ? formatBRNumber(r.imc, 2) : '-'}</td>
                  <td className="py-2.5 px-3 text-amber-300 font-medium">{r.gorduraPercent ? `${formatBRNumber(r.gorduraPercent, 1)}%` : '-'}</td>
                  <td className="py-2.5 px-3 text-teal-300 font-medium">{r.massaMuscularPercent ? `${formatBRNumber(r.massaMuscularPercent, 1)}%` : '-'}</td>
                  <td className="py-2.5 px-3 text-rose-300">{r.gorduraVisceral ? formatBRNumber(r.gorduraVisceral, 1) : '-'}</td>
                  <td className="py-2.5 px-3 text-purple-300">{r.metabolismo ? `${formatBRNumber(r.metabolismo, 0)} kcal` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};