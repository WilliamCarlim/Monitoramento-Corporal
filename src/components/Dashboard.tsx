import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Dumbbell,
  HeartPulse,
  Camera,
  Sparkles,
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
  cleanDurationString,
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
  const initialWeight = profile.pesoInicial || 113.250;
  const currentWeight = latestWeight ? latestWeight.peso : 111.750;
  const totalDiff = Number((currentWeight - initialWeight).toFixed(3));

  const imcInfo = calculateIMC(currentWeight, profile.alturaMetros);

  // Bioimpedance metrics from latest record
  const gorduraPercent = latestWeight?.gorduraPercent ?? 35.2;
  const pesoGordura = latestWeight?.pesoGordura ?? 39.4;
  const massaMuscular = latestWeight?.massaMuscularPercent ?? 62.1;
  const pesoMassaMusc = latestWeight?.pesoMassaMuscular ?? 69.5;
  const gorduraVisceral = latestWeight?.gorduraVisceral ?? 26.0;
  const metabolismo = latestWeight?.metabolismo ?? 2126.0;

  // Latest abdominal measurement
  const latestAbdomenRecord = [...measures].reverse().find((m) => m.abdomen && m.abdomen > 0);
  const latestAbdomen = latestAbdomenRecord ? latestAbdomenRecord.abdomen : 127;

  // Cardio stats
  let totalKmCardio = 0;
  let totalPassosCardio = 0;
  let totalCaloriasCardio = 0;
  let totalSecondsCardio = 0;
  let caminhadaKm = 0;
  let bikeKm = 0;

  cardios.forEach((c) => {
    const km = c.distanciaKm || 0;
    totalKmCardio += km;
    totalPassosCardio += c.passos || 0;
    totalCaloriasCardio += c.calorias || 0;
    const durHours = parseDurationToHours(c.tempoMovimento);
    totalSecondsCardio += Math.round(durHours * 3600);

    const mod = (c.modalidade || '').toLowerCase();
    if (mod.includes('bike') || mod.includes('ciclismo')) {
      bikeKm += km;
    } else {
      caminhadaKm += km;
    }
  });

  const cardioH = Math.floor(totalSecondsCardio / 3600);
  const cardioM = Math.floor((totalSecondsCardio % 3600) / 60);
  const cardioS = totalSecondsCardio % 60;
  const formattedCardioTime =
    totalSecondsCardio > 0
      ? `${String(cardioH).padStart(2, '0')}:${String(cardioM).padStart(2, '0')}:${String(cardioS).padStart(2, '0')}`
      : cardios[0]?.tempoMovimento
      ? cleanDurationString(cardios[0].tempoMovimento)
      : '00:58:43';

  // Musculação stats
  let totalMinWorkout = 0;
  let totalCaloriasWorkout = 0;
  const uniqueWorkoutDays = new Set<string>();

  workouts.forEach((w) => {
    totalMinWorkout += w.duracaoMin || 0;
    if (w.data) uniqueWorkoutDays.add(w.data);
    const kcal = w.calorias || estimateGymCalories(w.duracaoMin || 55, currentWeight, w.esforcoPse || 8, w.focoDivisao);
    totalCaloriasWorkout += kcal;
  });

  const workoutHours = Math.floor(totalMinWorkout / 60);
  const workoutRemMin = totalMinWorkout % 60;
  const formattedWorkoutDuration =
    totalMinWorkout > 0
      ? workoutHours > 0
        ? `${totalMinWorkout} min (${workoutHours}h ${workoutRemMin}m)`
        : `${totalMinWorkout} min`
      : 'N/A';

  const lastWorkoutFocus = workouts.length > 0 ? workouts[workouts.length - 1].focoDivisao : 'Quadríceps';

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
    const cal = w.calorias || estimateGymCalories(w.duracaoMin || 55, currentWeight, w.esforcoPse || 8, w.focoDivisao);
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
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800/90 via-slate-850 to-emerald-950/40 p-5 sm:p-6 rounded-2xl border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Flame className="w-3.5 h-3.5" />
              Acompanhamento Corporal & Bioimpedância em Tempo Real
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Painel Integrado das 5 Abas da Planilha
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Altura: <strong className="text-slate-200">{formatBRNumber(profile.alturaMetros, 2)} m</strong> • Peso de Partida: <strong className="text-slate-200">{formatBRNumber(initialWeight, 3)} kg</strong> • Abdômen: <strong className="text-slate-200">{latestAbdomen} cm</strong> • Fotos: <strong className="text-slate-200">{photos.length} reg.</strong>
            </p>
          </div>

          {/* Quick Action Buttons with OCR shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('weight')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Lançar Peso (OCR)
            </button>
            <button
              onClick={() => onNavigate('cardio')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-sky-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4" />
              Lançar Cardio (Strava)
            </button>
            <button
              onClick={() => onNavigate('workout')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4" />
              Lançar Musculação
            </button>
            <button
              onClick={() => onNavigate('measure')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition transform active:scale-95 cursor-pointer"
            >
              <Ruler className="w-4 h-4" />
              Medidas
            </button>
            <button
              onClick={() => onNavigate('photo')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Fotos
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/30 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Gemini IA
            </button>
          </div>
        </div>
      </div>

      {/* 8 Dynamic Cards from "Registro de Peso" */}
      <div>
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Painel de Bioimpedância & Peso Corporal (8 Cards Dinâmicos)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Card 1: Peso Inicial */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
              PESO INICIAL
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-white">
                {formatBRNumber(initialWeight, 3)}
              </span>
              <span className="text-[10px] text-slate-400 ml-0.5">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">16/11/2026</span>
          </div>

          {/* Card 2: Peso Atual */}
          <div className="bg-slate-800/70 backdrop-blur border border-emerald-500/50 p-3 rounded-xl flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold truncate">
                PESO ATUAL
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-emerald-300">
                {formatBRNumber(currentWeight, 3)}
              </span>
              <span className="text-[10px] text-emerald-400 ml-0.5">kg</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate" title={latestWeight?.contexto}>
              {latestWeight?.contexto || 'Recente'}
            </span>
          </div>

          {/* Card 3: Variação Total */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
              VARIAÇÃO TOTAL
            </span>
            <div className="mt-1 flex items-center gap-1">
              {totalDiff < 0 ? (
                <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : totalDiff > 0 ? (
                <TrendingUp className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : null}
              <span
                className={`text-lg sm:text-xl font-black ${
                  totalDiff < 0
                    ? 'text-emerald-400'
                    : totalDiff > 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {totalDiff > 0 ? `+${formatBRNumber(totalDiff, 3)}` : formatBRNumber(totalDiff, 3)}
              </span>
              <span className="text-[10px] text-slate-400">kg</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium mt-1">Perda acumulada</span>
          </div>

          {/* Card 4: IMC Atual */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
                IMC ATUAL
              </span>
            </div>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-white">
                {formatBRNumber(imcInfo.imc, 2)}
              </span>
            </div>
            <span className={`text-[9px] font-bold uppercase truncate ${imcInfo.cor}`}>
              {imcInfo.classificacao}
            </span>
          </div>

          {/* Card 5: Gordura Atual */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold truncate">
              GORDURA ATUAL
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-amber-300">
                {formatBRNumber(gorduraPercent, 1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {formatBRNumber(pesoGordura, 1)} kg gordura
            </span>
          </div>

          {/* Card 6: Massa Muscular */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold truncate">
              MASSA MUSCULAR
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-teal-300">
                {formatBRNumber(massaMuscular, 1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">
              {formatBRNumber(pesoMassaMusc, 1)} kg músculo
            </span>
          </div>

          {/* Card 7: Gordura Visceral */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold truncate">
              VISCERAL
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-rose-300">
                {formatBRNumber(gorduraVisceral, 1)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">Nível de gordura</span>
          </div>

          {/* Card 8: Metabolismo Basal */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold truncate">
              METABOLISMO
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-purple-300">
                {formatBRNumber(metabolismo, 0)}
              </span>
              <span className="text-[9px] text-slate-400 ml-0.5">kcal</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">Gasto diário basal</span>
          </div>
        </div>
      </div>

      {/* Cardio Summary Bar (Aba "Cardio") */}
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
                  {cardios.length} registradas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Caminhada, Corrida, Ciclismo/Bike e Esteira • Gasto calórico estimado com base no peso ({formatBRNumber(currentWeight, 3)} kg)
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

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Total de Atividades</span>
            <span className="text-lg font-black text-white mt-1 block">{cardios.length}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Sessões registradas</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Distância Total</span>
            <span className="text-lg font-black text-sky-400 mt-1 block">{formatBRNumber(totalKmCardio, 2)} km</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Quilômetros percorridos</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Tempo Total</span>
            <span className="text-lg font-black text-white mt-1 block font-mono">
              {formattedCardioTime}
            </span>
            <span className="text-[10px] text-sky-400 mt-0.5 block font-mono">Mês: {formattedCardioTime} • Sem: {formattedCardioTime}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Passos Totais</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">{totalPassosCardio.toLocaleString('pt-BR')}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Passos acumulados</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-3 rounded-xl border border-amber-500/40">
            <span className="text-xs text-amber-400 block font-medium">Calorias Estimadas</span>
            <span className="text-lg font-black text-amber-300 mt-1 block">{totalCaloriasCardio.toLocaleString('pt-BR')} kcal</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Gasto calórico total</span>
          </div>
        </div>

        {/* Subcards de Modalidades: Caminhada & Bike */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-750">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-sky-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
              <div>
                <span className="text-xs font-bold text-sky-300 block">Caminhada a Pé</span>
                <span className="text-[11px] text-slate-400">Mês: {formatBRNumber(caminhadaKm, 2)} km • Semana: {formatBRNumber(caminhadaKm, 2)} km</span>
              </div>
            </div>
            <span className="text-base font-black text-sky-400 font-mono">{formatBRNumber(caminhadaKm, 2)} km</span>
          </div>

          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
              <div>
                <span className="text-xs font-bold text-indigo-300 block">Ciclismo / Bike</span>
                <span className="text-[11px] text-slate-400">Mês: {formatBRNumber(bikeKm, 2)} km • Semana: {formatBRNumber(bikeKm, 2)} km</span>
              </div>
            </div>
            <span className="text-base font-black text-slate-300 font-mono">{formatBRNumber(bikeKm, 2)} km</span>
          </div>
        </div>
      </div>

      {/* Musculação / Academia Fast fit Summary Bar (Aba "Treinos") com Cards Completos */}
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
                  {workouts.length} treinos
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Divisões musculares, exercícios executados, séries, cargas e percepção de esforço (PSE)
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Total de Treinos</span>
            <span className="text-lg font-black text-white mt-1 block">{workouts.length}</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Sessões registradas</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Tempo Total</span>
            <span className="text-lg font-black text-indigo-400 mt-1 block">{totalMinWorkout} min</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">{formattedWorkoutDuration}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Mês e Semana</span>
            <span className="text-lg font-black text-indigo-300 mt-1 block">{totalMinWorkout} min</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Semana: {totalMinWorkout} min</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Frequência</span>
            <span className="text-lg font-black text-teal-400 mt-1 block">{uniqueWorkoutDays.size} dia(s)</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Dias ativos no período</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Último Foco</span>
            <span className="text-sm font-bold text-white mt-2 block truncate" title={lastWorkoutFocus}>
              {lastWorkoutFocus}
            </span>
            <span className="text-[10px] text-indigo-400 mt-0.5 block">Grupos musculares</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-3 rounded-xl border border-purple-500/40">
            <span className="text-xs text-purple-400 block font-medium">Calorias Estimadas</span>
            <span className="text-lg font-black text-purple-300 mt-1 block">
              {totalCaloriasWorkout.toLocaleString('pt-BR')} kcal
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Gasto acumulado</span>
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
              <LineChart data={chartDataWeights} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(val) => `${val}kg`}
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
                <ReferenceLine y={initialWeight} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Partida', fill: '#94a3b8', fontSize: 10, position: 'right' }} />
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
                <BarChart data={chartDataCalories} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `${val} kcal`}
                  />
                  <Tooltip
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