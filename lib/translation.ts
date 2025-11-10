// Robust multi-provider translation system with automatic chunking
// Handles texts of ANY length by splitting intelligently

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

// Ultra-fast intelligent chunking - optimized for speech-speed translation
// Splits at sentence boundaries, prioritizes speed over perfect boundaries
function chunkText(text: string, maxChunkSize: number = 400): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  // Fast sentence splitting - use simple regex for speed
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  let currentChunk = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    const potentialChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    
    if (potentialChunk.length <= maxChunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // If sentence is too long, split by commas or just take it
      if (sentence.length > maxChunkSize) {
        const parts = sentence.split(/,\s+/);
        let partChunk = '';
        for (const part of parts) {
          if ((partChunk + ', ' + part).length <= maxChunkSize) {
            partChunk = partChunk ? partChunk + ', ' + part : part;
          } else {
            if (partChunk) chunks.push(partChunk);
            partChunk = part;
          }
        }
        currentChunk = partChunk || sentence.substring(0, maxChunkSize);
      } else {
        currentChunk = sentence;
      }
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

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

  // MyMemory has 500 char limit - chunk if needed
  const chunks = chunkText(text, 450);
  const translatedChunks: string[] = [];

  // Parallel translation for speed - translate all chunks simultaneously
  const translationPromises = chunks.map(async (chunk) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Ultra-fast timeout for speech-speed
      
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${source}|${target}`,
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
      console.error('MyMemory chunk error:', e);
    }
    
    // If chunk fails, return original
    return chunk;
  });

  // Wait for all translations in parallel
  const results = await Promise.all(translationPromises);
  translatedChunks.push(...results);

  if (translatedChunks.length === 0) {
    throw new Error('MyMemory failed');
  }

  return translatedChunks.join(' ');
}

// Translation Provider 2: Google Translate (via public API)
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

  // Google Translate - parallel processing for speed
  const chunks = chunkText(text, 1000);
  
  const translationPromises = chunks.map(async (chunk) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Faster timeout
      
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodeURIComponent(chunk)}`,
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
      console.error('Google Translate chunk error:', e);
    }
    
    return chunk;
  });

  const translatedChunks = await Promise.all(translationPromises);

  if (translatedChunks.length === 0) {
    throw new Error('Google Translate failed');
  }

  return translatedChunks.join(' ');
}

// Translation Provider 3: LibreTranslate (multiple instances)
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

  // LibreTranslate - parallel processing with fastest instance selection
  const chunks = chunkText(text, 1000);
  
  const translationPromises = chunks.map(async (chunk) => {
    // Try all instances in parallel, take first successful
    const instancePromises = LIBRETRANSLATE_URLS.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // Faster timeout
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: chunk,
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
        return null;
      }
      return null;
    });

    // Race all instances - take first successful
    const results = await Promise.all(instancePromises);
    return results.find(r => r !== null) || chunk;
  });

  const translatedChunks = await Promise.all(translationPromises);

  if (translatedChunks.length === 0) {
    throw new Error('LibreTranslate failed');
  }

  return translatedChunks.join(' ');
}

// Translation Provider 4: Simple word-by-word fallback
function translateWithSimpleFallback(
  text: string,
  sourceLang: string,
  targetLang: string
): string {
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

  // Try Provider 1: MyMemory (with automatic chunking)
  try {
    console.log('Trying MyMemory API with chunking...');
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

  // Try Provider 2: Google Translate (with chunking)
  try {
    console.log('Trying Google Translate API with chunking...');
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

  // Try Provider 3: LibreTranslate (with chunking)
  try {
    console.log('Trying LibreTranslate with chunking...');
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
