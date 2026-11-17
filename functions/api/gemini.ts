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

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        text: `⚠️ A chave **GEMINI_API_KEY** não está configurada nos Secrets do Cloudflare Pages.

Por favor, adicione a variável de ambiente:
\`GEMINI_API_KEY=AIzaSy...\` no painel do Cloudflare (Pages > Settings > Environment variables) ou adicione temporariamente na tela de Configurações do site.`,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const profile = appContext.profile || { alturaMetros: 1.80, alturaAppCm: 176, pesoInicial: 113.250, dataInicio: '16/11/2026', idade: 33 };
  const weights = appContext.weightsRecent || [];
  const measures = appContext.measuresRecent || [];
  const workouts = appContext.workoutsRecent || [];
  const photos = appContext.photosRecent || [];

  const systemInstruction = `Você é um assistente especialista em saúde física, avaliação antropométrica, composição corporal (bioimpedância), fisiologia do exercício e nutrição esportiva integrado ao sistema de monitoramento corporal do usuário.

Dados do Usuário:
- Altura de Referência: ${profile.alturaMetros} m (Altura no App: ${profile.alturaAppCm || 176} cm)
- Idade: ${profile.idade || 33} anos
- Peso Inicial: ${profile.pesoInicial} kg registrado em ${profile.dataInicio}

Histórico das 4 Abas Conectadas em Tempo Real:
1. Registros de Peso e Bioimpedância (Gordura %, Músculo %, Água %, Gordura Visceral, Taxa Metabólica Basal, etc.):
${JSON.stringify(weights, null, 2)}

2. Medidas Corporais (Circunferências em cm):
${JSON.stringify(measures, null, 2)}

3. Treinos Esportivos (Strava - Caminhadas, Corridas, Distância, Tempo, Elevação, Calorias):
${JSON.stringify(workouts, null, 2)}

4. Histórico de Fotos Semanais:
${JSON.stringify(photos, null, 2)}

Diretrizes de Atuação:
1. Responda em Português do Brasil com tom encorajador, analítico, seguro, técnico e motivador.
2. Analise profundamente a Composição Corporal: se a perda de peso veio de gordura, água ou massa muscular (usando as métricas de Gordura %, Massa Musc. Esquelética e Água).
3. Avalie o impacto dos treinos do Strava (gasto calórico, passos, elevação) no déficit energético e na retenção transitória pós-exercício.
4. Explique as relações entre medidas antropométricas (abdômen, cintura, quadril) e gordura visceral.
5. Estruture suas respostas usando títulos em Markdown, listas e destaques em negrito.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const contents = [
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: h.parts || [{ text: h.content || '' }],
      })),
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({
          error: `Gemini API returned error (${geminiRes.status}): ${errText}`,
          text: `Erro ao consultar Gemini (${geminiRes.status}). Verifique se sua chave de API possui cotas e permissões ativas.`,
        }),
        { headers: { 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geminiData: any = await geminiRes.json();
    const candidateText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não foi possível extrair a resposta do modelo.';

    return new Response(JSON.stringify({ text: candidateText }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error?.message || 'Falha na requisição ao Gemini',
        text: 'Desculpe, ocorreu um erro de conexão ao tentar se comunicar com o Gemini.',
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
};
