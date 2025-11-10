'use client';

import { useState } from 'react';
import { Clock, Download, Trash2, FileText } from 'lucide-react';
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
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Session History</h2>
            <p className="text-xs text-gray-500">{sessions.length} saved</p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No sessions yet</p>
          <p className="text-xs text-gray-400 mt-1">Your translation sessions will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`rounded-xl p-4 cursor-pointer transition-all border-2 ${
                currentSession?.id === session.id
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }`}
              onClick={() => {
                onSelectSession(session);
                setExpandedId(expandedId === session.id ? null : session.id);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1.5 line-clamp-1">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(session.timestamp)}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-md font-medium">
                      {session.translations.length} {session.translations.length === 1 ? 'translation' : 'translations'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => exportSession(session)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                    aria-label="Export session"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {expandedId === session.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-slide-up">
                  {session.translations.map((translation, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Original</span>
                          <p className="text-gray-900 mt-1 leading-relaxed">{translation.original}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Translated</span>
                          <div
                            className="text-gray-900 mt-1 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: renderTranslationWithGlossary(
                                translation.translated,
                                translation.glossary || []
                              ),
                            }}
                          />
                        </div>
                      </div>
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
