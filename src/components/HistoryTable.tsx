import React, { useState } from 'react';
import { Scale, Ruler, Search, ExternalLink, Download } from 'lucide-react';
import { WeightRecord, MeasureRecord } from '../types';
import { formatBRNumber } from '../utils/formatters';
import { SPREADSHEET_ID } from '../services/api';

interface HistoryTableProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ weights, measures }) => {
  const [activeSubTab, setActiveSubTab] = useState<'weights' | 'measures'>('weights');
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

  const exportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (activeSubTab === 'weights') {
      csvContent += 'Data;Dia da Semana;Horario / Contexto;Peso (kg);Variacao vs Anterior (kg);Variacao vs Inicial (kg);IMC;Observacoes\r\n';
      filteredWeights.forEach((w) => {
        csvContent += `${w.data};${w.diaSemana};${w.contexto};${formatBRNumber(w.peso, 3)};${formatBRNumber(w.variacaoAnterior, 3)};${formatBRNumber(w.variacaoInicial, 3)};${formatBRNumber(w.imc, 2)};"${w.observacoes || ''}"\r\n`;
      });
    } else {
      csvContent += 'Data;Pescoco;Ombro;Torax;Cintura;Abdomen;Quadril;Braco Dir;Braco Esq;Antebraco Dir;Antebraco Esq;Coxa Dir;Coxa Esq;Panturrilha Dir;Panturrilha Esq;Observacoes\r\n';
      filteredMeasures.forEach((m) => {
        csvContent += `${m.data};${m.pescoco || ''};${m.ombro || ''};${m.torax || ''};${m.cintura || ''};${m.abdomen || ''};${m.quadril || ''};${m.bracoDir || ''};${m.bracoEsq || ''};${m.antebracoDir || ''};${m.antebracoEsq || ''};${m.coxaDir || ''};${m.coxaEsq || ''};${m.panturrilhaDir || ''};${m.panturrilhaEsq || ''};"${m.observacoes || ''}"\r\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeSubTab === 'weights' ? 'registro_de_peso' : 'medidas_corporais'}_2026.csv`);
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
            Histórico & Lançamentos da Planilha
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Planilha Google Sheets: <code className="text-emerald-300">Acompanhamento Corporal - Peso e Medidas 2026</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-medium border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <a
            href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs sm:text-sm font-medium border border-emerald-500/40 transition"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Sheets
          </a>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/60 backdrop-blur p-3 rounded-2xl border border-slate-700/60">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('weights')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeSubTab === 'weights'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Scale className="w-4 h-4" />
            Registro de Peso ({weights.length})
          </button>
          <button
            onClick={() => setActiveSubTab('measures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeSubTab === 'measures'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Ruler className="w-4 h-4" />
            Medidas Corporais ({measures.length})
          </button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por data, contexto..."
            className="w-full sm:w-64 bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
        {activeSubTab === 'weights' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">Data</th>
                  <th className="py-3 px-4 font-semibold">Dia da Semana</th>
                  <th className="py-3 px-4 font-semibold">Horário / Contexto</th>
                  <th className="py-3 px-4 font-semibold">Peso (kg)</th>
                  <th className="py-3 px-4 font-semibold">Var. Anterior</th>
                  <th className="py-3 px-4 font-semibold">Var. Inicial</th>
                  <th className="py-3 px-4 font-semibold">IMC</th>
                  <th className="py-3 px-4 font-semibold">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredWeights.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      Nenhum registro de peso encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredWeights.map((w, idx) => (
                    <tr key={w.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-medium text-white">{w.data}</td>
                      <td className="py-3 px-4 text-slate-400">{w.diaSemana}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700">
                          {w.contexto}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">
                        {formatBRNumber(w.peso, 3)} kg
                      </td>
                      <td className="py-3 px-4">
                        {w.variacaoAnterior === undefined || w.variacaoAnterior === 0 ? (
                          <span className="text-slate-500">0,000 kg</span>
                        ) : w.variacaoAnterior > 0 ? (
                          <span className="text-rose-400 font-medium">+{formatBRNumber(w.variacaoAnterior, 3)} kg</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">{formatBRNumber(w.variacaoAnterior, 3)} kg</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {w.variacaoInicial === undefined || w.variacaoInicial === 0 ? (
                          <span className="text-slate-500">0,000 kg</span>
                        ) : w.variacaoInicial > 0 ? (
                          <span className="text-rose-400 font-medium">+{formatBRNumber(w.variacaoInicial, 3)} kg</span>
                        ) : (
                          <span className="text-emerald-400 font-medium">{formatBRNumber(w.variacaoInicial, 3)} kg</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300">
                        {w.imc ? formatBRNumber(w.imc, 2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-xs" title={w.observacoes}>
                        {w.observacoes || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4 font-semibold">Data</th>
                  <th className="py-3 px-4 font-semibold text-cyan-400">Abdômen</th>
                  <th className="py-3 px-4 font-semibold text-cyan-400">Cintura</th>
                  <th className="py-3 px-4 font-semibold text-cyan-400">Quadril</th>
                  <th className="py-3 px-4 font-semibold">Tórax</th>
                  <th className="py-3 px-4 font-semibold">Pescoço</th>
                  <th className="py-3 px-4 font-semibold">Braços (D/E)</th>
                  <th className="py-3 px-4 font-semibold">Coxas (D/E)</th>
                  <th className="py-3 px-4 font-semibold">Observações / Instrumento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMeasures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhum registro de medida corporal encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredMeasures.map((m, idx) => (
                    <tr key={m.id || idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-medium text-white">{m.data}</td>
                      <td className="py-3 px-4 font-bold text-cyan-300">
                        {m.abdomen ? `${formatBRNumber(m.abdomen, 1)} cm` : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-300">
                        {m.cintura ? `${formatBRNumber(m.cintura, 1)} cm` : '-'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-300">
                        {m.quadril ? `${formatBRNumber(m.quadril, 1)} cm` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.torax ? `${formatBRNumber(m.torax, 1)} cm` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.pescoco ? `${formatBRNumber(m.pescoco, 1)} cm` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.bracoDir || m.bracoEsq ? `${formatBRNumber(m.bracoDir, 1)} / ${formatBRNumber(m.bracoEsq, 1)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {m.coxaDir || m.coxaEsq ? `${formatBRNumber(m.coxaDir, 1)} / ${formatBRNumber(m.coxaEsq, 1)}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 max-w-sm" title={m.observacoes}>
                        {m.observacoes || '-'}
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
