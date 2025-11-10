// Free translation service - using MyMemory API (free, no API key needed for small requests)
// Fallback to multiple free services

export interface TranslationResponse {
  translation: string;
  glossary?: Array<{
    term: string;
    definition: string;
    context: string;
  }>;
}

const langCodeMap: Record<string, string> = {
  en: 'en',
  zh: 'zh',
  id: 'id',
};

// Academic terms dictionary for glossary
const academicTerms: Record<string, Record<string, string>> = {
  en: {
    'quantum mechanics': 'A branch of physics dealing with atomic and subatomic systems',
    'wave-particle duality': 'The concept that matter exhibits both wave and particle characteristics',
    'newton': 'Unit of force in physics',
    'inertia': 'The tendency of objects to resist changes in motion',
    'photosynthesis': 'Process by which plants convert light energy into chemical energy',
    'mitosis': 'Cell division process',
  },
  zh: {
    '量子力学': 'A branch of physics dealing with atomic and subatomic systems',
    '波粒二象性': 'The concept that matter exhibits both wave and particle characteristics',
  },
  id: {
    'mekanika kuantum': 'A branch of physics dealing with atomic and subatomic systems',
    'dualitas gelombang-partikel': 'The concept that matter exhibits both wave and particle characteristics',
  },
};

async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const source = langCodeMap[sourceLang] || sourceLang;
  const target = langCodeMap[targetLang] || targetLang;
  
  if (source === target) {
    return text;
  }

  try {
    // MyMemory Translation API - free, no API key needed
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.error('MyMemory translation error:', e);
  }

  throw new Error('Translation failed');
}

async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const source = langCodeMap[sourceLang] || sourceLang;
  const target = langCodeMap[targetLang] || targetLang;
  
  if (source === target) {
    return text;
  }

  const LIBRETRANSLATE_URLS = [
    'https://libretranslate.de/translate',
    'https://translate.argosopentech.com/translate',
  ];

  for (const url of LIBRETRANSLATE_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: source,
          target: target,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error('LibreTranslate failed');
}

function extractGlossary(text: string, translatedText: string, sourceLang: string, targetLang: string): Array<{ term: string; definition: string; context: string }> {
  const glossary: Array<{ term: string; definition: string; context: string }> = [];
  
  // Check for academic terms
  const terms = academicTerms[sourceLang] || {};
  for (const [term, definition] of Object.entries(terms)) {
    if (text.toLowerCase().includes(term.toLowerCase())) {
      const sentences = text.split(/[.!?]/);
      const context = sentences.find(s => s.toLowerCase().includes(term.toLowerCase())) || text.substring(0, 100);
      
      glossary.push({
        term,
        definition,
        context: context.trim(),
      });
    }
  }

  return glossary;
}

export async function translateText(
  text: string,
  sourceLang: 'en' | 'zh' | 'id',
  targetLang: 'en' | 'zh' | 'id'
): Promise<TranslationResponse> {
  if (sourceLang === targetLang) {
    return {
      translation: text,
      glossary: [],
    };
  }

  if (!text || text.trim().length === 0) {
    return {
      translation: '',
      glossary: [],
    };
  }

  // Try MyMemory first (most reliable free service)
  try {
    const translated = await translateWithMyMemory(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.error('MyMemory translation failed, trying LibreTranslate:', error);
  }

  // Fallback to LibreTranslate
  try {
    const translated = await translateWithLibreTranslate(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.error('All translation services failed:', error);
    
    // Last resort: return original text
    return {
      translation: text,
      glossary: extractGlossary(text, text, sourceLang, targetLang),
    };
  }
}
