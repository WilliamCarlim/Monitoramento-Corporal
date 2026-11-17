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
  } else if (type === 'workout') {
    promptInstruction = `Você é um especialista em leitura OCR de prints de treinos esportivos (Strava, Garmin, Nike Run, Apple Fitness, etc.).
Analise o print do treino e extraia as métricas esportivas com precisão.
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases e sem comentários adicionais.
Campos a extrair:
{
  "modalidade": string (ex: "Caminhada", "Corrida", "Ciclismo", "Musculação"),
  "data": string (formato DD/MM/AAAA se visível),
  "horario": string (ex: "Entardecer 18:12" ou "18:12"),
  "local": string (ex: "Strava • Bariri, SP" ou o título/local do treino no Strava),
  "distanciaKm": number (ex: 5.70),
  "tempoMovimento": string (formato HH:MM:SS ou MM:SS, ex: "00:58:43"),
  "passos": number (ex: 6944),
  "elevacaoM": number (ex: 51),
  "calorias": number (ex: 470),
  "observacoes": string
}`;
  } else {
    promptInstruction = `Você é um especialista em leitura OCR de anotações e tabelas de medidas corporais (circunferências em cm).
Analise a imagem e extraia os valores em cm.
Retorne EXCLUSIVAMENTE um objeto JSON válido, sem crases:
{
  "data": string (DD/MM/AAAA se visível),
  "pescoco": number,
  "ombro": number,
  "torax": number,
  "cintura": number,
  "abdomen": number,
  "quadril": number,
  "bracoDir": number,
  "bracoEsq": number,
  "antebracoDir": number,
  "antebracoEsq": number,
  "coxaDir": number,
  "coxaEsq": number,
  "panturrilhaDir": number,
  "panturrilhaEsq": number,
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
        maxOutputTokens: 1024,
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
