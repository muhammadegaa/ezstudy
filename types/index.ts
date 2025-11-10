export type Language = 'en' | 'zh' | 'id';

export interface Translation {
  original: string;
  translated: string;
  language: Language;
  glossary?: GlossaryTerm[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  context: string;
  language: Language;
}

export interface Session {
  id: string;
  timestamp: Date;
  translations: Translation[];
  title?: string;
}

export interface TranslationRequest {
  text: string;
  sourceLang: Language;
  targetLang: Language;
  includeGlossary?: boolean;
}

export interface TranslationResponse {
  translation: string;
  glossary?: GlossaryTerm[];
  voiceData?: {
    text: string;
    language: Language;
  };
}

