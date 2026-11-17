import React, { useState } from 'react';
import { Camera, Calendar, Upload, FileText, CheckCircle2, AlertCircle, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { PhotoRecord } from '../types';
import { getTodayBR } from '../utils/formatters';

interface PhotoFormProps {
  photos: PhotoRecord[];
  onSubmit: (payload: {
    semana: string;
    data: string;
    fotoFrenteBase64?: string;
    fotoLadoBase64?: string;
    fotoCostaBase64?: string;
    observacoes?: string;
  }) => Promise<{ success: boolean; source: string; links?: any; error?: string }>;
  onSuccess: () => void;
}

export const PhotoForm: React.FC<PhotoFormProps> = ({
  photos,
  onSubmit,
  onSuccess,
}) => {
  const nextWeekNumber = photos.length + 1;
  const [semana, setSemana] = useState<string>(`Semana ${nextWeekNumber}`);
  const [data, setData] = useState<string>(getTodayBR());
  const [observacoes, setObservacoes] = useState<string>('');

  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoLado, setFotoLado] = useState<string | null>(null);
  const [fotoCosta, setFotoCosta] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, position: 'frente' | 'lado' | 'costa') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        if (position === 'frente') setFotoFrente(base64);
        if (position === 'lado') setFotoLado(base64);
        if (position === 'costa') setFotoCosta(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoFrente && !fotoLado && !fotoCosta) {
      setFeedback({
        type: 'error',
        message: 'Por favor, selecione ao menos uma foto (Frente, Lado ou Costa) para enviar.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await onSubmit({
        semana,
        data,
        fotoFrenteBase64: fotoFrente || undefined,
        fotoLadoBase64: fotoLado || undefined,
        fotoCostaBase64: fotoCosta || undefined,
        observacoes: observacoes.trim(),
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Fotos enviadas para o Google Drive e registradas na aba Fotos da planilha!',
        });
        setTimeout(() => onSuccess(), 1200);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao enviar fotos para o Google Drive.',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Falha ao salvar fotos.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <Camera className="w-6 h-6 text-purple-400" />
          Fotos Semanais de Acompanhamento (Google Drive)
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Envie suas fotos de evolução (Frente, Lado e Costa). Elas serão salvas na pasta <code className="text-purple-300">Acompanhamento Corporal - Fotos</code> no seu Google Drive e linkadas na aba <code className="text-purple-300">Fotos</code>.
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

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              Identificação da Semana
            </label>
            <input
              type="text"
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              placeholder="Ex: Semana 1, Semana 2..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Data das Fotos (DD/MM/AAAA)
            </label>
            <input
              type="text"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium text-sm"
              required
            />
          </div>
        </div>

        {/* 3 Photo Upload Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Foto Frente */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Foto de Frente
            </span>
            <div className="w-full aspect-[3/4] bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative">
              {fotoFrente ? (
                <img src={fotoFrente} alt="Frente" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 p-2">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-[11px]">Nenhuma foto selecionada</span>
                </div>
              )}
            </div>
            <label className="w-full cursor-pointer px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{fotoFrente ? 'Trocar Foto' : 'Escolher Foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'frente')}
              />
            </label>
          </div>

          {/* Foto Lado */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              2. Foto de Lado / Perfil
            </span>
            <div className="w-full aspect-[3/4] bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative">
              {fotoLado ? (
                <img src={fotoLado} alt="Lado" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 p-2">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-[11px]">Nenhuma foto selecionada</span>
                </div>
              )}
            </div>
            <label className="w-full cursor-pointer px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{fotoLado ? 'Trocar Foto' : 'Escolher Foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'lado')}
              />
            </label>
          </div>

          {/* Foto Costa */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Foto de Costa
            </span>
            <div className="w-full aspect-[3/4] bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative">
              {fotoCosta ? (
                <img src={fotoCosta} alt="Costa" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-500 p-2">
                  <ImageIcon className="w-8 h-8 mb-1" />
                  <span className="text-[11px]">Nenhuma foto selecionada</span>
                </div>
              )}
            </div>
            <label className="w-full cursor-pointer px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{fotoCosta ? 'Trocar Foto' : 'Escolher Foto'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'costa')}
              />
            </label>
          </div>
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Observações da Semana
          </label>
          <input
            type="text"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: Mesma iluminação e horário da manhã, sem retenção aparente..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-purple-700/30 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando Fotos para o Google Drive & Planilha...
            </span>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Salvar Fotos Semanais
            </>
          )}
        </button>
      </form>

      {/* Galeria de Fotos Existentes */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          Galeria de Semanas Registradas ({photos.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((p, idx) => (
            <div key={p.id || idx} className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300">{p.semana}</span>
                <span className="text-[11px] text-slate-400">{p.data}</span>
              </div>
              <p className="text-xs text-slate-400 truncate">{p.observacoes || 'Sem observações'}</p>

              <div className="grid grid-cols-3 gap-1 pt-1">
                {p.fotoFrente ? (
                  <a href={p.fotoFrente} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 truncate">
                    Frente <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500">Sem frente</span>
                )}
                {p.fotoLado ? (
                  <a href={p.fotoLado} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 truncate">
                    Lado <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500">Sem lado</span>
                )}
                {p.fotoCosta ? (
                  <a href={p.fotoCosta} target="_blank" rel="noopener noreferrer" className="text-[10px] text-purple-400 hover:underline flex items-center gap-0.5 truncate">
                    Costa <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-500">Sem costa</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
