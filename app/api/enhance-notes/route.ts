import { NextRequest, NextResponse } from 'next/server';

// AI-powered note enhancement using free services
// Helps format, summarize, and improve notes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalText, translatedText, concepts } = body;

    if (!originalText || originalText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Use Hugging Face Inference API (free tier, no API key needed for public models)
    // Fallback to simple formatting if API fails
    
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: originalText.substring(0, 1000), // Limit to 1000 chars
            parameters: {
              max_length: 200,
              min_length: 50,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].summary_text) {
          const summary = data[0].summary_text;
          
          // Format the enhanced note
          const enhancedNote = formatNote(originalText, translatedText, concepts, summary);
          
          return NextResponse.json({
            enhanced: enhancedNote,
            summary: summary,
          });
        }
      }
    } catch (error) {
      console.error('Hugging Face API error:', error);
      // Fallback to simple formatting
    }

    // Fallback: Simple intelligent formatting
    const enhancedNote = formatNote(originalText, translatedText, concepts);
    
    return NextResponse.json({
      enhanced: enhancedNote,
      summary: generateSimpleSummary(originalText),
    });
  } catch (error: any) {
    console.error('Note enhancement error:', error);
    // Always return something
    const { originalText = '', translatedText = '', concepts = [] } = await request.json().catch(() => ({}));
    return NextResponse.json({
      enhanced: formatNote(originalText, translatedText, concepts),
      summary: generateSimpleSummary(originalText),
    });
  }
}

function formatNote(
  originalText: string,
  translatedText: string,
  concepts: string[],
  summary?: string
): string {
  const lines: string[] = [];
  
  // Title (first sentence or summary)
  if (summary) {
    lines.push(`📝 ${summary}`);
  } else {
    const firstSentence = originalText.split(/[.!?]/)[0].trim();
    lines.push(`📝 ${firstSentence.substring(0, 100)}${firstSentence.length > 100 ? '...' : ''}`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  
  // Key Concepts
  if (concepts.length > 0) {
    lines.push('🔑 Key Concepts:');
    concepts.forEach(concept => {
      lines.push(`  • ${concept}`);
    });
    lines.push('');
  }
  
  // Main Points (extract sentences)
  const sentences = originalText.split(/[.!?]/).filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    lines.push('📌 Main Points:');
    sentences.slice(0, 5).forEach((sentence, idx) => {
      lines.push(`  ${idx + 1}. ${sentence.trim()}`);
    });
    lines.push('');
  }
  
  // Translation (if available)
  if (translatedText && translatedText !== originalText) {
    lines.push('🌐 Translation:');
    lines.push(translatedText.substring(0, 300));
    if (translatedText.length > 300) {
      lines.push('...');
    }
    lines.push('');
  }
  
  // Full Text Reference
  lines.push('---');
  lines.push('📄 Full Text:');
  lines.push(originalText);
  
  return lines.join('\n');
}

function generateSimpleSummary(text: string): string {
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);
  
  if (sentences.length === 0) {
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
  }
  
  // Take first 2-3 sentences as summary
  const summarySentences = sentences.slice(0, 3);
  return summarySentences.join('. ').substring(0, 200) + (text.length > 200 ? '...' : '');
}

