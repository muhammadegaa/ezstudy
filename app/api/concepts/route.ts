import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
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

    const systemPrompt = `You are an academic concept analyzer. Analyze the transcript and identify:
1. Key academic concepts, theories, laws, or principles mentioned
2. Scientific phenomena or processes
3. Mathematical concepts or formulas
4. Historical events or dates
5. Any visualizable concepts (physics laws, chemical reactions, biological processes, etc.)

For each concept, provide:
- The concept name
- A brief description
- Search terms that would help find relevant GIFs/animations to visualize it

Output ONLY valid JSON in this format:
{
  "concepts": [
    {
      "name": "Newton's First Law",
      "description": "An object at rest stays at rest, an object in motion stays in motion",
      "searchTerms": ["newton first law", "inertia", "physics motion"]
    }
  ]
}`;

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'openai/gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this lecture transcript:\n\n${transcript}` },
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
    return NextResponse.json({
      concepts: parsed.concepts || [],
    });
  } catch (error: any) {
    console.error('Concept analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Concept analysis failed' },
      { status: 500 }
    );
  }
}

