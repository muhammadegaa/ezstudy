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

    // Robust multi-provider translation system
    // Tries: MyMemory -> Google Translate -> LibreTranslate -> Simple Fallback
    const result = await translateText(
      text,
      sourceLang as Language,
      targetLang as Language
    );

    // Always return a result - even if translation failed, return original
    return NextResponse.json({
      translation: result.translation || originalText,
      glossary: result.glossary || [],
    });
  } catch (error: any) {
    console.error('Translation API error:', error);
    // Never fail - always return something
    return NextResponse.json({
      translation: originalText,
      glossary: [],
    });
  }
}

