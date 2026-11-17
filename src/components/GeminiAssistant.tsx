import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { AssistantMessage, WeightRecord, MeasureRecord, CardioRecord, WorkoutRecord, PhotoRecord } from '../types';
import { askGemini } from '../services/api';

interface GeminiAssistantProps {
  weights: WeightRecord[];
  measures: MeasureRecord[];
  cardios?: CardioRecord[];
  workouts?: WorkoutRecord[];
  photos?: PhotoRecord[];
}

const QUICK_PROMPTS = [
  'Analisar minha evolução geral e próximos focos',
  'Explicar oscilação de peso pós-treino e almoço',
  'Interpretar medida de abdômen de 127cm com trena vs fita métrica',
  'Analisar meu último cardio do Strava e gasto calórico',
  'Analisar meu treino de musculação na Fast fit (Peitoral/Tríceps)',
  'Qual o protocolo ideal de pesagem e medidas para os próximos dias?',
];

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({
  weights,
  measures,
  cardios = [],
  workouts = [],
  photos = [],
}) => {
  const latestWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const latestAbdomen = [...measures].reverse().find(m => m.abdomen)?.abdomen || 127;
  const latestCardio = cardios.length > 0 ? cardios[cardios.length - 1] : null;
  const latestWorkout = workouts.length > 0 ? workouts[workouts.length - 1] : null;

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá! Sou seu **Assistente de Acompanhamento Corporal com Inteligência Artificial** (Gemini).

Tenho acesso em tempo real aos seus registros das 5 abas da planilha Google Sheets:
* **Peso Inicial / Atual:** ${latestWeight ? `${latestWeight.peso} kg (${latestWeight.data} - ${latestWeight.contexto})` : '113,250 kg'}
* **Bioimpedância:** Gordura ${latestWeight?.gorduraPercent || 35.2}% | Massa Muscular ${latestWeight?.massaMuscularPercent || 62.1}% | Visceral ${latestWeight?.gorduraVisceral || 26.0} | Basal ${latestWeight?.metabolismo || 2126} kcal
* **Medida de Abdômen:** ${latestAbdomen} cm
* **Cardio (Strava):** ${latestCardio ? `${latestCardio.modalidade} (${latestCardio.distanciaKm} km, ${latestCardio.calorias} kcal)` : 'Nenhuma atividade aeróbica'}
* **Musculação:** ${latestWorkout ? `${latestWorkout.focoDivisao} (${latestWorkout.duracaoMin || '-'} min, PSE ${latestWorkout.esforcoPse || '-'})` : 'Nenhum treino de academia'}
* **Fotos Semanais:** ${photos.length} registro(s)

Como posso ajudar você hoje? Você pode escolher uma das perguntas rápidas abaixo ou digitar sua dúvida.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askGemini(question, messages);
      const assistantMsg: AssistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AssistantMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu uma instabilidade ao consultar o Gemini. Verifique se a sua `GEMINI_API_KEY` está configurada.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Conversa reiniciada. Como posso orientar sua jornada corporal hoje?',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render simple markdown formatting (bold, headers, bullets)
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Headings
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="font-bold text-base text-purple-300 mt-2">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="font-semibold text-sm text-emerald-400 mt-2">
                {trimmed.replace('#### ', '')}
              </h5>
            );
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const itemText = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-400 font-bold">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^\d+\./)?.[0];
            const itemText = trimmed.replace(/^\d+\.\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-purple-400 font-semibold">{num}</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }

          // Normal paragraph with inline formatting
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(trimmed) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-900 px-1.5 py-0.5 rounded text-purple-300 font-mono text-xs border border-slate-700">$1</code>');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20 md:pb-8 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-slate-850 to-indigo-950/40 p-4 rounded-2xl border border-purple-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Assistente de Análise Gemini
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Gemini Pro / Flash
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Análises biométricas contextuais com base na sua planilha e evolução real
            </p>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
          title="Limpar Conversa"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <HelpCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs bg-slate-800/80 hover:bg-purple-900/40 hover:border-purple-500/40 text-slate-300 hover:text-purple-200 border border-slate-700/60 transition flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Box */}
      <div className="flex-1 bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-4 sm:p-5 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tr-none'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-700/70 rounded-tl-none'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                renderFormattedText(msg.content)
              )}
              <span
                className={`text-[10px] block mt-2 text-right ${
                  msg.role === 'user' ? 'text-purple-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 text-purple-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3 text-slate-300 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
              <span>O Gemini está analisando seus dados corporais...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-slate-800/80 backdrop-blur p-2 rounded-2xl border border-slate-700/60 shadow-lg"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao Gemini (ex: O que significa meu abdômen ter reduzido mas o peso subido?)"
          className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};
