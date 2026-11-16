import React from 'react';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Ruler,
  Sparkles,
  ArrowRight,
  Calendar,
  Clock,
  Flame,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { WeightRecord, MeasureRecord, UserProfile } from '../types';
import { formatBRNumber, calculateIMC } from '../utils/formatters';

interface DashboardProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
  profile: UserProfile;
  onNavigate: (tab: 'weight' | 'measure' | 'history' | 'assistant') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  weights,
  measures,
  profile,
  onNavigate,
}) => {
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const initialWeight = profile.pesoInicial || 113.250;
  const currentWeight = latestWeight ? latestWeight.peso : initialWeight;
  const totalDiff = Number((currentWeight - initialWeight).toFixed(3));

  const imcInfo = calculateIMC(currentWeight, profile.alturaMetros);

  // Latest abdominal measurement
  const latestAbdomenRecord = [...measures].reverse().find(m => m.abdomen && m.abdomen > 0);
  const latestAbdomen = latestAbdomenRecord ? latestAbdomenRecord.abdomen : 127;

  // Chart data for weight evolution
  const chartDataWeights = weights.map(w => ({
    date: w.data,
    peso: w.peso,
    contexto: w.contexto,
  }));

  // Chart data for measures evolution
  const chartDataMeasures = measures
    .filter(m => m.abdomen || m.cintura || m.quadril)
    .map(m => ({
      date: m.data,
      abdomen: m.abdomen,
      cintura: m.cintura,
      quadril: m.quadril,
    }));

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-800/90 via-slate-850 to-emerald-950/40 p-5 sm:p-6 rounded-2xl border border-slate-700/60 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Flame className="w-3.5 h-3.5" />
              Acompanhamento Corporal em Tempo Real
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Evolução e Métricas Corporais
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Altura cadastrada: <strong className="text-slate-200">{formatBRNumber(profile.alturaMetros, 2)} m</strong> • Peso de Partida: <strong className="text-slate-200">{formatBRNumber(initialWeight, 3)} kg</strong> ({profile.dataInicio})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('weight')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
            >
              <Scale className="w-4 h-4" />
              Lançar Peso
            </button>
            <button
              onClick={() => onNavigate('measure')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold border border-slate-700 transition"
            >
              <Ruler className="w-4 h-4" />
              Lançar Medidas
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 transition"
            >
              <Sparkles className="w-4 h-4" />
              Pedir Análise Gemini
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Peso Inicial */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Peso Inicial
          </span>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatBRNumber(initialWeight, 3)}
            </span>
            <span className="text-xs text-slate-400 ml-1">kg</span>
          </div>
          <span className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {profile.dataInicio}
          </span>
        </div>

        {/* Card 2: Peso Atual */}
        <div className="bg-slate-800/60 backdrop-blur border border-emerald-500/40 p-4 rounded-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Peso Atual
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
              {formatBRNumber(currentWeight, 3)}
            </span>
            <span className="text-xs text-emerald-400 ml-1">kg</span>
          </div>
          <div className="text-xs text-slate-400 mt-2 truncate flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
            <span className="truncate">{latestWeight?.contexto || 'Registro recente'}</span>
          </div>
        </div>

        {/* Card 3: Variação Total */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Variação Total
          </span>
          <div className="mt-2 flex items-center gap-1.5">
            {totalDiff < 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : totalDiff > 0 ? (
              <TrendingUp className="w-5 h-5 text-rose-400 flex-shrink-0" />
            ) : null}
            <span
              className={`text-2xl sm:text-3xl font-extrabold ${
                totalDiff < 0
                  ? 'text-emerald-400'
                  : totalDiff > 0
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {totalDiff > 0 ? `+${formatBRNumber(totalDiff, 3)}` : formatBRNumber(totalDiff, 3)}
            </span>
            <span className="text-xs text-slate-400">kg</span>
          </div>
          <span className="text-xs text-slate-400 mt-2">
            vs. partida inicial
          </span>
        </div>

        {/* Card 4: IMC Atual */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              IMC Atual
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${imcInfo.cor} bg-slate-900 border border-slate-700`}>
              {imcInfo.classificacao}
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {formatBRNumber(imcInfo.imc, 2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">kg/m²</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full ${imcInfo.imc > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (imcInfo.imc / 40) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 5: Abdômen */}
        <div className="col-span-2 lg:col-span-1 bg-slate-800/60 backdrop-blur border border-slate-700/60 p-4 rounded-xl flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Último Abdômen
          </span>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
              {formatBRNumber(latestAbdomen, 1)}
            </span>
            <span className="text-xs text-slate-400 ml-1">cm</span>
          </div>
          <span className="text-xs text-slate-400 mt-2 flex items-center gap-1 truncate" title={latestAbdomenRecord?.observacoes}>
            <Info className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{latestAbdomenRecord?.observacoes || 'Altura do umbigo'}</span>
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Evolução do Peso */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-400" />
                Evolução Temporal do Peso (kg)
              </h3>
              <p className="text-xs text-slate-400">
                Padrão brasileiro (vírgula decimal) e comparativo de pesagens
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
            {chartDataWeights.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Nenhum dado registrado ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataWeights} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={['dataMin - 2', 'dataMax + 2']}
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
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <ReferenceLine y={initialWeight} stroke="#64748b" strokeDasharray="4 4" label={{ value: 'Inicial', fill: '#94a3b8', fontSize: 10, position: 'right' }} />
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
            )}
          </div>
        </div>

        {/* Chart 2: Medidas Corporais */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Ruler className="w-4 h-4 text-cyan-400" />
                Evolução de Medidas Principais (cm)
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhamento de Abdômen, Cintura e Quadril
              </p>
            </div>
            <button
              onClick={() => onNavigate('measure')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              Nova medida <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            {chartDataMeasures.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Nenhuma medida registrada com circunferência abdominal ainda.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartDataMeasures} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(val) => `${val}cm`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                    formatter={(val: number) => [`${formatBRNumber(val, 1)} cm`]}
                  />
                  <Line
                    type="monotone"
                    dataKey="abdomen"
                    name="Abdômen"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cintura"
                    name="Cintura"
                    stroke="#a855f7"
                    strokeWidth={2}
                    dot={{ fill: '#a855f7', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="quadril"
                    name="Quadril"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent History Snippet */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">
            Últimos Registros Salvos
          </h3>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Ver histórico completo na planilha <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Dia</th>
                <th className="py-2.5 px-3">Contexto</th>
                <th className="py-2.5 px-3">Peso</th>
                <th className="py-2.5 px-3">Var. Anterior</th>
                <th className="py-2.5 px-3">Var. Inicial</th>
                <th className="py-2.5 px-3">IMC</th>
                <th className="py-2.5 px-3">Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {weights.slice(-5).reverse().map((r, i) => (
                <tr key={r.id || i} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-medium text-white">{r.data}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.diaSemana}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-700/80 text-slate-300">
                      {r.contexto}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-emerald-400">
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
                  <td className="py-2.5 px-3">
                    {r.variacaoInicial === undefined || r.variacaoInicial === 0 ? (
                      <span className="text-slate-500">0,000 kg</span>
                    ) : r.variacaoInicial > 0 ? (
                      <span className="text-rose-400 font-medium">+{formatBRNumber(r.variacaoInicial, 3)} kg</span>
                    ) : (
                      <span className="text-emerald-400 font-medium">{formatBRNumber(r.variacaoInicial, 3)} kg</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{r.imc ? formatBRNumber(r.imc, 2) : '-'}</td>
                  <td className="py-2.5 px-3 text-xs text-slate-400 max-w-xs truncate" title={r.observacoes}>
                    {r.observacoes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
