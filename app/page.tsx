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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Production-Ready Header */}
        <header className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent mb-2">
                ezstudy
              </h1>
              <p className="text-gray-600 text-sm font-medium">
                Academic Translation & Learning Companion for Chinese and Indonesian Students
              </p>
            </div>
            <Link
              href="/tutoring"
              className="px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-background rounded-xl hover:from-accent/90 hover:to-accent transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 font-semibold"
            >
              <Video className="h-5 w-5" />
              Start Tutoring
            </Link>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Primary Content */}
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

          {/* Sidebar */}
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

