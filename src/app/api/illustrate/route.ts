import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function buildPrompt(input: { selection?: string; cfi?: string; toc?: string; bookName?: string }) {
  const lines: string[] = [];
  lines.push(`You are an expert book illustrator generating a single coherent scene image.`);
  if (input.selection) {
    lines.push(`Focus on this excerpt: "${input.selection.slice(0, 800)}".`);
  } else if (input.toc) {
    lines.push(`Focus on the current chapter: ${input.toc}.`);
  } else if (input.bookName) {
    lines.push(`Focus on the book theme: ${input.bookName}.`);
  } else {
    lines.push('Create a generic evocative cover-style illustration.');
  }
  lines.push('Style: detailed, cinematic lighting, high contrast, expressive, avoid text.');
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = buildPrompt(body ?? {});

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const client = new OpenAI({ apiKey });
      const image = await client.images.generate({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024'
      });
      const b64 = image.data?.[0]?.b64_json;
      if (b64) {
        return NextResponse.json({ url: `data:image/png;base64,${b64}` });
      }
    }

    // Fallback: placeholder image with prompt encoded (not external dependency)
    const fallbackUrl = `https://placehold.co/1024x768/png?text=${encodeURIComponent(prompt.slice(0, 120))}`;
    return NextResponse.json({ url: fallbackUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
