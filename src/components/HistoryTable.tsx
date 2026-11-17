import React, { useState } from 'react';
import { Scale, Ruler, HeartPulse, Dumbbell, Camera, Search, ExternalLink, Download } from 'lucide-react';
import { WeightRecord, MeasureRecord, CardioRecord, WorkoutRecord, PhotoRecord } from '../types';
import { formatBRNumber, cleanDurationString } from '../utils/formatters';
import { SPREADSHEET_ID } from '../services/api';

interface HistoryTableProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
  cardios: CardioRecord[];
  workouts: WorkoutRecord[];
  photos: PhotoRecord[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  weights,
  measures,
  cardios,
  workouts,
  photos,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'weights' | 'measures' | 'cardios' | 'workouts' | 'photos'>('weights');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredWeights = [...weights].reverse().filter((w) => {
    const term = searchTerm.toLowerCase();
    return (
      w.data.toLowerCase().includes(term) ||
      w.diaSemana.toLowerCase().includes(term) ||
      w.contexto.toLowerCase().includes(term) ||
      (w.observacoes && w.observacoes.toLowerCase().includes(term))
    );
  });

  const filteredMeasures = [...measures].reverse().filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.data.toLowerCase().includes(term) ||
      (m.observacoes && m.observacoes.toLowerCase().includes(term))
    );
  });

  const filteredCardios = [...cardios].reverse().filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.data.toLowerCase().includes(term) ||
      c.modalidade.toLowerCase().includes(term) ||
      c.local.toLowerCase().includes(term) ||
      (c.observacoes && c.observacoes.toLowerCase().includes(term))
    );
  });

  const filteredWorkouts = [...workouts].reverse().filter((w) => {
    const term = searchTerm.toLowerCase();
    return (
      w.data.toLowerCase().includes(term) ||
      w.focoDivisao.toLowerCase().includes(term) ||
      (w.exerciciosCargas && w.exerciciosCargas.toLowerCase().includes(term)) ||
      (w.observacoes && w.observacoes.toLowerCase().includes(term))
    );
  });

  const filteredPhotos = [...photos].reverse().filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.semana.toLowerCase().includes(term) ||
      p.data.toLowerCase().includes(term) ||
      (p.observacoes && p.observacoes.toLowerCase().includes(term))
    );
  });

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeSubTab === 'weights') {
      csvContent += 'Data;Dia da Semana;Horario / Contexto;Peso (kg);Variacao vs Anterior (kg);Variacao vs Inicial (kg);IMC;Gordura (%);Peso Gordura (kg);Massa Musc. Esqueletica (%);Peso Massa Musc. Esqueletica (kg);Massa Muscular (%);Peso Massa Muscular (kg);Agua (%);Peso Agua (kg);Gordura Visceral;Metabolismo (kcal/dia);IMC App;Altura App (cm);Idade App;Melhor Peso 30d (kg);Observacoes\r\n';
      filteredWeights.forEach((w) => {
        csvContent += `${w.data};${w.diaSemana};${w.contexto};${formatBRNumber(w.peso, 3)};${formatBRNumber(w.variacaoAnterior, 3)};${formatBRNumber(w.variacaoInicial, 3)};${formatBRNumber(w.imc, 2)};${formatBRNumber(w.gorduraPercent, 1)};${formatBRNumber(w.pesoGordura, 1)};${formatBRNumber(w.massaMuscEsqPercent, 1)};${formatBRNumber(w.pesoMassaMuscEsq, 1)};${formatBRNumber(w.massaMuscularPercent, 1)};${formatBRNumber(w.pesoMassaMuscular, 1)};${formatBRNumber(w.aguaPercent, 1)};${formatBRNumber(w.pesoAgua, 1)};${formatBRNumber(w.gorduraVisceral, 1)};${formatBRNumber(w.metabolismo, 0)};${formatBRNumber(w.imcApp, 1)};${w.alturaApp || ''};${w.idadeApp || ''};${formatBRNumber(w.melhorPeso30d, 2)};"${w.observacoes || ''}"\r\n`;
      });
    } else if (activeSubTab === 'measures') {
      csvContent += 'Data;Pescoco;Ombro;Torax;Cintura;Abdomen;Quadril;Braco Dir;Braco Esq;Antebraco Dir;Antebraco Esq;Coxa Dir;Coxa Esq;Panturrilha Dir;Panturrilha Esq;Observacoes\r\n';
      filteredMeasures.forEach((m) => {
        csvContent += `${m.data};${m.pescoco || ''};${m.ombro || ''};${m.torax || ''};${m.cintura || ''};${m.abdomen || ''};${m.quadril || ''};${m.bracoDir || ''};${m.bracoEsq || ''};${m.antebracoDir || ''};${m.antebracoEsq || ''};${m.coxaDir || ''};${m.coxaEsq || ''};${m.panturrilhaDir || ''};${m.panturrilhaEsq || ''};"${m.observacoes || ''}"\r\n`;
      });
    } else if (activeSubTab === 'cardios') {
      csvContent += 'Data;Dia da Semana;Horario / Contexto;Modalidade;Local / Origem;Distancia (km);Tempo de Movimentacao;Passos;Elevacao (m);Gasto Calorico Estimado (kcal);Observacoes\r\n';
      filteredCardios.forEach((c) => {
        csvContent += `${c.data};${c.diaSemana};${c.contexto};${c.modalidade};${c.local};${formatBRNumber(c.distanciaKm, 2)};${cleanDurationString(c.tempoMovimento)};${c.passos || ''};${c.elevacaoM || ''};${c.calorias || ''};"${c.observacoes || ''}"\r\n`;
      });
    } else if (activeSubTab === 'workouts') {
      csvContent += 'Data;Dia da Semana;Horario / Contexto;Foco / Divisao Muscular;Duracao (min);Exercicios / Observacoes de Carga;Esforco (PSE);Observacoes\r\n';
      filteredWorkouts.forEach((w) => {
        csvContent += `${w.data};${w.diaSemana};${w.contexto};${w.focoDivisao};${w.duracaoMin || ''};"${w.exerciciosCargas || ''}";${w.esforcoPse || ''};"${w.observacoes || ''}"\r\n`;
      });
    } else {
      csvContent += 'Semana;Data;Foto Frente;Foto Lado;Foto Costa;Observacoes\r\n';
      filteredPhotos.forEach((p) => {
        csvContent += `${p.semana};${p.data};"${p.fotoFrente || ''}";"${p.fotoLado || ''}";"${p.fotoCosta || ''}";"${p.observacoes || ''}"\r\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeSubTab}_acompanhamento_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            Histórico & Lançamentos da Planilha Oficial
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Visualize todos os registros sincronizados em tempo real com as 5 abas do Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>
          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir Google Sheets
          </a>
        </div>
      </div>

      {/* Sub Tabs Selector & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveSubTab('weights')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'weights'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Scale className="w-4 h-4" />
            Peso & Bioimpedância ({weights.length})
          </button>
          <button
            onClick={() => setActiveSubTab('measures')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'measures'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Medidas ({measures.length})
          </button>
          <button
            onClick={() => setActiveSubTab('cardios')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'cardios'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            Cardio ({cardios.length})
          </button>
          <button
            onClick={() => setActiveSubTab('workouts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'workouts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            Musculação ({workouts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('photos')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeSubTab === 'photos'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            Fotos ({photos.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por data, modalidade..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        {/* TAB 1: REGISTRO DE PESO E BIOIMPEDÂNCIA */}
        {activeSubTab === 'weights' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Horário / Contexto</th>
                  <th className="py-3 px-3 text-emerald-400 font-bold">Peso (kg)</th>
                  <th className="py-3 px-3">Var. Anterior</th>
                  <th className="py-3 px-3">Var. Inicial</th>
                  <th className="py-3 px-3">IMC</th>
                  <th className="py-3 px-3 text-amber-400">Gordura (%)</th>
                  <th className="py-3 px-3">Peso Gordura</th>
                  <th className="py-3 px-3 text-teal-400">Massa Musc. (%)</th>
                  <th className="py-3 px-3">Peso Musc.</th>
                  <th className="py-3 px-3 text-cyan-400">Água (%)</th>
                  <th className="py-3 px-3 text-rose-400">Visceral</th>
                  <th className="py-3 px-3 text-purple-400">Metabolismo</th>
                  <th className="py-3 px-3">IMC App</th>
                  <th className="py-3 px-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                {filteredWeights.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-500">
                      Nenhum registro de peso encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredWeights.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">{w.data}</td>
                      <td className="py-2.5 px-3 text-slate-400">{w.contexto}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">{formatBRNumber(w.peso, 3)} kg</td>
                      <td className="py-2.5 px-3">
                        {w.variacaoAnterior === undefined || w.variacaoAnterior === 0 ? (
                          <span className="text-slate-500">0,000 kg</span>
                        ) : w.variacaoAnterior > 0 ? (
                          <span className="text-rose-400 font-medium">+{formatBRNumber(w.variacaoAnterior, 3)} kg</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">{formatBRNumber(w.variacaoAnterior, 3)} kg</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {w.variacaoInicial === undefined || w.variacaoInicial === 0 ? (
                          <span className="text-slate-500">0,000 kg</span>
                        ) : w.variacaoInicial > 0 ? (
                          <span className="text-rose-400 font-medium">+{formatBRNumber(w.variacaoInicial, 3)} kg</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">{formatBRNumber(w.variacaoInicial, 3)} kg</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{w.imc ? formatBRNumber(w.imc, 2) : '-'}</td>
                      <td className="py-2.5 px-3 text-amber-300 font-semibold">{w.gorduraPercent ? `${formatBRNumber(w.gorduraPercent, 1)}%` : '-'}</td>
                      <td className="py-2.5 px-3">{w.pesoGordura ? `${formatBRNumber(w.pesoGordura, 1)} kg` : '-'}</td>
                      <td className="py-2.5 px-3 text-teal-300 font-semibold">{w.massaMuscularPercent ? `${formatBRNumber(w.massaMuscularPercent, 1)}%` : '-'}</td>
                      <td className="py-2.5 px-3">{w.pesoMassaMuscular ? `${formatBRNumber(w.pesoMassaMuscular, 1)} kg` : '-'}</td>
                      <td className="py-2.5 px-3 text-cyan-300">{w.aguaPercent ? `${formatBRNumber(w.aguaPercent, 1)}%` : '-'}</td>
                      <td className="py-2.5 px-3 text-rose-300">{w.gorduraVisceral ? formatBRNumber(w.gorduraVisceral, 1) : '-'}</td>
                      <td className="py-2.5 px-3 text-purple-300">{w.metabolismo ? `${formatBRNumber(w.metabolismo, 0)} kcal` : '-'}</td>
                      <td className="py-2.5 px-3 text-slate-400">{w.imcApp ? formatBRNumber(w.imcApp, 1) : '-'}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-400 max-w-sm truncate" title={w.observacoes}>{w.observacoes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: MEDIDAS CORPORAIS */}
        {activeSubTab === 'measures' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3 text-cyan-400 font-bold">Abdômen (cm)</th>
                  <th className="py-3 px-3 text-cyan-300 font-semibold">Cintura (cm)</th>
                  <th className="py-3 px-3 text-cyan-300 font-semibold">Quadril (cm)</th>
                  <th className="py-3 px-3">Tórax (cm)</th>
                  <th className="py-3 px-3">Pescoço (cm)</th>
                  <th className="py-3 px-3">Ombro (cm)</th>
                  <th className="py-3 px-3">Braço (D/E)</th>
                  <th className="py-3 px-3">Antebraço (D/E)</th>
                  <th className="py-3 px-3">Coxa (D/E)</th>
                  <th className="py-3 px-3">Panturrilha (D/E)</th>
                  <th className="py-3 px-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                {filteredMeasures.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-slate-500">
                      Nenhum registro de medidas encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredMeasures.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">{m.data}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{m.abdomen ? `${formatBRNumber(m.abdomen, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-cyan-300">{m.cintura ? `${formatBRNumber(m.cintura, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-cyan-300">{m.quadril ? `${formatBRNumber(m.quadril, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3">{m.torax ? `${formatBRNumber(m.torax, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3">{m.pescoco ? `${formatBRNumber(m.pescoco, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3">{m.ombro ? `${formatBRNumber(m.ombro, 1)} cm` : '-'}</td>
                      <td className="py-2.5 px-3">{m.bracoDir || m.bracoEsq ? `${formatBRNumber(m.bracoDir, 1)} / ${formatBRNumber(m.bracoEsq, 1)}` : '-'}</td>
                      <td className="py-2.5 px-3">{m.antebracoDir || m.antebracoEsq ? `${formatBRNumber(m.antebracoDir, 1)} / ${formatBRNumber(m.antebracoEsq, 1)}` : '-'}</td>
                      <td className="py-2.5 px-3">{m.coxaDir || m.coxaEsq ? `${formatBRNumber(m.coxaDir, 1)} / ${formatBRNumber(m.coxaEsq, 1)}` : '-'}</td>
                      <td className="py-2.5 px-3">{m.panturrilhaDir || m.panturrilhaEsq ? `${formatBRNumber(m.panturrilhaDir, 1)} / ${formatBRNumber(m.panturrilhaEsq, 1)}` : '-'}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-400 max-w-sm truncate" title={m.observacoes}>{m.observacoes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: CARDIO (STRAVA) */}
        {activeSubTab === 'cardios' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Dia</th>
                  <th className="py-3 px-3">Horário / Contexto</th>
                  <th className="py-3 px-3 text-sky-400 font-bold">Modalidade</th>
                  <th className="py-3 px-3">Local / Origem</th>
                  <th className="py-3 px-3 text-sky-300 font-bold">Distância (km)</th>
                  <th className="py-3 px-3">Tempo de Movimento</th>
                  <th className="py-3 px-3">Passos</th>
                  <th className="py-3 px-3">Elevação</th>
                  <th className="py-3 px-3 text-amber-400 font-bold">Gasto Estimado (kcal)</th>
                  <th className="py-3 px-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                {filteredCardios.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-500">
                      Nenhuma atividade de cardio registrada ainda.
                    </td>
                  </tr>
                ) : (
                  filteredCardios.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">{c.data}</td>
                      <td className="py-2.5 px-3 text-slate-400">{c.diaSemana}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.contexto}</td>
                      <td className="py-2.5 px-3 font-bold text-sky-400">
                        <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                          {c.modalidade}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{c.local}</td>
                      <td className="py-2.5 px-3 font-bold text-sky-300">{formatBRNumber(c.distanciaKm, 2)} km</td>
                      <td className="py-2.5 px-3 font-mono">{cleanDurationString(c.tempoMovimento)}</td>
                      <td className="py-2.5 px-3">{c.passos ? c.passos.toLocaleString('pt-BR') : '-'}</td>
                      <td className="py-2.5 px-3">{c.elevacaoM ? `${c.elevacaoM} m` : '-'}</td>
                      <td className="py-2.5 px-3 font-black text-amber-300">{c.calorias ? `${c.calorias.toLocaleString('pt-BR')} kcal` : '-'}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-400 max-w-sm truncate" title={c.observacoes}>{c.observacoes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: TREINOS - MUSCULAÇÃO (ACADEMIA) */}
        {activeSubTab === 'workouts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-3">Data</th>
                  <th className="py-3 px-3">Dia</th>
                  <th className="py-3 px-3">Horário / Contexto</th>
                  <th className="py-3 px-3 text-indigo-400 font-bold">Foco / Divisão Muscular</th>
                  <th className="py-3 px-3">Duração</th>
                  <th className="py-3 px-3">Esforço (PSE)</th>
                  <th className="py-3 px-3 text-slate-300 font-semibold">Exercícios / Séries / Cargas</th>
                  <th className="py-3 px-3">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 whitespace-nowrap">
                {filteredWorkouts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Nenhum treino de musculação registrado ainda.
                    </td>
                  </tr>
                ) : (
                  filteredWorkouts.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">{w.data}</td>
                      <td className="py-2.5 px-3 text-slate-400">{w.diaSemana}</td>
                      <td className="py-2.5 px-3 text-slate-300">{w.contexto}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-300">
                        <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {w.focoDivisao}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">{w.duracaoMin ? `${w.duracaoMin} min` : '-'}</td>
                      <td className="py-2.5 px-3">
                        {w.esforcoPse ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            w.esforcoPse >= 8 ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-slate-800 text-slate-200'
                          }`}>
                            PSE {w.esforcoPse}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-300 max-w-md truncate" title={w.exerciciosCargas}>
                        {w.exerciciosCargas || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-400 max-w-sm truncate" title={w.observacoes}>
                        {w.observacoes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: FOTOS (GOOGLE DRIVE) */}
        {activeSubTab === 'photos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-700 whitespace-nowrap">
                <tr>
                  <th className="py-3 px-4 font-bold text-purple-300">Semana</th>
                  <th className="py-3 px-4 font-semibold">Data</th>
                  <th className="py-3 px-4">Foto Frente (Drive)</th>
                  <th className="py-3 px-4">Foto Lado (Drive)</th>
                  <th className="py-3 px-4">Foto Costa (Drive)</th>
                  <th className="py-3 px-4">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPhotos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhum registro de fotos encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPhotos.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-purple-300">{p.semana}</td>
                      <td className="py-3 px-4 text-slate-300">{p.data}</td>
                      <td className="py-3 px-4">
                        {p.fotoFrente ? (
                          <a href={p.fotoFrente} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer">
                            Ver Frente <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.fotoLado ? (
                          <a href={p.fotoLado} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer">
                            Ver Lado <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {p.fotoCosta ? (
                          <a href={p.fotoCosta} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer">
                            Ver Costa <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-sm truncate" title={p.observacoes}>
                        {p.observacoes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};