import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit';

// AI-powered note enhancement with professional formatting
// Creates structured, well-formatted notes suitable for academic use

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

    // Use Hugging Face Inference API (free tier)
    // Fallback to intelligent formatting if API fails
    
    let summary: string | null = null;
    
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: originalText.substring(0, 1000),
            parameters: {
              max_length: 150,
              min_length: 40,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0].summary_text) {
          summary = data[0].summary_text;
        }
      }
    } catch (error) {
      console.error('Hugging Face API error:', error);
      // Fallback to simple summary
      summary = generateSimpleSummary(originalText);
    }

    if (!summary) {
      summary = generateSimpleSummary(originalText);
    }

    // Format the enhanced note with professional structure
    const enhancedNote = formatNoteProfessionally(originalText, translatedText, concepts, summary);
    
    return NextResponse.json({
      enhanced: enhancedNote,
      summary: summary,
    });
  } catch (error: any) {
    console.error('Note enhancement error:', error);
    // Always return formatted note
    const { originalText = '', translatedText = '', concepts = [] } = await request.json().catch(() => ({}));
    const summary = generateSimpleSummary(originalText);
    return NextResponse.json({
      enhanced: formatNoteProfessionally(originalText, translatedText, concepts, summary),
      summary: summary,
    });
  }
}

function formatNoteProfessionally(
  originalText: string,
  translatedText: string,
  concepts: string[],
  summary: string
): string {
  const sections: string[] = [];
  
  // Header
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('                        NOTE SUMMARY');
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('');
  
  // Summary Section
  sections.push('📋 SUMMARY');
  sections.push('───────────────────────────────────────────────────────────');
  sections.push(summary.trim());
  sections.push('');
  
  // Key Concepts Section
  if (concepts.length > 0) {
    sections.push('🔑 KEY CONCEPTS');
    sections.push('───────────────────────────────────────────────────────────');
    concepts.forEach((concept, idx) => {
      sections.push(`${idx + 1}. ${concept}`);
    });
    sections.push('');
  }
  
  // Main Points Section
  const sentences = originalText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  
  if (sentences.length > 0) {
    sections.push('📌 MAIN POINTS');
    sections.push('───────────────────────────────────────────────────────────');
    sentences.slice(0, 6).forEach((sentence, idx) => {
      sections.push(`${idx + 1}. ${sentence}`);
    });
    if (sentences.length > 6) {
      sections.push(`   ... and ${sentences.length - 6} more points`);
    }
    sections.push('');
  }
  
  // Translation Section (if different from original)
  if (translatedText && translatedText !== originalText && translatedText.trim().length > 0) {
    sections.push('🌐 TRANSLATION');
    sections.push('───────────────────────────────────────────────────────────');
    const translationPreview = translatedText.length > 400 
      ? translatedText.substring(0, 400) + '...'
      : translatedText;
    sections.push(translationPreview);
    sections.push('');
  }
  
  // Full Text Reference
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push('                        FULL TEXT');
  sections.push('═══════════════════════════════════════════════════════════');
  sections.push(originalText);
  sections.push('');
  sections.push('═══════════════════════════════════════════════════════════');
  
  return sections.join('\n');
}

function generateSimpleSummary(text: string): string {
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
  
  if (sentences.length === 0) {
    return text.substring(0, 120).trim() + (text.length > 120 ? '...' : '');
  }
  
  // Take first 2-3 meaningful sentences as summary
  const summarySentences = sentences.slice(0, 3);
  const summary = summarySentences.join('. ').trim();
  
  return summary.substring(0, 200).trim() + (summary.length > 200 ? '...' : '');
}
