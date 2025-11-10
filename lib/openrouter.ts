import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  translation: string;
  glossary?: Array<{
    term: string;
    definition: string;
    context: string;
  }>;
}

export async function translateWithGlossary(
  text: string,
  sourceLang: 'en' | 'zh' | 'id',
  targetLang: 'en' | 'zh' | 'id',
  apiKey: string
): Promise<OpenRouterResponse> {
  const langNames = {
    en: 'English',
    zh: 'Mandarin Chinese',
    id: 'Bahasa Indonesia',
  };

  const systemPrompt = `You are an academic translation assistant specializing in translating between ${langNames[sourceLang]} and ${langNames[targetLang]} for university students studying in the UK.

Your task:
1. Translate the input text accurately while preserving academic terminology
2. Identify academic terms that may need explanation
3. Provide brief contextual definitions for academic terms

Output format (JSON only):
{
  "translation": "translated text with [translate:original] markup for non-English terms",
  "glossary": [
    {
      "term": "academic term",
      "definition": "brief definition",
      "context": "sentence where term appears"
    }
  ]
}`;

  const userPrompt = `Translate this text from ${langNames[sourceLang]} to ${langNames[targetLang]}:
${text}

If translating to English, mark non-English terms with [translate:original] format.`;

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'ezstudy',
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenRouter');
    }

    const parsed = JSON.parse(content);
    return {
      translation: parsed.translation || text,
      glossary: parsed.glossary || [],
    };
  } catch (error) {
    console.error('OpenRouter translation error:', error);
    throw error;
  }
}

