import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx and tailwind-merge for optimal class handling
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Render translation text with glossary terms highlighted
 */
export function renderTranslationWithGlossary(
  text: string,
  glossary: Array<{ term: string; definition: string; context: string }>
): string {
  if (!text || glossary.length === 0) {
    return escapeHtml(text || '');
  }

  let result = escapeHtml(text);

  // Sort glossary terms by length (longest first) to avoid partial matches
  const sortedGlossary = [...glossary].sort((a, b) => b.term.length - a.term.length);

  for (const item of sortedGlossary) {
    const term = escapeHtml(item.term);
    const definition = escapeHtml(item.definition);
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(
      regex,
      `<span class="glossary-term" data-definition="${definition}" tabindex="0" role="button" aria-label="Glossary term: ${term}">${term}</span>`
    );
  }

  return result;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  // Fallback for server-side rendering
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
