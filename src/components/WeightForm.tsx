import React, { useState, useEffect } from 'react';
import { Scale, Calendar, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { WeightRecord, UserProfile } from '../types';
import { getTodayBR, getDayOfWeekBR, parseBRNumber, formatBRNumber, calculateIMC } from '../utils/formatters';

interface WeightFormProps {
  latestWeight?: WeightRecord;
  profile: UserProfile;
  onSubmit: (record: WeightRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

const CONTEXT_OPTIONS = [
  'Jejum matinal',
  'Pós-treino / Almoço',
  'Tarde (pós-lanche)',
  'Antes de dormir',
  'Pós-refeição livre',
  'Outro (descrever nas observações)',
];

export const WeightForm: React.FC<WeightFormProps> = ({
  latestWeight,
  profile,
  onSubmit,
  onSuccess,
}) => {
  const [data, setData] = useState<string>(getTodayBR());
  const [diaSemana, setDiaSemana] = useState<string>(getDayOfWeekBR());
  const [contexto, setContexto] = useState<string>('Jejum matinal');
  const [customContexto, setCustomContexto] = useState<string>('');
  const [pesoInput, setPesoInput] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Update day of week when date changes
  useEffect(() => {
    setDiaSemana(getDayOfWeekBR(data));
  }, [data]);

  // Live calculations
  const parsedPeso = parseBRNumber(pesoInput);
  const prevPeso = latestWeight ? latestWeight.peso : profile.pesoInicial;
  const initialPeso = profile.pesoInicial || 113.250;

  const liveDiffAnterior = parsedPeso > 0 && prevPeso ? Number((parsedPeso - prevPeso).toFixed(3)) : 0;
  const liveDiffInicial = parsedPeso > 0 && initialPeso ? Number((parsedPeso - initialPeso).toFixed(3)) : 0;
  const liveIMC = parsedPeso > 0 ? calculateIMC(parsedPeso, profile.alturaMetros) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedPeso || parsedPeso <= 20 || parsedPeso >= 350) {
      setFeedback({
        type: 'error',
        message: 'Por favor, insira um peso válido em kg (ex: 113,250).',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    const finalContexto = contexto === 'Outro (descrever nas observações)' && customContexto.trim()
      ? customContexto.trim()
      : contexto;

    try {
      const result = await onSubmit({
        data,
        diaSemana,
        contexto: finalContexto,
        peso: parsedPeso,
        observacoes: observacoes.trim(),
      });

      if (result.success) {
        setFeedback({
          type: 'success',
          message: `Peso de ${formatBRNumber(parsedPeso, 3)} kg registrado com sucesso! (${result.source === 'cloud' ? 'Google Sheets sincronizado' : 'Salvo localmente'})`,
        });
        setPesoInput('');
        setObservacoes('');
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Erro ao registrar peso. Tente novamente.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha na comunicação com o servidor.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
          <Scale className="w-6 h-6 text-emerald-400" />
          Lançamento Rápido de Peso
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Registro em tempo real enviado diretamente para a aba <code className="text-emerald-300">Registro de Peso</code> da planilha.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-sm">{feedback.message}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Data (DD/MM/AAAA)
            </label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="DD/MM/AAAA"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              required
            />
          </div>

          {/* Dia da Semana */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Dia da Semana
            </label>
            <input
              type="text"
              value={diaSemana}
              readOnly
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Horário / Contexto */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Horário / Contexto da Pesagem
          </label>
          <select
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
          >
            {CONTEXT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {contexto === 'Outro (descrever nas observações)' && (
            <input
              type="text"
              value={customContexto}
              onChange={(e) => setCustomContexto(e.target.value)}
              placeholder="Especifique o contexto (ex: Meio da tarde, após sauna...)"
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          )}
        </div>

        {/* Peso (kg) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            Peso Corporal (kg)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ex: 113,250 ou 113.25"
              className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
              required
              autoFocus
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
              kg
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dica: Aceita vírgula ou ponto (padrão brasileiro será gravado na planilha: <code className="text-emerald-300">113,250</code>).
          </p>
        </div>

        {/* Live Calculation Preview Card */}
        {parsedPeso > 0 && (
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pré-visualização dos Cálculos Automáticos
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
                <span className="text-[11px] text-slate-400 block">Var. vs. Anterior</span>
                <span
                  className={`text-sm font-bold ${
                    liveDiffAnterior < 0
                      ? 'text-emerald-400'
                      : liveDiffAnterior > 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {liveDiffAnterior > 0 ? `+${formatBRNumber(liveDiffAnterior, 3)}` : formatBRNumber(liveDiffAnterior, 3)} kg
                </span>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
                <span className="text-[11px] text-slate-400 block">Var. vs. Inicial</span>
                <span
                  className={`text-sm font-bold ${
                    liveDiffInicial < 0
                      ? 'text-emerald-400'
                      : liveDiffInicial > 0
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {liveDiffInicial > 0 ? `+${formatBRNumber(liveDiffInicial, 3)}` : formatBRNumber(liveDiffInicial, 3)} kg
                </span>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/40">
                <span className="text-[11px] text-slate-400 block">IMC Calculado</span>
                <span className="text-sm font-bold text-white block">
                  {liveIMC ? formatBRNumber(liveIMC.imc, 2) : '-'}
                </span>
                <span className={`text-[10px] ${liveIMC?.cor}`}>
                  {liveIMC?.classificacao}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            placeholder="Ex: Após treino pesado de pernas, ingestão moderada de água..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Gravando na Planilha...
            </span>
          ) : (
            <>
              <Scale className="w-5 h-5" />
              Salvar Registro de Peso
            </>
          )}
        </button>
      </form>
    </div>
  );
};
