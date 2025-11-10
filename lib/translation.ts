// Robust multi-provider translation system with multiple fallbacks
// All services are FREE - no API keys required

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

// Translation Provider 1: MyMemory API (free, reliable)
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
    }
  } catch (e) {
    console.error('MyMemory translation error:', e);
  }

  throw new Error('MyMemory failed');
}

// Translation Provider 2: LibreTranslate (multiple instances)
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
    'https://translate.fortytwo-it.com/translate',
  ];

  for (const url of LIBRETRANSLATE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

// Translation Provider 3: Google Translate (via public API)
async function translateWithGoogleTranslate(
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Using Google Translate's public web interface API
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(text)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item: any[]) => item[0]).join('');
      }
    }
  } catch (e) {
    console.error('Google Translate error:', e);
  }

  throw new Error('Google Translate failed');
}

// Translation Provider 4: Simple word-by-word fallback (for common words)
function translateWithSimpleFallback(
  text: string,
  sourceLang: string,
  targetLang: string
): string {
  // Very basic word mapping for common academic terms
  const commonTerms: Record<string, Record<string, string>> = {
    'en-zh': {
      'quantum': '量子',
      'computer': '计算机',
      'physics': '物理学',
      'mathematics': '数学',
      'chemistry': '化学',
      'biology': '生物学',
    },
    'en-id': {
      'quantum': 'kuantum',
      'computer': 'komputer',
      'physics': 'fisika',
      'mathematics': 'matematika',
      'chemistry': 'kimia',
      'biology': 'biologi',
    },
  };

  const key = `${sourceLang}-${targetLang}`;
  const mapping = commonTerms[key] || {};
  
  let translated = text;
  for (const [en, translatedWord] of Object.entries(mapping)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, translatedWord);
  }

  return translated;
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

  // Try Provider 1: MyMemory (most reliable)
  try {
    console.log('Trying MyMemory API...');
    const translated = await translateWithMyMemory(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    console.log('MyMemory translation successful');
    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.warn('MyMemory failed, trying Google Translate...', error);
  }

  // Try Provider 2: Google Translate
  try {
    console.log('Trying Google Translate API...');
    const translated = await translateWithGoogleTranslate(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    console.log('Google Translate successful');
    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.warn('Google Translate failed, trying LibreTranslate...', error);
  }

  // Try Provider 3: LibreTranslate (multiple instances)
  try {
    console.log('Trying LibreTranslate...');
    const translated = await translateWithLibreTranslate(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    console.log('LibreTranslate successful');
    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.warn('LibreTranslate failed, using simple fallback...', error);
  }

  // Fallback 4: Simple word mapping
  try {
    console.log('Using simple fallback translation...');
    const translated = translateWithSimpleFallback(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);
    console.log('Simple fallback used');
    return {
      translation: translated || text,
      glossary,
    };
  } catch (error) {
    console.error('All translation methods failed:', error);
    // Last resort: return original with glossary
    return {
      translation: text,
      glossary: extractGlossary(text, text, sourceLang, targetLang),
    };
  }
}
