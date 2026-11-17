import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Calendar,
  Clock,
  MapPin,
  Route,
  Flame,
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { CardioRecord, WeightRecord } from '../types';
import {
  getTodayBR,
  getDayOfWeekBR,
  parseBRNumber,
  formatBRNumber,
  estimateWorkoutCalories,
  cleanDurationString,
} from '../utils/formatters';
import { extractFromPrint } from '../services/api';

interface CardioFormProps {
  latestWeight?: WeightRecord;
  onSubmit: (record: CardioRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

const MODALIDADES_CARDIO = [
  'Caminhada',
  'Corrida',
  'Ciclismo / Bike',
  'Esteira',
];

export const CardioForm: React.FC<CardioFormProps> = ({
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
  const [observacoes, setObservacoes] = useState<string>('Caminhada ao entardecer registrada no Strava (ritmo médio ~10,3 min/km)');

  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDiaSemana(getDayOfWeekBR(data));
  }, [data]);

  // Recalcula calorias estimadas quando modalidade, peso, duração, distância ou elevação mudam
  const handleAutoEstimateCalories = () => {
    const dist = parseBRNumber(distanciaKm) || 0;
    const elev = parseBRNumber(elevacaoM) || 0;
    const est = estimateWorkoutCalories(modalidade, currentWeightKg, tempoMovimento, dist, elev);
    if (est > 0) {
      setCalorias(String(Math.round(est)));
    }
  };

  // OCR Print Upload ou Colagem
  const processImageForOCR = async (base64Image: string) => {
    setOcrLoading(true);
    setFeedback(null);
    try {
      const res = await extractFromPrint(base64Image, 'cardio');
      if (res.success && res.data) {
        const d = res.data;
        if (d.data) setData(d.data);
        if (d.horario) setContexto(d.horario);
        if (d.modalidade) {
          const mod = d.modalidade.toLowerCase();
          if (mod.includes('cicl') || mod.includes('bike')) setModalidade('Ciclismo / Bike');
          else if (mod.includes('corr')) setModalidade('Corrida');
          else if (mod.includes('esteira')) setModalidade('Esteira');
          else setModalidade('Caminhada');
        }
        if (d.local) setLocal(d.local);
        if (d.distanciaKm) setDistanciaKm(formatBRNumber(d.distanciaKm, 2));
        if (d.tempoMovimento) setTempoMovimento(cleanDurationString(d.tempoMovimento));
        if (d.passos !== undefined && d.passos !== null) setPassos(String(d.passos));
        else if (d.modalidade && (d.modalidade.includes('Bike') || d.modalidade.includes('Ciclismo'))) setPassos('');
        if (d.elevacaoM !== undefined && d.elevacaoM !== null) setElevacaoM(String(d.elevacaoM));
        if (d.calorias) setCalorias(String(d.calorias));
        if (d.observacoes) setObservacoes(d.observacoes);

        // Se o print não trouxe calorias, calcula automaticamente
        if (!d.calorias && d.tempoMovimento) {
          const dist = d.distanciaKm || 0;
          const elev = d.elevacaoM || 0;
          const est = estimateWorkoutCalories(d.modalidade || modalidade, currentWeightKg, d.tempoMovimento, dist, elev);
          if (est > 0) setCalorias(String(Math.round(est)));
        }

        setFeedback({
          type: 'success',
          message: 'Dados de cardio extraídos com sucesso via Gemini Vision! Revise e clique em Confirmar.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Não foi possível ler o print de cardio. Preencha os campos manualmente.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao processar imagem via Gemini OCR.',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        processImageForOCR(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Suporte a Ctrl + V (colar print)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              processImageForOCR(base64);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentWeightKg, modalidade]);

  // Abre modal de confirmação antes de salvar
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Confirmação final e gravação
  const handleConfirmSave = async () => {
    setLoading(true);
    setFeedback(null);

    const record: CardioRecord = {
      data,
      diaSemana,
      contexto,
      modalidade,
      local,
      distanciaKm: parseBRNumber(distanciaKm) || 0,
      tempoMovimento: cleanDurationString(tempoMovimento),
      passos: passos ? parseInt(passos, 10) : undefined,
      elevacaoM: elevacaoM ? parseBRNumber(elevacaoM) : undefined,
      calorias: calorias ? parseBRNumber(calorias) : 0,
      observacoes,
    };

    try {
      const res = await onSubmit(record);
      if (res.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Atividade de Cardio gravada com sucesso! (${res.source === 'cloud' ? 'Cloudflare / Sheets' : 'Modo Seguro'})`,
        });
        setTimeout(() => onSuccess(), 1500);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao registrar atividade de cardio.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro de comunicação ao salvar treino de cardio.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900/80 via-slate-850 to-slate-900 border border-sky-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Lançar Atividade Aeróbica (Cardio)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Caminhada, Corrida, Ciclismo / Bike e Esteira • Leitura com IA ou inserção manual
            </p>
          </div>
        </div>
      </div>

      {/* OCR Drag-and-Drop or Paste Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-slate-850/60 hover:bg-slate-800/80 rounded-2xl p-6 text-center cursor-pointer transition group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          {ocrLoading ? (
            <>
              <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
              <p className="text-sm font-semibold text-sky-300">
                Lendo print do Strava / Bike com Gemini Vision...
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-sky-500/20 text-sky-400 rounded-full group-hover:scale-110 transition">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Clique para enviar ou cole o print do treino (<span className="text-sky-400 font-mono">Ctrl + V</span>)
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                O Gemini Vision lê automaticamente distância, tempo, elevação, passos e detalhes de bike (velocidades e acompanhantes).
              </p>
            </>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handlePreSubmit} className="bg-slate-850 border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Data */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              Data
            </label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="DD/MM/AAAA"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Dia da Semana */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Dia da Semana
            </label>
            <input
              type="text"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-300 text-sm focus:outline-none"
            />
          </div>

          {/* Horário / Contexto */}
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Modalidade & Local */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
              Modalidade
            </label>
            <select
              value={modalidade}
              onChange={(e) => {
                setModalidade(e.target.value);
                handleAutoEstimateCalories();
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none cursor-pointer"
            >
              {MODALIDADES_CARDIO.map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              Local / Origem
            </label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Strava • Bariri, SP"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Métricas: Distância, Tempo, Passos, Elevação */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-sky-400" />
              Distância (km)
            </label>
            <input
              type="text"
              value={distanciaKm}
              onChange={(e) => {
                setDistanciaKm(e.target.value);
                handleAutoEstimateCalories();
              }}
              placeholder="Ex: 5,70"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sky-300 font-bold text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Tempo (HH:MM:SS)
            </label>
            <input
              type="text"
              value={tempoMovimento}
              onChange={(e) => {
                setTempoMovimento(e.target.value);
                handleAutoEstimateCalories();
              }}
              placeholder="00:58:43"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Passos {modalidade.includes('Bike') ? '(Opcional/Bike)' : ''}
            </label>
            <input
              type="text"
              value={passos}
              onChange={(e) => setPassos(e.target.value)}
              placeholder="Ex: 6944"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Elevação (m)
            </label>
            <input
              type="text"
              value={elevacaoM}
              onChange={(e) => {
                setElevacaoM(e.target.value);
                handleAutoEstimateCalories();
              }}
              placeholder="Ex: 51"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Calorias Estimadas */}
        <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Gasto Calórico Estimado (kcal)
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Calculado com base no peso atual ({formatBRNumber(currentWeightKg, 3)} kg), ritmo e elevação.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={calorias}
              onChange={(e) => setCalorias(e.target.value)}
              className="w-28 bg-slate-850 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-300 font-black text-lg text-center"
            />
            <button
              type="button"
              onClick={handleAutoEstimateCalories}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition"
            >
              Recalcular
            </button>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações (velocidades, companheiros, ritmo, etc.)
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Ritmo médio 10:18 min/km, com fulano, velocidade máx 32 km/h..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Submit Button -> abre modal de revisão */}
        <button
          type="submit"
          disabled={loading || ocrLoading}
          className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Eye className="w-4 h-4" />
          Revisar e Confirmar Lançamento de Cardio
        </button>
      </form>

      {/* Modal de Revisão e Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-850 border border-sky-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-sky-400" />
                Confirmar Lançamento de Cardio
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Revise os dados antes de gravar na aba <strong>"Cardio"</strong> da planilha Google Sheets:
            </p>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Data / Horário:</span>
                <span className="font-semibold text-white">{data} • {contexto} ({diaSemana})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modalidade:</span>
                <span className="font-bold text-sky-400">{modalidade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Local / Origem:</span>
                <span className="text-white">{local}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Distância / Duração:</span>
                <span className="font-bold text-white">{distanciaKm} km • {tempoMovimento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Passos / Elevação:</span>
                <span className="text-white">{passos || '-'} passos • {elevacaoM || '0'} m</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-amber-400 font-semibold">Gasto Calórico Estimado:</span>
                <span className="font-black text-amber-300 text-sm">{calorias} kcal</span>
              </div>
              {observacoes && (
                <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Obs:</span> {observacoes}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Voltar e Editar
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={loading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmar e Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
