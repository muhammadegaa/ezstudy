import { NextRequest, NextResponse } from 'next/server';

// Free concept extraction using keyword matching and pattern recognition
// No paid APIs required!

const ACADEMIC_PATTERNS = [
  // Physics
  { pattern: /newton['\s]s?\s+(first|second|third)\s+law/gi, category: 'Physics', searchTerms: ['newton law', 'physics motion'] },
  { pattern: /quantum\s+mechanics?/gi, category: 'Physics', searchTerms: ['quantum mechanics', 'quantum physics'] },
  { pattern: /wave[- ]particle\s+duality/gi, category: 'Physics', searchTerms: ['wave particle duality', 'quantum physics'] },
  { pattern: /einstein['\s]s?\s+theory\s+of\s+relativity/gi, category: 'Physics', searchTerms: ['einstein relativity', 'theory of relativity'] },
  { pattern: /photoelectric\s+effect/gi, category: 'Physics', searchTerms: ['photoelectric effect', 'light electrons'] },
  { pattern: /schrödinger['\s]s?\s+equation/gi, category: 'Physics', searchTerms: ['schrodinger equation', 'quantum mechanics'] },
  
  // Chemistry
  { pattern: /photosynthesis/gi, category: 'Chemistry', searchTerms: ['photosynthesis', 'plant process'] },
  { pattern: /chemical\s+reaction/gi, category: 'Chemistry', searchTerms: ['chemical reaction', 'chemistry'] },
  { pattern: /periodic\s+table/gi, category: 'Chemistry', searchTerms: ['periodic table', 'elements'] },
  { pattern: /molecular\s+structure/gi, category: 'Chemistry', searchTerms: ['molecular structure', 'molecules'] },
  
  // Biology
  { pattern: /mitosis/gi, category: 'Biology', searchTerms: ['mitosis', 'cell division'] },
  { pattern: /meiosis/gi, category: 'Biology', searchTerms: ['meiosis', 'cell division'] },
  { pattern: /dna\s+replication/gi, category: 'Biology', searchTerms: ['dna replication', 'genetics'] },
  { pattern: /evolution/gi, category: 'Biology', searchTerms: ['evolution', 'natural selection'] },
  
  // Mathematics
  { pattern: /calculus/gi, category: 'Mathematics', searchTerms: ['calculus', 'mathematics'] },
  { pattern: /derivative/gi, category: 'Mathematics', searchTerms: ['derivative', 'calculus'] },
  { pattern: /integral/gi, category: 'Mathematics', searchTerms: ['integral', 'calculus'] },
  { pattern: /pythagorean\s+theorem/gi, category: 'Mathematics', searchTerms: ['pythagorean theorem', 'geometry'] },
  
  // General academic terms
  { pattern: /\bhypothesis\b/gi, category: 'General', searchTerms: ['hypothesis', 'scientific method'] },
  { pattern: /\btheorem\b/gi, category: 'Mathematics', searchTerms: ['theorem', 'mathematics'] },
  { pattern: /\bprinciple\b/gi, category: 'General', searchTerms: ['principle', 'concept'] },
  { pattern: /\btheory\b/gi, category: 'General', searchTerms: ['theory', 'scientific theory'] },
];

function extractConcepts(transcript: string): Array<{
  name: string;
  description: string;
  searchTerms: string[];
}> {
  const concepts: Map<string, { name: string; description: string; searchTerms: string[] }> = new Map();
  
  // Extract concepts using patterns
  for (const { pattern, category, searchTerms } of ACADEMIC_PATTERNS) {
    const matches = transcript.match(pattern);
    if (matches) {
      const match = matches[0];
      const conceptName = match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
      
      if (!concepts.has(conceptName.toLowerCase())) {
        concepts.set(conceptName.toLowerCase(), {
          name: conceptName,
          description: `${category} concept: ${conceptName}`,
          searchTerms,
        });
      }
    }
  }
  
  // Extract capitalized terms (likely proper nouns or important concepts)
  const capitalizedTerms = transcript.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (capitalizedTerms) {
    for (const term of capitalizedTerms) {
      const lowerTerm = term.toLowerCase();
      // Skip common words
      if (term.length > 3 && !['The', 'This', 'That', 'There', 'These', 'Those'].includes(term)) {
        if (!concepts.has(lowerTerm)) {
          concepts.set(lowerTerm, {
            name: term,
            description: `Academic term: ${term}`,
            searchTerms: [term.toLowerCase()],
          });
        }
      }
    }
  }
  
  return Array.from(concepts.values()).slice(0, 10); // Limit to 10 concepts
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

    if (transcript.length < 10) {
      return NextResponse.json({
        concepts: [],
      });
    }

    // Extract concepts using free pattern matching
    const concepts = extractConcepts(transcript);

    return NextResponse.json({
      concepts,
    });
  } catch (error: any) {
    console.error('Concept analysis error:', error);
    // Return empty array instead of error to not break the UI
    return NextResponse.json({
      concepts: [],
    });
  }
}
