'use client';

import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Language } from '@/types';

interface VoiceOutputProps {
  text: string;
  language: Language;
}

export default function VoiceOutput({ text, language }: VoiceOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = () => {
    if (!text.trim() || !('speechSynthesis' in window)) {
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language based on target language
    const langMap: Record<Language, string> = {
      en: 'en-GB', // UK English
      zh: 'zh-CN',
      id: 'id-ID',
    };
    utterance.lang = langMap[language] || 'en-GB';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!('speechSynthesis' in window)) {
    return null;
  }

  return (
    <button
      onClick={isSpeaking ? stop : speak}
      disabled={!text.trim()}
      className="px-4 py-2 rounded-lg bg-accent text-background hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
      aria-label={isSpeaking ? 'Stop speaking' : 'Play translation'}
    >
      {isSpeaking ? (
        <>
          <VolumeX className="h-4 w-4" />
          Stop
        </>
      ) : (
        <>
          <Volume2 className="h-4 w-4" />
          Listen
        </>
      )}
    </button>
  );
}

