'use client';

import { ArrowLeftRight } from 'lucide-react';
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
  const languages: { code: Language; name: string; native: string; flag: string }[] = [
    { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
    { code: 'zh', name: 'Mandarin', native: '中文', flag: '🇨🇳' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  ];

  const handleSwap = () => {
    onLanguageChange(targetLang, sourceLang);
  };

  const sourceLangData = languages.find(l => l.code === sourceLang);
  const targetLangData = languages.find(l => l.code === targetLang);

  return (
    <div className="card">
      <div className="flex items-center gap-4">
        {/* Source Language */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            From
          </label>
          <div className="relative">
            <select
              value={sourceLang}
              onChange={(e) =>
                onLanguageChange(e.target.value as Language, targetLang)
              }
              className="input appearance-none pr-10 font-medium text-gray-900 cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="mt-8 p-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all transform hover:scale-110 min-w-[44px] min-h-[44px]"
          aria-label="Swap languages"
        >
          <ArrowLeftRight className="h-5 w-5" />
        </button>

        {/* Target Language */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            To
          </label>
          <div className="relative">
            <select
              value={targetLang}
              onChange={(e) =>
                onLanguageChange(sourceLang, e.target.value as Language)
              }
              className="input appearance-none pr-10 font-medium text-gray-900 cursor-pointer"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
