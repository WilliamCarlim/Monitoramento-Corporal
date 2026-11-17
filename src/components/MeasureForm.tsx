import React, { useState, useRef } from 'react';
import { Ruler, Calendar, FileText, CheckCircle2, AlertCircle, Sparkles, Camera, Upload, Loader2, X, Check } from 'lucide-react';
import { MeasureRecord } from '../types';
import { getTodayBR, parseBRNumber } from '../utils/formatters';
import { extractFromPrint } from '../services/api';

interface MeasureFormProps {
  onSubmit: (record: MeasureRecord) => Promise<{ success: boolean; source: string; error?: string }>;
  onSuccess: () => void;
}

export const MeasureForm: React.FC<MeasureFormProps> = ({ onSubmit, onSuccess }) => {
  const [data, setData] = useState<string>(getTodayBR());

  // Core / Tronco
  const [abdomen, setAbdomen] = useState<string>('127');
  const [cintura, setCintura] = useState<string>('');
  const [quadril, setQuadril] = useState<string>('');
  const [torax, setTorax] = useState<string>('');

  // Superiores
  const [pescoco, setPescoco] = useState<string>('');
  const [ombro, setOmbro] = useState<string>('');
  const [bracoDir, setBracoDir] = useState<string>('');
  const [bracoEsq, setBracoEsq] = useState<string>('');
  const [antebracoDir, setAntebracoDir] = useState<string>('');
  const [antebracoEsq, setAntebracoEsq] = useState<string>('');

  // Inferiores
  const [coxaDir, setCoxaDir] = useState<string>('');
  const [coxaEsq, setCoxaEsq] = useState<string>('');
  const [panturrilhaDir, setPanturrilhaDir] = useState<string>('');
  const [panturrilhaEsq, setPanturrilhaEsq] = useState<string>('');

  // Context & Tool
  const [instrumento, setInstrumento] = useState<string>('Fita métrica flexível');
  const [respiracao, setRespiracao] = useState<string>('Respiração normal (relaxado)');
  const [observacoes, setObservacoes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    setOcrLoading(true);
    setFeedback(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await extractFromPrint(base64, 'measure');
        if (res.success && res.data) {
          const d = res.data;
          if (d.data) setData(d.data);
          if (d.abdomen) setAbdomen(String(d.abdomen));
          if (d.cintura) setCintura(String(d.cintura));
          if (d.quadril) setQuadril(String(d.quadril));
          if (d.torax) setTorax(String(d.torax));
          if (d.pescoco) setPescoco(String(d.pescoco));
          if (d.ombro) setOmbro(String(d.ombro));
          if (d.bracoDir) setBracoDir(String(d.bracoDir));
          if (d.bracoEsq) setBracoEsq(String(d.bracoEsq));
          if (d.antebracoDir) setAntebracoDir(String(d.antebracoDir));
          if (d.antebracoEsq) setAntebracoEsq(String(d.antebracoEsq));
          if (d.coxaDir) setCoxaDir(String(d.coxaDir));
          if (d.coxaEsq) setCoxaEsq(String(d.coxaEsq));
          if (d.panturrilhaDir) setPanturrilhaDir(String(d.panturrilhaDir));
          if (d.panturrilhaEsq) setPanturrilhaEsq(String(d.panturrilhaEsq));
          if (d.observacoes) setObservacoes(d.observacoes);

          setFeedback({
            type: 'success',
            message: '✨ Medidas corporais extraídas com sucesso via Gemini Vision!',
          });
        } else {
          setFeedback({
            type: 'error',
            message: res.error || 'Não foi possível ler as medidas da imagem.',
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

    const pAbdomen = parseBRNumber(abdomen);
    const pCintura = parseBRNumber(cintura);
    const pQuadril = parseBRNumber(quadril);
    const pTorax = parseBRNumber(torax);
    const pPescoco = parseBRNumber(pescoco);
    const pOmbro = parseBRNumber(ombro);
    const pBracoDir = parseBRNumber(bracoDir);
    const pBracoEsq = parseBRNumber(bracoEsq);
    const pAntebracoDir = parseBRNumber(antebracoDir);
    const pAntebracoEsq = parseBRNumber(antebracoEsq);
    const pCoxaDir = parseBRNumber(coxaDir);
    const pCoxaEsq = parseBRNumber(coxaEsq);
    const pPanturrilhaDir = parseBRNumber(panturrilhaDir);
    const pPanturrilhaEsq = parseBRNumber(panturrilhaEsq);

    const hasAnyMeasure = [
      pAbdomen, pCintura, pQuadril, pTorax, pPescoco, pOmbro,
      pBracoDir, pBracoEsq, pAntebracoDir, pAntebracoEsq,
      pCoxaDir, pCoxaEsq, pPanturrilhaDir, pPanturrilhaEsq
    ].some(v => v > 0);

    if (!hasAnyMeasure) {
      setFeedback({
        type: 'error',
        message: 'Preencha ao menos uma medida corporal para registrar.',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    const pAbdomen = parseBRNumber(abdomen);
    const pCintura = parseBRNumber(cintura);
    const pQuadril = parseBRNumber(quadril);
    const pTorax = parseBRNumber(torax);
    const pPescoco = parseBRNumber(pescoco);
    const pOmbro = parseBRNumber(ombro);
    const pBracoDir = parseBRNumber(bracoDir);
    const pBracoEsq = parseBRNumber(bracoEsq);
    const pAntebracoDir = parseBRNumber(antebracoDir);
    const pAntebracoEsq = parseBRNumber(antebracoEsq);
    const pCoxaDir = parseBRNumber(coxaDir);
    const pCoxaEsq = parseBRNumber(coxaEsq);
    const pPanturrilhaDir = parseBRNumber(panturrilhaDir);
    const pPanturrilhaEsq = parseBRNumber(panturrilhaEsq);

    setLoading(true);
    setFeedback(null);

    const fullObservacoes = [
      `[${instrumento} | ${respiracao}]`,
      observacoes.trim()
    ].filter(Boolean).join(' - ');

    try {
      const record: MeasureRecord = {
        data,
        abdomen: pAbdomen || undefined,
        cintura: pCintura || undefined,
        quadril: pQuadril || undefined,
        torax: pTorax || undefined,
        pescoco: pPescoco || undefined,
        ombro: pOmbro || undefined,
        bracoDir: pBracoDir || undefined,
        bracoEsq: pBracoEsq || undefined,
        antebracoDir: pAntebracoDir || undefined,
        antebracoEsq: pAntebracoEsq || undefined,
        coxaDir: pCoxaDir || undefined,
        coxaEsq: pCoxaEsq || undefined,
        panturrilhaDir: pPanturrilhaDir || undefined,
        panturrilhaEsq: pPanturrilhaEsq || undefined,
        observacoes: fullObservacoes,
      };

      const result = await onSubmit(record);

      if (result.success) {
        setShowConfirmModal(false);
        setFeedback({
          type: 'success',
          message: `Medidas registradas com sucesso na aba Medidas Corporais!`,
        });
        setTimeout(() => onSuccess(), 1000);
      } else {
        setFeedback({ type: 'error', message: result.error || 'Erro ao registrar medidas.' });
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
          <Ruler className="w-6 h-6 text-cyan-400" />
          Lançamento Rápido de Medidas Corporais
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Grave circunferências na aba <code className="text-cyan-300">Medidas Corporais</code> da planilha em cm.
        </p>
      </div>

      {/* OCR Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-sky-950/40 border border-cyan-500/40 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Leitura Automática de Print / Anotação (Gemini Vision)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Cole o print com <strong>Ctrl + V</strong> ou selecione imagem com anotações de medidas corporais.
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
              className="w-full sm:w-auto px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {ocrLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Extraindo Medidas...</span>
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

      <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="max-w-xs">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Data da Medição (DD/MM/AAAA)
          </label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm"
            required
          />
        </div>

        {/* Core & Tronco */}
        <div className="border border-cyan-500/20 bg-cyan-950/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            1. Core & Tronco (Circunferências Principais)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">
                Abdômen (cm) <span className="text-cyan-400">*umbigo</span>
              </label>
              <input
                type="text"
                value={abdomen}
                onChange={(e) => setAbdomen(e.target.value)}
                placeholder="127"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Cintura (cm)</label>
              <input
                type="text"
                value={cintura}
                onChange={(e) => setCintura(e.target.value)}
                placeholder="cm"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Quadril (cm)</label>
              <input
                type="text"
                value={quadril}
                onChange={(e) => setQuadril(e.target.value)}
                placeholder="cm"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Tórax (cm)</label>
              <input
                type="text"
                value={torax}
                onChange={(e) => setTorax(e.target.value)}
                placeholder="cm"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold text-sm"
              />
            </div>
          </div>
        </div>

        {/* Membros Superiores */}
        <div className="border border-slate-700/60 bg-slate-900/30 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            2. Membros Superiores & Pescoço
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pescoço (cm)</label>
              <input type="text" value={pescoco} onChange={(e) => setPescoco(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Ombro (cm)</label>
              <input type="text" value={ombro} onChange={(e) => setOmbro(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Braço Dir (cm)</label>
              <input type="text" value={bracoDir} onChange={(e) => setBracoDir(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Braço Esq (cm)</label>
              <input type="text" value={bracoEsq} onChange={(e) => setBracoEsq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Antebraço D</label>
              <input type="text" value={antebracoDir} onChange={(e) => setAntebracoDir(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Antebraço E</label>
              <input type="text" value={antebracoEsq} onChange={(e) => setAntebracoEsq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Membros Inferiores */}
        <div className="border border-slate-700/60 bg-slate-900/30 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            3. Membros Inferiores
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Coxa Dir (cm)</label>
              <input type="text" value={coxaDir} onChange={(e) => setCoxaDir(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Coxa Esq (cm)</label>
              <input type="text" value={coxaEsq} onChange={(e) => setCoxaEsq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Panturrilha Dir</label>
              <input type="text" value={panturrilhaDir} onChange={(e) => setPanturrilhaDir(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Panturrilha Esq</label>
              <input type="text" value={panturrilhaEsq} onChange={(e) => setPanturrilhaEsq(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Instrumento e Observações */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Instrumento Utilizado
              </label>
              <select
                value={instrumento}
                onChange={(e) => setInstrumento(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              >
                <option value="Fita métrica flexível (padrão-ouro)">Fita métrica flexível (padrão-ouro)</option>
                <option value="Trena metálica / fita retrátil">Trena metálica / fita retrátil</option>
                <option value="Outro instrumento">Outro instrumento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Estado de Respiração
              </label>
              <select
                value={respiracao}
                onChange={(e) => setRespiracao(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
              >
                <option value="Respiração normal (relaxado)">Respiração normal (relaxado)</option>
                <option value="Expiração forçada / sem fôlego">Expiração forçada / sem fôlego</option>
                <option value="Contração máxima">Contração máxima</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações
            </label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: medição preliminar com trena na altura do umbigo, soltando o ar até ficar sem fôlego; aguardando fita métrica"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando Medidas...
            </span>
          ) : (
            <>
              <Ruler className="w-5 h-5" />
              Salvar Registro de Medidas
            </>
          )}
        </button>
      </form>

      {/* Modal de Revisão e Confirmação */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-850 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                Confirmar Lançamento de Medidas
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Revise as medidas corporais antes de gravar na aba <strong>"Medidas Corporais"</strong> da planilha Google Sheets:
            </p>

            <div className="bg-slate-900 rounded-xl p-4 space-y-2.5 text-xs text-slate-300 border border-slate-800">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">Data de Medição:</span>
                <span className="font-semibold text-white">{data}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {abdomen && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Abdômen:</span> <span className="font-bold text-white">{abdomen} cm</span>
                  </div>
                )}
                {cintura && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Cintura:</span> <span className="font-bold text-white">{cintura} cm</span>
                  </div>
                )}
                {quadril && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Quadril:</span> <span className="font-bold text-white">{quadril} cm</span>
                  </div>
                )}
                {torax && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Tórax:</span> <span className="font-bold text-white">{torax} cm</span>
                  </div>
                )}
                {pescoco && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Pescoço:</span> <span className="font-bold text-white">{pescoco} cm</span>
                  </div>
                )}
                {ombro && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Ombro:</span> <span className="font-bold text-white">{ombro} cm</span>
                  </div>
                )}
                {bracoDir && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Braço Dir:</span> <span className="font-bold text-white">{bracoDir} cm</span>
                  </div>
                )}
                {bracoEsq && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Braço Esq:</span> <span className="font-bold text-white">{bracoEsq} cm</span>
                  </div>
                )}
                {antebracoDir && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Antebraço D:</span> <span className="font-bold text-white">{antebracoDir} cm</span>
                  </div>
                )}
                {antebracoEsq && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Antebraço E:</span> <span className="font-bold text-white">{antebracoEsq} cm</span>
                  </div>
                )}
                {coxaDir && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Coxa Dir:</span> <span className="font-bold text-white">{coxaDir} cm</span>
                  </div>
                )}
                {coxaEsq && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Coxa Esq:</span> <span className="font-bold text-white">{coxaEsq} cm</span>
                  </div>
                )}
                {panturrilhaDir && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Panturrilha D:</span> <span className="font-bold text-white">{panturrilhaDir} cm</span>
                  </div>
                )}
                {panturrilhaEsq && (
                  <div>
                    <span className="text-cyan-400 font-semibold">Panturrilha E:</span> <span className="font-bold text-white">{panturrilhaEsq} cm</span>
                  </div>
                )}
              </div>
              <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-400">
                <span className="text-slate-300 font-medium">Método:</span> {instrumento} • {respiracao}
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
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
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
