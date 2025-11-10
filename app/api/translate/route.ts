import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translation';
import type { Language } from '@/types';

export async function POST(request: NextRequest) {
  let originalText = '';
  
  try {
    const body = await request.json();
    const { text, sourceLang, targetLang } = body;
    originalText = text || '';

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use free LibreTranslate service (no API key needed!)
    const result = await translateText(
      text,
      sourceLang as Language,
      targetLang as Language
    );

    return NextResponse.json({
      translation: result.translation,
      glossary: result.glossary || [],
    });
  } catch (error: any) {
    console.error('Translation API error:', error);
    // Return original text with error indicator instead of failing
    return NextResponse.json({
      translation: originalText + ' [Translation temporarily unavailable]',
      glossary: [],
    });
  }
}

