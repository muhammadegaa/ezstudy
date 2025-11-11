'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Video, Sparkles, BookOpen, Zap, Globe, Loader2, User, LogOut } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import dynamic from 'next/dynamic';
import SessionHistory from '@/components/SessionHistory';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/lib/firebase/auth';
import AuthModal from '@/components/Auth/AuthModal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import type { Language, Session, Translation } from '@/types';

// Lazy load LiveLearningAssistant (heavy component)
const LiveLearningAssistant = dynamic(() => import('@/components/LiveLearningAssistant'), {
  loading: () => (
    <div className="card p-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    </div>
  ),
  ssr: false,
});

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
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
      {/* Production-Grade Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ezstudy
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Academic Translation & Learning Companion
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-3">
              <Link
                href="/tutoring"
                className="px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 font-semibold text-sm"
              >
                <Video className="h-4 w-4" />
                Find Tutors
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/tutoring"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all font-semibold text-sm"
                  >
                    <Avatar
                      src={user.photoURL || undefined}
                      name={user.displayName || user.email || 'User'}
                      size="sm"
                    />
                    <span className="hidden sm:inline">{user.displayName || user.email?.split('@')[0]}</span>
                  </Link>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    leftIcon={<LogOut className="h-4 w-4" />}
                  >
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthMode('signup');
                      setShowAuthModal(true);
                    }}
                    variant="primary"
                    size="sm"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Real-time Translation for
            <span className="block text-primary-600">
              Academic Success
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Translate lectures instantly at speech speed, understand concepts with visual aids, and take smart notes—all in real-time.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary-600" />
              <span>Speech-speed</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary-600" />
              <span>Multi-language</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary-600" />
              <span>AI-powered</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Primary Content - 8 columns */}
          <div className="lg:col-span-8 space-y-6">
            {/* Language Selector */}
            <div className="card card-hover">
              <LanguageToggle
                sourceLang={sourceLang}
                targetLang={targetLang}
                onLanguageChange={handleLanguageChange}
              />
            </div>

            {/* Live Learning Assistant - Main Feature */}
            <LiveLearningAssistant
              sourceLang={sourceLang}
              targetLang={targetLang}
            />
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            <SessionHistory
              sessions={sessions}
              currentSession={currentSession}
              onSelectSession={setCurrentSession}
            />
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </main>
  );
}
