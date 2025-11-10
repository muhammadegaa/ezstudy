// Free translation service using LibreTranslate (completely free, open source)
// Fallback to browser translation if LibreTranslate fails

export interface TranslationResponse {
  translation: string;
  glossary?: Array<{
    term: string;
    definition: string;
    context: string;
  }>;
}

const LIBRETRANSLATE_URLS = [
  'https://libretranslate.com/translate',
  'https://translate.argosopentech.com/translate',
  'https://translate.fortytwo-it.com/translate',
];

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

async function translateWithLibreTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  // Try multiple LibreTranslate instances
  for (const url of LIBRETRANSLATE_URLS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: langCodeMap[sourceLang] || sourceLang,
          target: langCodeMap[targetLang] || targetLang,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.translatedText || text;
      }
    } catch (e) {
      // Try next instance
      continue;
    }
  }

  throw new Error('All LibreTranslate instances failed');
}

function extractGlossary(text: string, translatedText: string, sourceLang: string, targetLang: string): Array<{ term: string; definition: string; context: string }> {
  const glossary: Array<{ term: string; definition: string; context: string }> = [];
  const words = text.toLowerCase().split(/\s+/);
  
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

  try {
    // Try LibreTranslate first
    const translated = await translateWithLibreTranslate(text, sourceLang, targetLang);
    const glossary = extractGlossary(text, translated, sourceLang, targetLang);

    return {
      translation: translated,
      glossary,
    };
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback: Return original text with error message
    return {
      translation: text + ' [Translation service unavailable - please try again]',
      glossary: [],
    };
  }
}

