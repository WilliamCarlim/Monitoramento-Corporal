import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Calendar, Clock, MapPin, Route, Flame, FileText, Camera, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { WorkoutRecord, WeightRecord } from '../types';
import { getTodayBR, getDayOfWeekBR, parseBRNumber, formatBRNumber, estimateWorkoutCalories } from '../utils/formatters';
import { extractFromPrint } from '../services/api';

interface WorkoutFormProps {
  latestWeight?: WeightRecord;
  onSubmit: (record: WorkoutRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

const MODALIDADES = [
  'Caminhada',
  'Corrida',
  'Musculação / Academia',
  'Ciclismo / Pedal',
  'Natação',
  'Funcional / HIIT',
  'Outro',
];

export const WorkoutForm: React.FC<WorkoutFormProps> = ({
  latestWeight,
  onSubmit,
  onSuccess,
}) => {
  const currentWeightKg = latestWeight?.peso || 111.750;

  const [data, setData] = useState<string>(getTodayBR());
  const [diaSemana, setDiaSemana] = useState<string>(getDayOfWeekBR());
  const [contexto, setContexto] = useState<string>('Entardecer 18:12');
  const [modalidade, setModalidade] = useState<string>('Caminhada');
  const [local, setLocal] = useState<string>('Strava • Bariri, SP');
  const [distanciaKm, setDistanciaKm] = useState<string>('5.70');
  const [tempoMovimento, setTempoMovimento] = useState<string>('00:58:43');
  const [passos, setPassos] = useState<string>('6944');
  const [elevacaoM, setElevacaoM] = useState<string>('51');
  const [calorias, setCalorias] = useState<string>('470');
  const [observacoes, setObservacoes] = useState<string>('Caminhada pós-treino no ritmo de recuperação');

  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDiaSemana(getDayOfWeekBR(data));
  }, [data]);

  // Recalculate estimated calories when duration, distance, modality or elevation changes
  const handleAutoEstimateCalories = () => {
    const dist = parseBRNumber(distanciaKm);
    const elev = parseBRNumber(elevacaoM);
    const est = estimateWorkoutCalories(modalidade, currentWeightKg, tempoMovimento, dist, elev);
    if (est > 0) {
      setCalorias(String(est));
    }
  };

  // OCR Strava / App
  const handleImageFile = async (file: File) => {
    setOcrLoading(true);
    setFeedback(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await extractFromPrint(base64, 'workout');
        if (res.success && res.data) {
          const d = res.data;
          if (d.data) setData(d.data);
          if (d.horario) setContexto(d.horario);
          if (d.modalidade) setModalidade(d.modalidade);
          if (d.local) setLocal(d.local);
          if (d.distanciaKm) setDistanciaKm(String(d.distanciaKm));
          if (d.tempoMovimento) setTempoMovimento(String(d.tempoMovimento));
          if (d.passos) setPassos(String(d.passos));
          if (d.elevacaoM) setElevacaoM(String(d.elevacaoM));
          if (d.calorias) setCalorias(String(d.calorias));
          if (d.observacoes) setObservacoes(d.observacoes);

          // If calories not in print, estimate automatically
          if (!d.calorias && d.tempoMovimento) {
            const dist = parseBRNumber(d.distanciaKm || 0);
            const elev = parseBRNumber(d.elevacaoM || 0);
            const est = estimateWorkoutCalories(d.modalidade || 'Caminhada', currentWeightKg, d.tempoMovimento, dist, elev);
            setCalorias(String(est));
          }

          setFeedback({
            type: 'success',
            message: '✨ Dados do print do Strava extraídos com sucesso via Gemini Vision!',
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Não foi possível ler os dados do treino.',
          });
        }
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setOcrLoading(false);
      setFeedback({ type: 'error', message: 'Erro ao processar imagem.' });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const record: WorkoutRecord = {
      data,
      diaSemana,
      contexto,
      modalidade,
      local,
      distanciaKm: parseBRNumber(distanciaKm) || undefined,
      tempoMovimento,
      passos: parseBRNumber(passos) || undefined,
      elevacaoM: parseBRNumber(elevacaoM) || undefined,
      calorias: parseBRNumber(calorias) || undefined,
      observacoes: observacoes.trim(),
    };

    try {
      const res = await onSubmit(record);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Treino registrado com sucesso na aba Treinos!',
        });
        setTimeout(() => onSuccess(), 1000);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao registrar treino.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao salvar treino.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8" onPaste={handlePaste}>
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-6 h-6 text-sky-400" />
          Lançamento de Treinos & Atividades Físicas (Strava)
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Grave atividades na aba <code className="text-sky-300">Treinos</code> da planilha com cálculo automático de gasto calórico baseado no seu peso atual de <strong>{formatBRNumber(currentWeightKg, 3)} kg</strong>.
        </p>
      </div>

      {/* Strava OCR Banner */}
      <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Leitura Automática de Print do Strava (Gemini Vision)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Cole com <strong>Ctrl + V</strong> o print da sua atividade do Strava ou selecione a imagem para preencher distância, tempo, elevação e ritmo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              disabled={ocrLoading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analisando Treino...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Carregar Print Strava</span>
                </>
              )}
            </button>
          </div>
        </div>
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

      {/* Workout Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Data (DD/MM/AAAA)
            </label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm"
              required
            />
          </div>

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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Horário / Contexto
            </label>
            <input
              type="text"
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Ex: Entardecer 18:12"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-sky-400" />
              Modalidade do Treino
            </label>
            <select
              value={modalidade}
              onChange={(e) => {
                setModalidade(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
            >
              {MODALIDADES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Local / Origem do Treino
            </label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Strava • Bariri, SP"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="border border-sky-500/30 bg-sky-950/10 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-2">
              <Route className="w-4 h-4" />
              Métricas de Desempenho & Gasto Energético
            </h3>
            <button
              type="button"
              onClick={handleAutoEstimateCalories}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 underline"
            >
              Recalcular calorias pelo peso atual
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Distância (km)</label>
              <input
                type="text"
                value={distanciaKm}
                onChange={(e) => setDistanciaKm(e.target.value)}
                placeholder="5.70"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Tempo Movimento</label>
              <input
                type="text"
                value={tempoMovimento}
                onChange={(e) => setTempoMovimento(e.target.value)}
                placeholder="00:58:43"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Passos Totais</label>
              <input
                type="text"
                value={passos}
                onChange={(e) => setPassos(e.target.value)}
                placeholder="6944"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Elevação (m)</label>
              <input
                type="text"
                value={elevacaoM}
                onChange={(e) => setElevacaoM(e.target.value)}
                placeholder="51"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] text-amber-400 font-bold mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Gasto Estimado (kcal)
              </label>
              <input
                type="text"
                value={calorias}
                onChange={(e) => setCalorias(e.target.value)}
                placeholder="470"
                className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-amber-300 font-black text-sm"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações do Treino
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Caminhada pós-treino no ritmo de recuperação, hidratação constante..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gravando Treino na Planilha...
            </span>
          ) : (
            <>
              <Dumbbell className="w-5 h-5" />
              Salvar Treino na Planilha
            </>
          )}
        </button>
      </form>
    </div>
  );
};
