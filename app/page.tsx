'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video } from 'lucide-react';
import TranslationPanel from '@/components/TranslationPanel';
import LanguageToggle from '@/components/LanguageToggle';
import DocumentUpload from '@/components/DocumentUpload';
import VoiceInput from '@/components/VoiceInput';
import SessionHistory from '@/components/SessionHistory';
import LiveLearningAssistant from '@/components/LiveLearningAssistant';
import type { Language, Session, Translation } from '@/types';

export default function Home() {
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('ezstudy_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed.map((s: any) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        })));
      } catch (e) {
        console.error('Failed to load sessions:', e);
      }
    }
  }, []);

  const saveSession = (translations: Translation[]) => {
    const newSession: Session = {
      id: Date.now().toString(),
      timestamp: new Date(),
      translations,
      title: translations[0]?.original.substring(0, 50) || 'Untitled Session',
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);
    localStorage.setItem('ezstudy_sessions', JSON.stringify(updatedSessions));
    setCurrentSession(newSession);
  };

  const handleLanguageChange = (source: Language, target: Language) => {
    setSourceLang(source);
    setTargetLang(target);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-text mb-2">ezstudy</h1>
              <p className="text-accent">
                Academic Translation & Learning Companion for Chinese and Indonesian Students
              </p>
            </div>
            <Link
              href="/tutoring"
              className="px-6 py-3 bg-accent text-background rounded-lg hover:bg-opacity-80 transition-colors flex items-center gap-2"
            >
              <Video className="h-5 w-5" />
              Start Tutoring
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <LanguageToggle
              sourceLang={sourceLang}
              targetLang={targetLang}
              onLanguageChange={handleLanguageChange}
            />

            <LiveLearningAssistant
              sourceLang={sourceLang}
              targetLang={targetLang}
            />

            <TranslationPanel
              sourceLang={sourceLang}
              targetLang={targetLang}
              onTranslationComplete={saveSession}
            />

            <DocumentUpload
              sourceLang={sourceLang}
              targetLang={targetLang}
              onTranslationComplete={saveSession}
            />
          </div>

          <div className="lg:col-span-1">
            <SessionHistory
              sessions={sessions}
              currentSession={currentSession}
              onSelectSession={setCurrentSession}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

