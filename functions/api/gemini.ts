import { Env } from './sheets-helper';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON request' }), { status: 400 });
  }

  const { prompt, history = [], context: appContext = {} } = body;

  const apiKey = body.apiKey || env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        text: `⚠️ A chave **GEMINI_API_KEY** não está configurada nos Secrets do Cloudflare Pages nem nas Configurações.
Por favor, adicione na tela de Configurações (⚙️) do site ou nas variáveis de ambiente do Cloudflare Pages.`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const profile = appContext.profile || { alturaMetros: 1.76, alturaAppCm: 176, pesoInicial: 113.250, dataInicio: '16/11/2026', idade: 33 };
  const weights = appContext.weightsRecent || [];
  const measures = appContext.measuresRecent || [];
  const cardios = appContext.cardiosRecent || [];
  const workouts = appContext.workoutsRecent || [];
  const photos = appContext.photosRecent || [];

  const systemInstruction = `Você é um assistente especialista em saúde física, avaliação antropométrica, composição corporal (bioimpedância), fisiologia do exercício, musculação e nutrição esportiva integrado ao sistema de monitoramento corporal do usuário.

Dados do Usuário:
- Altura de Referência: ${profile.alturaMetros || 1.76} m (Altura no App: ${profile.alturaAppCm || 176} cm)
- Idade: ${profile.idade || 33} anos
- Peso Inicial: ${profile.pesoInicial || 113.250} kg registrado em ${profile.dataInicio || '16/11/2026'}

Histórico das 5 Abas Conectadas em Tempo Real:
1. Registros de Peso e Bioimpedância (Gordura %, Músculo %, Água %, Gordura Visceral, Taxa Metabólica Basal, etc.):
${JSON.stringify(weights, null, 2)}

2. Medidas Corporais (Circunferências em cm, abdômen oficial de 125 cm):
${JSON.stringify(measures, null, 2)}

3. Atividades Aeróbicas e Cardio (Caminhada, Corrida, Ciclismo / Bike, Esteira, Distância, Tempo, Passos, Elevação, Calorias):
${JSON.stringify(cardios, null, 2)}

4. Treinos de Musculação e Academia (Divisão Muscular, Exercícios, Séries, Cargas, PSE):
${JSON.stringify(workouts, null, 2)}

5. Histórico de Fotos Semanais (Evolução visual):
${JSON.stringify(photos, null, 2)}

DIRETRIZES FUNDAMENTAIS:
1. Responda EXATAMENTE E ESPECIFICAMENTE ao que o usuário perguntou. Não responda com relatórios genéricos se o usuário fez uma pergunta pontual.
2. Seja direto, conciso, motivador e cientificamente embasado em fisiologia e hipertrofia.
3. Use os dados reais das 5 abas acima para embasar sua resposta (datas, pesos, quilometragem, repetições, medidas).
4. Formate a resposta com títulos, tópicos e destaques em negrito.`;

  try {
    const CANDIDATE_MODELS = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-flash-8b',
    ];

    // Constrói histórico garantindo alternância estrita e que comece com 'user'
    const rawHistory = Array.isArray(history) ? history : [];
    const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    for (const item of rawHistory) {
      const content = String(item.content || item.parts?.[0]?.text || '').trim();
      if (!content) continue;
      // Pula a mensagem inicial de boas-vindas do sistema
      if (content.includes('Olá! Sou seu') || content.includes('Tenho acesso em tempo real')) continue;

      const role: 'user' | 'model' = item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';

      // Gemini exige que o primeiro item seja 'user'
      if (validHistory.length === 0 && role === 'model') continue;

      // Se duas mensagens seguidas tiverem o mesmo role, agrupa o texto
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
        validHistory[validHistory.length - 1].parts[0].text += `\n\n${content}`;
      } else {
        validHistory.push({ role, parts: [{ text: content }] });
      }
    }

    // Se a última mensagem for 'user', agrupa com o prompt atual ou adiciona
    if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
      validHistory[validHistory.length - 1].parts[0].text += `\n\n${prompt}`;
    } else {
      validHistory.push({ role: 'user', parts: [{ text: prompt }] });
    }

    const contents = validHistory;

    let lastError = '';
    let replyText = '';

    for (const model of CANDIDATE_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        // Tenta primeiro com systemInstruction
        let geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        });

        // Se falhar (por exemplo por falta de suporte a systemInstruction no modelo), tenta embutir no primeiro user message
        if (!geminiRes.ok) {
          const contentsWithContext = [
            {
              role: 'user',
              parts: [{ text: `[INSTRUÇÕES E DADOS DO SISTEMA]\n${systemInstruction}\n\n[MENSAGEM DO USUÁRIO]\n${contents[0].parts[0].text}` }],
            },
            ...contents.slice(1),
          ];

          geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: contentsWithContext,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1500,
              },
            }),
          });
        }

        if (geminiRes.ok) {
          const data: any = await geminiRes.json();
          replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (replyText) break;
        } else {
          lastError = await geminiRes.text();
        }
      } catch (err: any) {
        lastError = err.message || String(err);
      }
    }

    if (!replyText) {
      return new Response(
        JSON.stringify({
          error: `Gemini API returned error: ${lastError}`,
          text: `Erro ao consultar Gemini. Verifique se sua chave de API possui cotas e permissões ativas. Detalhes: ${lastError}`,
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(JSON.stringify({ text: replyText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        text: 'Ocorreu um erro interno de conexão com a API do Gemini.',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};
