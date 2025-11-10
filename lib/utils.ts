import type { GlossaryTerm } from '@/types';

export function renderTranslationWithGlossary(
  text: string,
  glossary: GlossaryTerm[]
): string {
  let rendered = escapeHtml(text);

  // Process [translate:original] markup
  rendered = rendered.replace(
    /\[translate:([^\]]+)\]/g,
    '<span class="translate-markup">$1</span>'
  );

  // Highlight glossary terms
  glossary.forEach((term) => {
    const regex = new RegExp(
      `\\b${escapeRegex(term.term)}\\b`,
      'gi'
    );
    rendered = rendered.replace(
      regex,
      `<span class="glossary-term" data-definition="${escapeHtml(
        term.definition
      )}" title="${escapeHtml(term.definition)}">${term.term}</span>`
    );
  });

  return rendered;
}

function escapeHtml(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side: simple escape
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

