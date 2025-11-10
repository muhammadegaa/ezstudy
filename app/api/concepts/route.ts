import { NextRequest, NextResponse } from 'next/server';

// AI-powered concept extraction - intelligently identifies concepts that NEED visual aids
// Uses free AI services to understand context and determine what's actually visualizable

const COMMON_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'can', 'may', 'might', 'must', 'shall', 'plus', 'minus', 'showcases', 'section',
  'chapter', 'part', 'example', 'instance', 'case', 'point', 'way', 'method', 'approach'
]);

async function analyzeWithAI(transcript: string): Promise<Array<{
  name: string;
  description: string;
  searchTerms: string[];
  needsVisual: boolean;
}>> {
  // Use free AI service to intelligently identify visualizable concepts
  try {
    const prompt = `You are an AI assistant analyzing academic lecture transcripts. Your task is to identify ONLY concepts that would genuinely benefit from visual aids (animations, diagrams, GIFs).

CRITICAL RULES:
- ONLY identify scientific/mathematical concepts that can be VISUALIZED
- IGNORE common words: "plus", "minus", "showcases", "section", "chapter", "example", "evolution" (unless it's biological evolution)
- IGNORE abstract concepts that don't need visuals: philosophy, ethics, general theories
- FOCUS ON: physics laws, chemical reactions, biological processes, mathematical visualizations, scientific phenomena

Transcript: "${transcript.substring(0, 1500)}"

Return JSON array format:
[{"name": "Quantum Mechanics", "description": "Physics concept", "searchTerms": ["quantum mechanics"], "needsVisual": true}]

If NO concepts need visual aids, return: []`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Try multiple free AI endpoints
    const endpoints = [
      'https://api-inference.huggingface.co/models/google/flan-t5-base',
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-small',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 500,
              return_full_text: false,
            },
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const data = await response.json();
          // Try to extract concepts from response
          if (data && Array.isArray(data) && data[0]) {
            const text = JSON.stringify(data[0]);
            const jsonMatch = text.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                  const filtered = parsed.filter((c: any) => 
                    c && c.name && c.needsVisual !== false && 
                    !['plus', 'minus', 'showcases', 'section'].includes(c.name.toLowerCase())
                  );
                  if (filtered.length > 0) {
                    clearTimeout(timeoutId);
                    return filtered;
                  }
                }
              } catch (e) {
                // Continue to next endpoint
              }
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    clearTimeout(timeoutId);
  } catch (error) {
    console.error('AI concept analysis error:', error);
  }

  // Fallback: Intelligent pattern-based extraction with context awareness
  return intelligentExtraction(transcript);
}

function intelligentExtraction(transcript: string): Array<{
  name: string;
  description: string;
  searchTerms: string[];
  needsVisual: boolean;
}> {
  const concepts: Map<string, {
    name: string;
    description: string;
    searchTerms: string[];
    needsVisual: boolean;
  }> = new Map();

  // Only match concepts that ACTUALLY need visual aids
  const visualizablePatterns = [
    // Physics - visualizable
    { pattern: /quantum\s+(mechanics|physics|computing|algorithms?|computers?)/gi, name: 'Quantum Mechanics', searchTerms: ['quantum mechanics', 'quantum physics'], category: 'Physics' },
    { pattern: /wave[- ]particle\s+duality/gi, name: 'Wave-Particle Duality', searchTerms: ['wave particle duality', 'quantum physics'], category: 'Physics' },
    { pattern: /newton['\s]s?\s+(first|second|third)\s+law/gi, name: "Newton's Laws", searchTerms: ['newton laws', 'physics motion'], category: 'Physics' },
    { pattern: /einstein['\s]s?\s+relativity/gi, name: "Einstein's Relativity", searchTerms: ['einstein relativity', 'theory of relativity'], category: 'Physics' },
    { pattern: /photoelectric\s+effect/gi, name: 'Photoelectric Effect', searchTerms: ['photoelectric effect', 'light electrons'], category: 'Physics' },
    { pattern: /electromagnetic\s+waves?/gi, name: 'Electromagnetic Waves', searchTerms: ['electromagnetic waves', 'light waves'], category: 'Physics' },
    
    // Chemistry - visualizable
    { pattern: /chemical\s+reaction/gi, name: 'Chemical Reaction', searchTerms: ['chemical reaction', 'chemistry'], category: 'Chemistry' },
    { pattern: /molecular\s+structure/gi, name: 'Molecular Structure', searchTerms: ['molecular structure', 'molecules'], category: 'Chemistry' },
    { pattern: /periodic\s+table/gi, name: 'Periodic Table', searchTerms: ['periodic table', 'elements'], category: 'Chemistry' },
    { pattern: /photosynthesis/gi, name: 'Photosynthesis', searchTerms: ['photosynthesis', 'plant process'], category: 'Chemistry' },
    
    // Biology - visualizable
    { pattern: /cell\s+division/gi, name: 'Cell Division', searchTerms: ['cell division', 'mitosis'], category: 'Biology' },
    { pattern: /mitosis/gi, name: 'Mitosis', searchTerms: ['mitosis', 'cell division'], category: 'Biology' },
    { pattern: /meiosis/gi, name: 'Meiosis', searchTerms: ['meiosis', 'cell division'], category: 'Biology' },
    { pattern: /dna\s+(replication|structure)/gi, name: 'DNA Structure', searchTerms: ['dna structure', 'genetics'], category: 'Biology' },
    
    // Mathematics - only visualizable concepts
    { pattern: /pythagorean\s+theorem/gi, name: 'Pythagorean Theorem', searchTerms: ['pythagorean theorem', 'geometry'], category: 'Mathematics' },
    { pattern: /derivative/gi, name: 'Derivative', searchTerms: ['derivative', 'calculus graph'], category: 'Mathematics' },
    { pattern: /integral/gi, name: 'Integral', searchTerms: ['integral', 'calculus'], category: 'Mathematics' },
    { pattern: /complex\s+numbers?/gi, name: 'Complex Numbers', searchTerms: ['complex numbers', 'imaginary numbers'], category: 'Mathematics' },
    { pattern: /square\s+root/gi, name: 'Square Root', searchTerms: ['square root', 'mathematics'], category: 'Mathematics' },
  ];

  // Extract only visualizable concepts
  for (const { pattern, name, searchTerms, category } of visualizablePatterns) {
    if (pattern.test(transcript)) {
      const key = name.toLowerCase();
      if (!concepts.has(key)) {
        concepts.set(key, {
          name,
          description: `${category} concept that benefits from visual explanation`,
          searchTerms,
          needsVisual: true,
        });
      }
    }
  }

  // Filter out common words and non-visualizable terms
  const filtered = Array.from(concepts.values()).filter(concept => {
    const lowerName = concept.name.toLowerCase();
    // Skip if it's a common word
    if (COMMON_WORDS.has(lowerName)) return false;
    // Skip single generic words
    if (lowerName.split(/\s+/).length === 1 && lowerName.length < 6) return false;
    // Only include if it's marked as needing visual
    return concept.needsVisual === true;
  });

  return filtered.slice(0, 8); // Limit to 8 most relevant
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    if (transcript.length < 20) {
      return NextResponse.json({
        concepts: [],
      });
    }

    // Use AI to intelligently extract concepts that NEED visual aids
    const concepts = await analyzeWithAI(transcript);

    // Filter to only concepts that need visuals
    const visualConcepts = concepts.filter(c => c.needsVisual !== false);

    return NextResponse.json({
      concepts: visualConcepts,
    });
  } catch (error: any) {
    console.error('Concept analysis error:', error);
    // Return empty array - better to show nothing than wrong concepts
    return NextResponse.json({
      concepts: [],
    });
  }
}
