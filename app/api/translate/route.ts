import { NextRequest, NextResponse } from 'next/server';
import { translateWithGlossary } from '@/lib/openrouter';
import type { Language } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const result = await translateWithGlossary(
      text,
      sourceLang as Language,
      targetLang as Language,
      apiKey
    );

    return NextResponse.json({
      translation: result.translation,
      glossary: result.glossary || [],
    });
  } catch (error: any) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    );
  }
}

