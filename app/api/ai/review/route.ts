import { NextResponse } from 'next/server';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'nex-agi/deepseek-v3.1-nex-n1:free',
];

async function callOpenRouter(model: string, prompt: string) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'DevSync',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON generator. Respond ONLY with a valid JSON array.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

export async function POST(req: Request) {
  try {
    const { scope, file, language, code, range } = await req.json();

    if (!file || !code) {
      return NextResponse.json(
        { error: 'Missing file or code' },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert software code reviewer.

Review the following ${scope === 'selection' ? 'code selection' : 'file'}.

File: ${file}
Language: ${language || 'unknown'}
${range ? `Lines: ${range.startLine}-${range.endLine}` : ''}

Code:
${code}

Return ONLY a valid JSON array like:
[
  {
    "severity": "warning",
    "category": "performance",
    "message": "Short explanation",
    "confidence": "high"
  }
]
`;

    for (const model of MODELS) {
      try {
        const data = await callOpenRouter(model, prompt);
        const raw = data.choices?.[0]?.message?.content;

        if (!raw) throw new Error('Empty response');

        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']') + 1;
        const results = JSON.parse(raw.slice(start, end));

        return NextResponse.json({
          success: true,
          modelUsed: model,
          results,
        });
      } catch {
        console.warn(`Model failed: ${model}`);
      }
    }

    return NextResponse.json(
      { error: 'All AI models unavailable' },
      { status: 503 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'AI review failed' },
      { status: 500 }
    );
  }
}
