import React, { useState, useEffect, useRef } from 'react';
import {
  Dumbbell,
  Calendar,
  Clock,
  Activity,
  FileText,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  X,
  Flame,
} from 'lucide-react';
import { WorkoutRecord, WeightRecord } from '../types';
import { getTodayBR, getDayOfWeekBR, estimateGymCalories } from '../utils/formatters';
import { extractFromPrint } from '../services/api';

interface WorkoutFormProps {
  latestWeight?: WeightRecord;
  onSubmit: (record: WorkoutRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

const FOCOS_COMUNS = [
  'Peitoral / Tríceps',
  'Costas / Bíceps',
  'Pernas / Quadríceps',
  'Posterior de Coxa / Glúteo',
  'Ombros / Trapézio',
  'Braços (Bíceps / Tríceps)',
  'Full Body',
  'Abdômen / Core',
  'Outro',
];

export const WorkoutForm: React.FC<WorkoutFormProps> = ({ latestWeight, onSubmit, onSuccess }) => {
  const userWeight = latestWeight?.peso || 111.75;
  const [data, setData] = useState<string>(getTodayBR());
  const [diaSemana, setDiaSemana] = useState<string>(getDayOfWeekBR());
  const [contexto, setContexto] = useState<string>('Academia Fast fit');
  const [focoDivisao, setFocoDivisao] = useState<string>('Peitoral / Tríceps');
  const [duracaoMin, setDuracaoMin] = useState<string>('55');
  const [esforcoPse, setEsforcoPse] = useState<string>('8');
  const [calorias, setCalorias] = useState<string>('348');
  const [exerciciosCargas, setExerciciosCargas] = useState<string>(
    'Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50); Crucifixo na polia - 3 séries (7.5); Tríceps francês - 3 séries; Tríceps corda - 3 séries (17.5); Tríceps testa com halteres - 3 séries'
  );
  const [observacoes, setObservacoes] = useState<string>(
    '7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...'
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalcula gasto calórico automaticamente quando a duração ou foco muscular mudam
  const handleAutoEstimateCalories = () => {
    const dur = parseInt(duracaoMin, 10);
    if (dur > 0) {
      const est = estimateGymCalories(dur, userWeight, 8, focoDivisao);
      setCalorias(String(est));
    }
  };

  useEffect(() => {
    handleAutoEstimateCalories();
  }, [duracaoMin, focoDivisao]);

  useEffect(() => {
    setDiaSemana(getDayOfWeekBR(data));
  }, [data]);

  // OCR de prints de treino finalizado na academia
  const processImageForOCR = async (base64Image: string) => {
    setOcrLoading(true);
    setFeedback(null);
    try {
      const res = await extractFromPrint(base64Image, 'workout');
      if (res.success && res.data) {
        const d = res.data;
        if (d.data) setData(d.data);
        if (d.contexto) setContexto(d.contexto);
        if (d.focoDivisao) setFocoDivisao(d.focoDivisao);
        if (d.exerciciosCargas) setExerciciosCargas(d.exerciciosCargas);
        if (d.observacoes) setObservacoes(d.observacoes);

        setFeedback({
          type: 'success',
          message: 'Treino de academia extraído com sucesso! Divisão muscular isolada e exercícios estruturados. Revise e confirme.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Não foi possível ler o print de musculação. Preencha os campos manualmente.',
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
  }, []);

  // Abre modal de revisão e confirmação
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  // Grava definitivamente
  const handleConfirmSave = async () => {
    setLoading(true);
    setFeedback(null);

    const pseNum = esforcoPse ? parseInt(esforcoPse, 10) : undefined;
    let finalObs = observacoes;
    if (pseNum && !finalObs.includes('PSE')) {
      finalObs = finalObs ? `${finalObs} • PSE: ${pseNum}/10` : `PSE: ${pseNum}/10`;
    }

    const record: WorkoutRecord = {
      data,
      diaSemana,
      contexto,
      focoDivisao,
      duracaoMin: duracaoMin ? parseInt(duracaoMin, 10) : undefined,
      exerciciosCargas,
      calorias: calorias ? parseInt(calorias, 10) : undefined,
      esforcoPse: pseNum,
      observacoes: finalObs,
    };

    try {
      const res = await onSubmit(record);
      if (res.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Treino de Musculação gravado com sucesso! (${res.source === 'cloud' ? 'Cloudflare / Sheets' : 'Modo Seguro'})`,
        });
        setTimeout(() => onSuccess(), 1500);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao registrar treino de musculação.',
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro de comunicação ao salvar treino.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/80 via-slate-850 to-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Lançar Treino de Musculação (Academia)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Divisão muscular, exercícios, séries e cargas • Extração inteligente de print ou digitação
            </p>
          </div>
        </div>
      </div>

      {/* OCR Drag-and-Drop or Paste Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-slate-850/60 hover:bg-slate-800/80 rounded-2xl p-6 text-center cursor-pointer transition group"
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
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-sm font-semibold text-purple-300">
                Lendo print de treino finalizado com Gemini Vision...
              </p>
            </>
          ) : (
            <>
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-full group-hover:scale-110 transition">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                Clique para enviar ou cole o print do treino da academia (<span className="text-purple-400 font-mono">Ctrl + V</span>)
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                O Gemini Vision identifica a divisão muscular (ex: Peitoral / Tríceps), separa os exercícios e cargas, e move o nome da rotina para observações.
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
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Data
            </label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="DD/MM/AAAA"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm focus:border-purple-500 focus:outline-none"
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
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Horário / Contexto
            </label>
            <input
              type="text"
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Ex: Academia Fast fit"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Foco / Divisão Muscular & Duração & Esforço (PSE) & Calorias */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Foco / Divisão
            </label>
            <input
              type="text"
              list="focos-list"
              value={focoDivisao}
              onChange={(e) => setFocoDivisao(e.target.value)}
              placeholder="Ex: Peitoral / Tríceps"
              required
              className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3.5 py-2.5 text-purple-300 font-bold text-sm focus:border-purple-500 focus:outline-none"
            />
            <datalist id="focos-list">
              {FOCOS_COMUNS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-400 mt-1">Apenas grupos musculares.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Duração (min)
            </label>
            <input
              type="number"
              value={duracaoMin}
              onChange={(e) => setDuracaoMin(e.target.value)}
              placeholder="Ex: 55"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">Opcional / editável.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              Esforço (PSE 1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={esforcoPse}
              onChange={(e) => setEsforcoPse(e.target.value)}
              placeholder="Ex: 8"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-1">Opcional (1 leve a 10 máx).</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Gasto Estimado (kcal)
            </label>
            <input
              type="number"
              value={calorias}
              onChange={(e) => setCalorias(e.target.value)}
              placeholder="Ex: 348"
              className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-amber-300 font-black text-sm focus:border-amber-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Fórmula MET ({userWeight}kg).</p>
          </div>
        </div>

        {/* Exercícios / Observações de Carga */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-purple-400" />
            Exercícios / Observações de Carga
          </label>
          <textarea
            rows={4}
            value={exerciciosCargas}
            onChange={(e) => setExerciciosCargas(e.target.value)}
            placeholder="Ex: Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50)..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none font-mono text-xs leading-relaxed"
          />
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações (total de exercícios, ficha/rotina)
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: 7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Submit Button -> abre modal de revisão */}
        <button
          type="submit"
          disabled={loading || ocrLoading}
          className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <Eye className="w-4 h-4" />
          Revisar e Confirmar Lançamento de Musculação
        </button>
      </form>

      {/* Modal de Revisão e Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-850 border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                Confirmar Treino de Musculação
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Revise os dados antes de salvar na aba <strong>"Treinos"</strong> da planilha Google Sheets:
            </p>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Data / Contexto:</span>
                <span className="font-semibold text-white">{data} • {contexto} ({diaSemana})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Foco / Divisão:</span>
                <span className="font-bold text-purple-400">{focoDivisao}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Duração:</span>
                <span className="font-semibold text-white">{duracaoMin ? `${duracaoMin} min` : 'Não informada'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  Gasto Calórico Estimado:
                </span>
                <span className="font-black text-amber-300 text-sm">{calorias || '0'} kcal</span>
              </div>
              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 block mb-1">Exercícios e Cargas:</span>
                <p className="font-mono text-[11px] text-slate-200 bg-slate-950 p-2.5 rounded-lg max-h-32 overflow-y-auto leading-relaxed">
                  {exerciciosCargas}
                </p>
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
