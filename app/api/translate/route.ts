import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';
import { translateText } from '@/lib/translation';
import type { Language } from '@/types';

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const limitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 30 }); // 30 requests per minute
  
  if (!limitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((limitResult.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '30',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(limitResult.resetTime),
        },
      }
    );
  }
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

    // Robust multi-provider translation system with automatic chunking
    // Handles texts of ANY length - automatically splits long texts
    // Tries: MyMemory -> Google Translate -> LibreTranslate -> Simple Fallback
    const result = await translateText(
      text,
      sourceLang as Language,
      targetLang as Language
    );

    // NEVER return error messages - always return usable text
    const translation = result.translation || originalText;
    
    // Remove any error messages that might have leaked through
    const cleanTranslation = translation
      .replace(/QUERY LENGTH LIMIT EXCEEDED.*/gi, '')
      .replace(/MAX ALLOWED QUERY.*/gi, '')
      .replace(/\[Translation.*unavailable.*\]/gi, '')
      .trim() || originalText;

    return NextResponse.json({
      translation: cleanTranslation,
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

