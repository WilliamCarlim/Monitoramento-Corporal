import { Env } from './sheets-helper';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { imageBase64, type = 'weight' } = body;

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'Nenhuma imagem enviada' }), { status: 400 });
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Chave GEMINI_API_KEY não configurada no Cloudflare Pages.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Limpar prefixo data:image/...;base64, se houver
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  let mimeType = 'image/jpeg';
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
  if (match) {
    mimeType = match[1];
  }

  let promptInstruction = '';

  if (type === 'weight') {
    promptInstruction = `Você é um especialista em leitura OCR de fotos de balanças digitais e prints de aplicativos de bioimpedância (como Mi Fitness, Zepp Life, Renpho, Omron, Huawei Health, etc.).
Analise a imagem e extraia os dados corporais com máxima precisão.
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases de código markdown e sem comentários adicionais.
Campos a extrair (se não encontrar algum, use null):
{
  "peso": number (ex: 111.75 ou 113.25),
  "data": string (formato DD/MM/AAAA se visível),
  "horario": string (ex: "12:21" ou "06:41" ou contexto como "Manhã 06:41"),
  "imc": number (ex: 34.49),
  "gorduraPercent": number (ex: 35.2),
  "pesoGordura": number (ex: 39.4),
  "massaMuscEsqPercent": number (ex: 32.5),
  "pesoMassaMuscEsq": number (ex: 36.3),
  "massaMuscularPercent": number (ex: 62.1),
  "pesoMassaMuscular": number (ex: 69.5),
  "aguaPercent": number (ex: 48.6),
  "pesoAgua": number (ex: 54.4),
  "gorduraVisceral": number (ex: 26.0),
  "metabolismo": number (ex: 2126.0),
  "imcApp": number (ex: 36.1),
  "alturaApp": number (ex: 176),
  "idadeApp": number (ex: 33),
  "melhorPeso30d": number (ex: 107.85),
  "observacoes": string
}`;
  } else if (type === 'cardio') {
    promptInstruction = `Você é um especialista em leitura OCR de prints de atividades aeróbicas e cardio (Strava, Garmin, Apple Fitness, relógios esportivos, etc.) para Caminhada, Corrida, Ciclismo / Bike e Esteira.
Analise a imagem e extraia as métricas esportivas com precisão:
- Identifique a modalidade: "Caminhada", "Corrida", "Ciclismo / Bike" ou "Esteira".
- Extraia distância (km), tempo de movimento (formato HH:MM:SS ou MM:SS), passos (quando houver; se for bike ou não houver passos, use null), elevação (m) e calorias se estiver explícito no print.
- Se for atividade de bicicleta/ciclismo ou contiver métricas extras (velocidade média, velocidade máxima, elevação máxima, parceiros/acompanhantes), registre essas informações detalhadamente no campo "observacoes".
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases de código markdown:
{
  "modalidade": string ("Caminhada" | "Corrida" | "Ciclismo / Bike" | "Esteira"),
  "data": string (formato DD/MM/AAAA se visível),
  "horario": string (ex: "Entardecer 18:12" ou "18:12"),
  "local": string (ex: "Strava • Bariri, SP"),
  "distanciaKm": number,
  "tempoMovimento": string (HH:MM:SS),
  "passos": number ou null,
  "elevacaoM": number ou null,
  "calorias": number ou null,
  "observacoes": string
}`;
  } else if (type === 'workout') {
    promptInstruction = `Você é um especialista em leitura OCR de prints de treinos de musculação e academia finalizados (como aplicativos de academia, treinos salvos, etc.).
Analise a imagem do treino e faça:
1. "focoDivisao": Identifique e preencha APENAS os grupos musculares principais treinados (ex: "Peitoral / Tríceps", "Costas / Bíceps", "Pernas / Quadríceps", "Ombros / Trapézio"). NUNCA coloque nomes de rotina/ficha neste campo (ex: se tiver "Ficha: Abcde w hipertrofia...", NÃO coloque aqui, coloque nas observações).
2. "exerciciosCargas": Formate uma lista textual limpa de todos os exercícios identificados, suas séries e cargas/aparelhos (ex: "Supino reto com barra - 3 séries (30kg máquina); Supino inclinado com halteres - 3 séries (15 cada lado máquina); Peck deck - 3 séries (50); Crucifixo na polia - 3 séries (7.5); Tríceps francês - 3 séries; Tríceps corda - 3 séries (17.5); Tríceps testa com halteres - 3 séries").
3. "observacoes": Coloque o total de exercícios executados, o nome da academia ou local, e o nome da ficha/rotina (ex: "7 exercícios executados • Fast fit • Ficha: Abcde w hipertrofi...").
4. "data": se visível no print (DD/MM/AAAA).
5. "contexto": ex: "Academia Fast fit".
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases de código markdown:
{
  "focoDivisao": string (apenas grupos musculares),
  "exerciciosCargas": string,
  "observacoes": string,
  "data": string ou null,
  "contexto": string ou null
}`;
  } else {
    promptInstruction = `Você é um especialista em leitura OCR de anotações, fichas de avaliação física, tickets de balança/bioimpedância (InBody, Tanita, Panobianco, etc.) e tabelas de medidas corporais.
Analise a imagem com máxima precisão e extraia tanto as circunferências em cm quanto os dados de bioimpedância da avaliação mensal, se presentes:
1. Circunferências corporais em cm (pescoco, ombro, torax, cintura, abdomen, quadril, bracoDir, bracoEsq, antebracoDir, antebracoEsq, coxaDir, coxaEsq, panturrilhaDir, panturrilhaEsq).
2. Bioimpedância da Avaliação (se print de ticket/balança de academia):
   - pesoAvaliacao: peso em kg (ex: 112.0)
   - gorduraAvaliacao: percentual de gordura % (ex: 40.3)
   - massaGordura: peso da gordura em kg (ex: 45.1)
   - massaSemGordura: massa magra/livre de gordura em kg (ex: 66.9)
3. "observacoes": informações adicionais como academia, máquina, ticket, altura, idade (ex: "Academia Panobianco • Ticket 1038, Máquina 8678, Bariri").
4. "data": data no formato DD/MM/AAAA se visível.

Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases:
{
  "data": string ou null,
  "pescoco": number ou null,
  "ombro": number ou null,
  "torax": number ou null,
  "cintura": number ou null,
  "abdomen": number ou null,
  "quadril": number ou null,
  "bracoDir": number ou null,
  "bracoEsq": number ou null,
  "antebracoDir": number ou null,
  "antebracoEsq": number ou null,
  "coxaDir": number ou null,
  "coxaEsq": number ou null,
  "panturrilhaDir": number ou null,
  "panturrilhaEsq": number ou null,
  "pesoAvaliacao": number ou null,
  "gorduraAvaliacao": number ou null,
  "massaGordura": number ou null,
  "massaSemGordura": number ou null,
  "observacoes": string
}`;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptInstruction },
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ error: `Gemini OCR error: ${errText}` }), { status: 500 });
    }

    const data: any = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Limpar possíveis crases de markdown ```json ... ```
    const cleanedJsonText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsedJson = JSON.parse(cleanedJsonText);
    return new Response(JSON.stringify({ success: true, data: parsedJson }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Falha ao processar OCR da imagem' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
