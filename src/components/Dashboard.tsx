import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Dumbbell,
  Camera,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Heart,
  Droplets,
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
import { WeightRecord, MeasureRecord, WorkoutRecord, PhotoRecord, UserProfile } from '../types';
import { formatBRNumber, calculateIMC } from '../utils/formatters';
import { NavTab } from './Navbar';

interface DashboardProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
  workouts: WorkoutRecord[];
  photos: PhotoRecord[];
  profile: UserProfile;
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  weights,
  measures,
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

  // Bioimpedance metrics
  const gorduraPercent = latestWeight?.gorduraPercent ?? 35.2;
  const pesoGordura = latestWeight?.pesoGordura ?? 39.4;
  const massaMuscular = latestWeight?.massaMuscularPercent ?? 62.1;
  const pesoMassaMusc = latestWeight?.pesoMassaMuscular ?? 69.5;
  const gorduraVisceral = latestWeight?.gorduraVisceral ?? 26.0;
  const metabolismo = latestWeight?.metabolismo ?? 2126.0;

  // Latest abdominal measurement
  const latestAbdomenRecord = [...measures].reverse().find(m => m.abdomen && m.abdomen > 0);
  const latestAbdomen = latestAbdomenRecord ? latestAbdomenRecord.abdomen : 127;

  // Workouts stats
  let totalKm = 0;
  let totalPassos = 0;
  let totalCalorias = 0;
  workouts.forEach((w) => {
    totalKm += w.distanciaKm || 0;
    totalPassos += w.passos || 0;
    totalCalorias += w.calorias || 0;
  });

  // Chart data
  const chartDataWeights = weights.map((w) => ({
    date: w.data,
    peso: w.peso,
    gordura: w.gorduraPercent,
    musculo: w.massaMuscularPercent,
  }));

  const chartDataWorkouts = workouts.map((w) => ({
    date: w.data,
    distancia: w.distanciaKm || 0,
    calorias: w.calorias || 0,
    modalidade: w.modalidade,
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
              Painel de Composição Corporal & Treinos
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Altura: <strong className="text-slate-200">{formatBRNumber(profile.alturaMetros, 2)} m</strong> • Peso de Partida: <strong className="text-slate-200">{formatBRNumber(initialWeight, 3)} kg</strong> • Abdômen: <strong className="text-slate-200">{latestAbdomen} cm</strong> • Fotos: <strong className="text-slate-200">{photos.length} reg.</strong>
            </p>
          </div>

          {/* Quick Action Buttons with OCR shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('weight')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              Lançar Peso (c/ Print)
            </button>
            <button
              onClick={() => onNavigate('workout')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-sky-600/30 transition transform active:scale-95 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4" />
              Lançar Treino Strava
            </button>
            <button
              onClick={() => onNavigate('measure')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Ruler className="w-4 h-4" />
              Medidas
            </button>
            <button
              onClick={() => onNavigate('photo')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Fotos Semanais
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/30 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Pedir Análise Gemini
            </button>
          </div>
        </div>
      </div>

      {/* 8 Dynamic Cards from "Registro de Peso" */}
      <div>
        <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Painel de Bioimpedância & Peso Corporal
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
          <div className="bg-slate-800/60 backdrop-blur border border-amber-500/30 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold truncate flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              GORDURA ATUAL
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-amber-300">
                {formatBRNumber(gorduraPercent, 1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-300 mt-1 truncate">
              {formatBRNumber(pesoGordura, 1)} kg
            </span>
          </div>

          {/* Card 6: Massa Muscular */}
          <div className="bg-slate-800/60 backdrop-blur border border-sky-500/30 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold truncate flex items-center gap-1">
              <Zap className="w-3 h-3 text-sky-400" />
              MASSA MUSCULAR
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-sky-300">
                {formatBRNumber(massaMuscular, 1)}%
              </span>
            </div>
            <span className="text-[10px] text-slate-300 mt-1 truncate">
              {formatBRNumber(pesoMassaMusc, 1)} kg
            </span>
          </div>

          {/* Card 7: Gordura Visceral */}
          <div className="bg-slate-800/60 backdrop-blur border border-rose-500/30 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold truncate flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" />
              GORDURA VISCERAL
            </span>
            <div className="mt-1">
              <span className="text-lg sm:text-xl font-black text-rose-300">
                {formatBRNumber(gorduraVisceral, 1)}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 truncate">Nível bioimpedância</span>
          </div>

          {/* Card 8: Metabolismo Basal */}
          <div className="bg-slate-800/60 backdrop-blur border border-purple-500/30 p-3 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold truncate flex items-center gap-1">
              <Droplets className="w-3 h-3 text-purple-400" />
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

      {/* Strava & Treinos Summary Bar */}
      <div className="bg-slate-850 border border-sky-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Treinos & Atividades Físicas (Strava)
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {workouts.length} registrados
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Gasto calórico estimado com base no seu peso atual ({formatBRNumber(currentWeight, 3)} kg)
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('workout')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            Lançar novo treino com print <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Total de Treinos</span>
            <span className="text-lg font-black text-white mt-1 block">{workouts.length}</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Distância Total</span>
            <span className="text-lg font-black text-sky-400 mt-1 block">{formatBRNumber(totalKm, 2)} km</span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Tempo Total</span>
            <span className="text-lg font-black text-white mt-1 block">
              {workouts[0]?.tempoMovimento || '00:58:43'}
            </span>
          </div>
          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-medium">Passos Totais</span>
            <span className="text-lg font-black text-emerald-400 mt-1 block">{totalPassos.toLocaleString('pt-BR')}</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-3 rounded-xl border border-amber-500/40">
            <span className="text-xs text-amber-400 block font-medium">Calorias Estimadas</span>
            <span className="text-lg font-black text-amber-300 mt-1 block">{totalCalorias.toLocaleString('pt-BR')} kcal</span>
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
                Evolução Temporal do Peso (kg) & Gordura (%)
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo de redução ponderal e bioimpedância
              </p>
            </div>
            <button
              onClick={() => onNavigate('weight')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
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

        {/* Chart 2: Treinos Strava & Gasto Calórico */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-sky-400" />
                Treinos & Gasto Calórico Estimado (kcal)
              </h3>
              <p className="text-xs text-slate-400">
                Atividades registradas no Strava com calorias calculadas
              </p>
            </div>
            <button
              onClick={() => onNavigate('workout')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
            >
              Lançar treino <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            {chartDataWorkouts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Nenhum treino registrado ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataWorkouts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                    formatter={(val: number) => [`${val} kcal`, 'Gasto Calórico']}
                  />
                  <Bar dataKey="calorias" fill="#0284c7" radius={[6, 6, 0, 0]} />
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
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Ver histórico completo das 4 abas <ArrowRight className="w-3 h-3" />
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
                  <td className="py-2.5 px-3 text-sky-300 font-medium">{r.massaMuscularPercent ? `${formatBRNumber(r.massaMuscularPercent, 1)}%` : '-'}</td>
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
