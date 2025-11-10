'use client';

import { useState } from 'react';
import { Clock, Download, Trash2 } from 'lucide-react';
import type { Session } from '@/types';
import { renderTranslationWithGlossary } from '@/lib/utils';

interface SessionHistoryProps {
  sessions: Session[];
  currentSession: Session | null;
  onSelectSession: (session: Session | null) => void;
}

export default function SessionHistory({
  sessions,
  currentSession,
  onSelectSession,
}: SessionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const exportSession = (session: Session) => {
    const content = session.translations
      .map((t, idx) => {
        return `Translation ${idx + 1}:\nOriginal: ${t.original}\nTranslated: ${t.translated}\n\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezstudy-session-${session.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSession = (id: string) => {
    if (confirm('Delete this session?')) {
      const updated = sessions.filter((s) => s.id !== id);
      localStorage.setItem('ezstudy_sessions', JSON.stringify(updated));
      if (currentSession?.id === id) {
        onSelectSession(null);
      }
      window.location.reload();
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Session History
      </h2>

      {sessions.length === 0 ? (
        <p className="text-sm text-accent">No sessions yet</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                currentSession?.id === session.id
                  ? 'border-accent bg-background'
                  : 'border-accent/50 hover:border-accent'
              }`}
              onClick={() => {
                onSelectSession(session);
                setExpandedId(expandedId === session.id ? null : session.id);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text text-sm truncate">
                    {session.title}
                  </h3>
                  <p className="text-xs text-accent mt-1">
                    {formatDate(session.timestamp)} • {session.translations.length}{' '}
                    translation{session.translations.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => exportSession(session)}
                    className="p-1 text-accent hover:text-text transition-colors"
                    aria-label="Export session"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedId === session.id && (
                <div className="mt-3 pt-3 border-t border-accent/50 space-y-3">
                  {session.translations.map((translation, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-text mb-1">
                        <strong>Original:</strong> {translation.original}
                      </p>
                      <div
                        className="text-text"
                        dangerouslySetInnerHTML={{
                          __html: `<strong>Translated:</strong> ${renderTranslationWithGlossary(
                            translation.translated,
                            translation.glossary || []
                          )}`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

