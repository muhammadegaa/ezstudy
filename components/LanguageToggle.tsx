'use client';

import type { Language } from '@/types';

interface LanguageToggleProps {
  sourceLang: Language;
  targetLang: Language;
  onLanguageChange: (source: Language, target: Language) => void;
}

export default function LanguageToggle({
  sourceLang,
  targetLang,
  onLanguageChange,
}: LanguageToggleProps) {
  const languages: { code: Language; name: string; native: string }[] = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'zh', name: 'Mandarin', native: '中文' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  ];

  const handleSwap = () => {
    onLanguageChange(targetLang, sourceLang);
  };

  return (
    <div className="bg-surface rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-text mb-2">
            Source Language
          </label>
          <select
            value={sourceLang}
            onChange={(e) =>
              onLanguageChange(e.target.value as Language, targetLang)
            }
            className="w-full px-4 py-2 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSwap}
          className="px-4 py-2 text-accent hover:text-text transition-colors"
          aria-label="Swap languages"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </button>

        <div className="flex-1">
          <label className="block text-sm font-medium text-text mb-2">
            Target Language
          </label>
          <select
            value={targetLang}
            onChange={(e) =>
              onLanguageChange(sourceLang, e.target.value as Language)
            }
            className="w-full px-4 py-2 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.native})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

