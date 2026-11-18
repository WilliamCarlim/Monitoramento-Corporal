import React, { useState, useEffect, useRef } from 'react';
import { Scale, Calendar, Clock, FileText, CheckCircle2, AlertCircle, Camera, Upload, Sparkles, Loader2, Check, X } from 'lucide-react';
import { WeightRecord, UserProfile } from '../types';
import { getTodayBR, getDayOfWeekBR, parseBRNumber, formatBRNumber, calculateIMC } from '../utils/formatters';
import { extractFromPrint } from '../services/api';

interface WeightFormProps {
  latestWeight?: WeightRecord;
  profile: UserProfile;
  onSubmit: (record: WeightRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

export const WeightForm: React.FC<WeightFormProps> = ({
  latestWeight,
  profile,
  onSubmit,
  onSuccess,
}) => {
  const [data, setData] = useState<string>(getTodayBR());
  const [diaSemana, setDiaSemana] = useState<string>(getDayOfWeekBR());
  const [contexto, setContexto] = useState<string>('Manhã 06:41');
  const [pesoInput, setPesoInput] = useState<string>('');

  // Bioimpedance fields
  const [gorduraPercent, setGorduraPercent] = useState<string>('35.2');
  const [pesoGordura, setPesoGordura] = useState<string>('39.4');
  const [massaMuscEsqPercent, setMassaMuscEsqPercent] = useState<string>('32.5');
  const [pesoMassaMuscEsq, setPesoMassaMuscEsq] = useState<string>('36.3');
  const [massaMuscularPercent, setMassaMuscularPercent] = useState<string>('62.1');
  const [pesoMassaMuscular, setPesoMassaMuscular] = useState<string>('69.5');
  const [aguaPercent, setAguaPercent] = useState<string>('48.6');
  const [pesoAgua, setPesoAgua] = useState<string>('54.4');
  const [gorduraVisceral, setGorduraVisceral] = useState<string>('26.0');
  const [metabolismo, setMetabolismo] = useState<string>('2126');
  const [imcApp, setImcApp] = useState<string>('36.1');
  const [alturaApp, setAlturaApp] = useState<string>('176');
  const [idadeApp, setIdadeApp] = useState<string>('33');
  const [melhorPeso30d, setMelhorPeso30d] = useState<string>('107.85');
  const [observacoes, setObservacoes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Process image for OCR
  const handleImageFile = async (file: File) => {
    setOcrLoading(true);
    setFeedback(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await extractFromPrint(base64, 'weight');
        if (res.success && res.data) {
          const d = res.data;
          if (d.peso) setPesoInput(String(d.peso));
          if (d.data) setData(d.data);
          if (d.horario) setContexto(d.horario);
          if (d.gorduraPercent) setGorduraPercent(String(d.gorduraPercent));
          if (d.pesoGordura) setPesoGordura(String(d.pesoGordura));
          if (d.massaMuscEsqPercent) setMassaMuscEsqPercent(String(d.massaMuscEsqPercent));
          if (d.pesoMassaMuscEsq) setPesoMassaMuscEsq(String(d.pesoMassaMuscEsq));
          if (d.massaMuscularPercent) setMassaMuscularPercent(String(d.massaMuscularPercent));
          if (d.pesoMassaMuscular) setPesoMassaMuscular(String(d.pesoMassaMuscular));
          if (d.aguaPercent) setAguaPercent(String(d.aguaPercent));
          if (d.pesoAgua) setPesoAgua(String(d.pesoAgua));
          if (d.gorduraVisceral) setGorduraVisceral(String(d.gorduraVisceral));
          if (d.metabolismo) setMetabolismo(String(d.metabolismo));
          if (d.imcApp) setImcApp(String(d.imcApp));
          if (d.alturaApp) setAlturaApp(String(d.alturaApp));
          if (d.idadeApp) setIdadeApp(String(d.idadeApp));
          if (d.melhorPeso30d) setMelhorPeso30d(String(d.melhorPeso30d));
          if (d.observacoes) setObservacoes(d.observacoes);

          setFeedback({
            type: 'success',
            message: '✨ Dados do print de bioimpedância extraídos com sucesso via Gemini Vision!',
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Não foi possível extrair dados da imagem. Preencha manualmente.',
          });
        }
        setOcrLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setOcrLoading(false);
      setFeedback({ type: 'error', message: 'Erro ao ler arquivo de imagem.' });
    }
  };

  // Support paste Ctrl+V
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedPeso || parsedPeso <= 30 || parsedPeso >= 350) {
      setFeedback({
        type: 'error',
        message: 'Por favor, insira um peso válido em kg (ex: 111,750).',
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setLoading(true);
    setFeedback(null);

    const record: WeightRecord = {
      data,
      diaSemana,
      contexto,
      peso: parsedPeso,
      variacaoAnterior: liveDiffAnterior,
      variacaoInicial: liveDiffInicial,
      imc: liveIMC?.imc || 0,
      gorduraPercent: parseBRNumber(gorduraPercent) || undefined,
      pesoGordura: parseBRNumber(pesoGordura) || undefined,
      massaMuscEsqPercent: parseBRNumber(massaMuscEsqPercent) || undefined,
      pesoMassaMuscEsq: parseBRNumber(pesoMassaMuscEsq) || undefined,
      massaMuscularPercent: parseBRNumber(massaMuscularPercent) || undefined,
      pesoMassaMuscular: parseBRNumber(pesoMassaMuscular) || undefined,
      aguaPercent: parseBRNumber(aguaPercent) || undefined,
      pesoAgua: parseBRNumber(pesoAgua) || undefined,
      gorduraVisceral: parseBRNumber(gorduraVisceral) || undefined,
      metabolismo: parseBRNumber(metabolismo) || undefined,
      imcApp: parseBRNumber(imcApp) || undefined,
      alturaApp: parseBRNumber(alturaApp) || undefined,
      idadeApp: parseBRNumber(idadeApp) || undefined,
      melhorPeso30d: parseBRNumber(melhorPeso30d) || undefined,
      observacoes: observacoes.trim(),
    };

    try {
      const res = await onSubmit(record);
      if (res.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Peso e bioimpedância salvos com sucesso na planilha!`,
        });
        setTimeout(() => onSuccess(), 1000);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao registrar peso.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao salvar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8" onPaste={handlePaste}>
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-emerald-400" />
          Lançamento de Peso & Bioimpedância Completa
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Grave todas as 22 métricas na aba <code className="text-emerald-300">Registro de Peso</code> da planilha e atualize os 8 cards em tempo real.
        </p>
      </div>

      {/* OCR Drag & Drop Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Leitura Automática de Print da Balança (Gemini Vision)
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  OCR IA
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Cole o print com <strong>Ctrl + V</strong> aqui ou selecione a imagem do app (Mi Fitness, Zepp, etc.) para autopreencher todos os campos.
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
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Analisando Print...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Carregar Print</span>
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Core fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
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
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Horário / Contexto
            </label>
            <input
              type="text"
              value={contexto}
              onChange={(e) => setContexto(e.target.value)}
              placeholder="Ex: Manhã 06:41"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm"
              required
            />
          </div>
        </div>

        {/* Peso principal */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-500/40">
          <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-400" />
            Peso Corporal (kg)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="decimal"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ex: 111,750 ou 113.250"
              className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl px-4 py-3 text-white text-xl font-bold pr-12"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">kg</span>
          </div>

          {parsedPeso > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Var. vs. Anterior</span>
                <span className={`text-xs font-bold ${liveDiffAnterior < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveDiffAnterior > 0 ? `+${formatBRNumber(liveDiffAnterior, 3)}` : formatBRNumber(liveDiffAnterior, 3)} kg
                </span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">Var. vs. Inicial</span>
                <span className={`text-xs font-bold ${liveDiffInicial < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveDiffInicial > 0 ? `+${formatBRNumber(liveDiffInicial, 3)}` : formatBRNumber(liveDiffInicial, 3)} kg
                </span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 block">IMC Calculado</span>
                <span className="text-xs font-bold text-white block">{liveIMC ? formatBRNumber(liveIMC.imc, 2) : '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bioimpedance Metrics Grid */}
        <div className="border border-slate-700/80 bg-slate-900/40 rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Métricas de Bioimpedância da Balança
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-amber-400 mb-1">Gordura (%)</label>
              <input
                type="text"
                value={gorduraPercent}
                onChange={(e) => setGorduraPercent(e.target.value)}
                placeholder="35.2"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Peso Gordura (kg)</label>
              <input
                type="text"
                value={pesoGordura}
                onChange={(e) => setPesoGordura(e.target.value)}
                placeholder="39.4"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-sky-400 mb-1">Massa Muscular (%)</label>
              <input
                type="text"
                value={massaMuscularPercent}
                onChange={(e) => setMassaMuscularPercent(e.target.value)}
                placeholder="62.1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Peso Músculo (kg)</label>
              <input
                type="text"
                value={pesoMassaMuscular}
                onChange={(e) => setPesoMassaMuscular(e.target.value)}
                placeholder="69.5"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">Massa Musc. Esq. (%)</label>
              <input
                type="text"
                value={massaMuscEsqPercent}
                onChange={(e) => setMassaMuscEsqPercent(e.target.value)}
                placeholder="32.5"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Peso Musc. Esq. (kg)</label>
              <input
                type="text"
                value={pesoMassaMuscEsq}
                onChange={(e) => setPesoMassaMuscEsq(e.target.value)}
                placeholder="36.3"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-cyan-400 mb-1">Água (%)</label>
              <input
                type="text"
                value={aguaPercent}
                onChange={(e) => setAguaPercent(e.target.value)}
                placeholder="48.6"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Peso Água (kg)</label>
              <input
                type="text"
                value={pesoAgua}
                onChange={(e) => setPesoAgua(e.target.value)}
                placeholder="54.4"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-rose-400 mb-1">Gordura Visceral</label>
              <input
                type="text"
                value={gorduraVisceral}
                onChange={(e) => setGorduraVisceral(e.target.value)}
                placeholder="26.0"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-purple-400 mb-1">Metabolismo Basal</label>
              <input
                type="text"
                value={metabolismo}
                onChange={(e) => setMetabolismo(e.target.value)}
                placeholder="2126"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">IMC do App</label>
              <input
                type="text"
                value={imcApp}
                onChange={(e) => setImcApp(e.target.value)}
                placeholder="36.1"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] text-emerald-400 mb-1">Melhor Peso 30d (kg)</label>
              <input
                type="text"
                value={melhorPeso30d}
                onChange={(e) => setMelhorPeso30d(e.target.value)}
                placeholder="107.85"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Aferição matinal em jejum antes de treinar..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Gravando na Planilha...
            </span>
          ) : (
            <>
              <Scale className="w-5 h-5" />
              Salvar Registro de Peso & Bioimpedância
            </>
          )}
        </button>
      </form>

      {/* Modal de Revisão e Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-850 border border-emerald-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Confirmar Pesagem & Bioimpedância
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Revise os valores extraídos/digitados antes de gravar na aba <strong>"Registro de Peso"</strong> da planilha Google Sheets:
            </p>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 border border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Data / Contexto:</span>
                <span className="font-semibold text-white">{data} • {contexto} ({diaSemana})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Peso Corporal:</span>
                <span className="text-lg font-black text-emerald-400">{formatBRNumber(parsedPeso, 3)} kg</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Variação vs Anterior / Inicial:</span>
                <span className="text-slate-200">
                  {liveDiffAnterior !== null && (liveDiffAnterior > 0 ? `+${formatBRNumber(liveDiffAnterior, 3)}` : `${formatBRNumber(liveDiffAnterior, 3)}`)} kg / {liveDiffInicial !== null && (liveDiffInicial > 0 ? `+${formatBRNumber(liveDiffInicial, 3)}` : `${formatBRNumber(liveDiffInicial, 3)}`)} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">IMC (Ref. {formatBRNumber(profile.alturaMetros || 1.76, 2)}m):</span>
                <span className="font-bold text-white">{liveIMC?.imc ? formatBRNumber(liveIMC.imc, 2) : '-'} ({liveIMC?.classificacao || '-'})</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div>
                  <span className="text-amber-400 font-medium">Gordura:</span>{' '}
                  <span className="text-white font-bold">{gorduraPercent}% ({pesoGordura} kg)</span>
                </div>
                <div>
                  <span className="text-teal-400 font-medium">Massa Musc.:</span>{' '}
                  <span className="text-white font-bold">{massaMuscularPercent}% ({pesoMassaMuscular} kg)</span>
                </div>
                <div>
                  <span className="text-blue-400 font-medium">Água:</span>{' '}
                  <span className="text-white font-bold">{aguaPercent}% ({pesoAgua} kg)</span>
                </div>
                <div>
                  <span className="text-red-400 font-medium">Gordura Visceral:</span>{' '}
                  <span className="text-white font-bold">{gorduraVisceral}</span>
                </div>
                <div>
                  <span className="text-purple-400 font-medium">Metabolismo Basal:</span>{' '}
                  <span className="text-white font-bold">{metabolismo} kcal</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Melhor Peso 30d:</span>{' '}
                  <span className="text-white font-bold">{melhorPeso30d} kg</span>
                </div>
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
