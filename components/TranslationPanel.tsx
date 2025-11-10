'use client';

import { useState, useEffect } from 'react';
import { Mic, Send } from 'lucide-react';
import type { Language, Translation } from '@/types';
import { renderTranslationWithGlossary } from '@/lib/utils';

interface TranslationPanelProps {
  sourceLang: Language;
  targetLang: Language;
  onTranslationComplete: (translations: Translation[]) => void;
}

export default function TranslationPanel({
  sourceLang,
  targetLang,
  onTranslationComplete,
}: TranslationPanelProps) {
  const [inputText, setInputText] = useState('');
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSetInputText = (e: CustomEvent) => {
      setInputText(e.detail);
    };

    window.addEventListener('setInputText' as any, handleSetInputText as EventListener);
    return () => {
      window.removeEventListener('setInputText' as any, handleSetInputText as EventListener);
    };
  }, []);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          sourceLang,
          targetLang,
          includeGlossary: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const newTranslation: Translation = {
        original: inputText,
        translated: data.translation,
        language: targetLang,
        glossary: data.glossary?.map((g: any) => ({
          ...g,
          language: targetLang,
        })),
      };

      setTranslation(newTranslation);
      onTranslationComplete([newTranslation]);
    } catch (err: any) {
      setError(err.message || 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleTranslate();
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-text">Translation</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Input ({sourceLang === 'en' ? 'English' : sourceLang === 'zh' ? '中文' : 'Bahasa Indonesia'})
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter text to translate..."
            className="w-full px-4 py-3 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            rows={6}
          />
          <p className="text-xs text-accent mt-1">
            Press Cmd/Ctrl + Enter to translate
          </p>
        </div>

        <button
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
          className="w-full px-4 py-3 bg-accent text-background rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            'Translating...'
          ) : (
            <>
              <Send className="h-4 w-4" />
              Translate
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}

        {translation && (
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Translation ({targetLang === 'en' ? 'English' : targetLang === 'zh' ? '中文' : 'Bahasa Indonesia'})
            </label>
            <div
              className="w-full px-4 py-3 rounded border border-accent bg-background text-text min-h-[150px]"
              dangerouslySetInnerHTML={{
                __html: renderTranslationWithGlossary(
                  translation.translated,
                  translation.glossary || []
                ),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

