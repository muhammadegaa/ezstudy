'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, BookOpen, Save, Download } from 'lucide-react';
import type { Language } from '@/types';

interface Concept {
  name: string;
  description: string;
  searchTerms: string[];
}

interface Gif {
  id: string;
  url: string;
  title: string;
}

interface Note {
  id: string;
  timestamp: Date;
  original: string;
  translated: string;
  concepts: string[];
}

interface LiveLearningAssistantProps {
  sourceLang: Language;
  targetLang: Language;
}

export default function LiveLearningAssistant({
  sourceLang,
  targetLang,
}: LiveLearningAssistantProps) {
  const [isActive, setIsActive] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [gifs, setGifs] = useState<Map<string, Gif[]>>(new Map());
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const translationQueueRef = useRef<string[]>([]);
  const conceptAnalysisQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported in your browser. Please use Chrome or Edge.');
      setIsActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    const langMap = {
      en: 'en-GB',
      zh: 'zh-CN',
      id: 'id-ID',
    };
    recognition.lang = langMap[sourceLang] || 'en-GB';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += text + ' ';
        } else {
          interimText += text;
        }
      }

      const fullText = finalText + interimText;
      setOriginalText(fullText);

      // Real-time translation for final results
      if (finalText.trim()) {
        translateInRealTime(finalText.trim());
        analyzeConceptsInRealTime(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      if (isActive) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
        recognitionRef.current = null;
      }
    };
  }, [isActive, sourceLang]);

  const translateInRealTime = async (text: string) => {
    if (!text.trim() || sourceLang === targetLang) {
      setTranslatedText(text);
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          includeGlossary: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslatedText((prev) => {
          const updated = prev ? `${prev} ${data.translation}` : data.translation;
          return updated;
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const analyzeConceptsInRealTime = async (text: string) => {
    // Analyze smaller chunks immediately
    if (text.length < 10) return;

    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (response.ok) {
        const data = await response.json();
        const newConcepts = data.concepts || [];
        
        // Add new concepts that aren't already present
        setConcepts((prev) => {
          const existingNames = new Set(prev.map(c => c.name));
          const uniqueNew = newConcepts.filter((c: Concept) => !existingNames.has(c.name));
          return [...prev, ...uniqueNew];
        });

        // Fetch GIFs immediately for new concepts
        newConcepts.forEach((concept: Concept) => {
          fetchGifForConcept(concept);
        });
      }
    } catch (error) {
      console.error('Concept analysis error:', error);
    }
  };

  const fetchGifForConcept = async (concept: Concept) => {
    try {
      const searchTerm = concept.searchTerms[0] || concept.name;
      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        setGifs((prev) => {
          const newMap = new Map(prev);
          if (!newMap.has(concept.name) && data.gifs && data.gifs.length > 0) {
            newMap.set(concept.name, data.gifs.slice(0, 2)); // Limit to 2 GIFs per concept
          }
          return newMap;
        });
      }
    } catch (error) {
      console.error('GIF fetch error:', error);
    }
  };

  const addNote = () => {
    if (!currentNote.trim() && !originalText.trim()) return;

    const noteText = currentNote.trim() || originalText.trim();
    const note: Note = {
      id: Date.now().toString(),
      timestamp: new Date(),
      original: originalText,
      translated: translatedText,
      concepts: concepts.map(c => c.name),
    };

    setNotes((prev) => [note, ...prev]);
    setCurrentNote('');
  };

  const saveNotes = () => {
    const content = notes
      .map((note, idx) => {
        return `Note ${idx + 1} - ${note.timestamp.toLocaleTimeString()}\n` +
               `Original: ${note.original}\n` +
               `Translated: ${note.translated}\n` +
               `Concepts: ${note.concepts.join(', ')}\n\n`;
      })
      .join('---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezstudy-notes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="bg-surface rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Live Learning Assistant</h3>
            <p className="text-xs text-accent">Real-time translation, concepts & notes</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${
              isActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-accent text-background hover:bg-opacity-80'
            }`}
          >
            {isActive ? (
              <>
                <MicOff className="h-5 w-5" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5" />
                Start Listening
              </>
            )}
          </button>
        </div>

        {isActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Original Text */}
            <div className="bg-background rounded p-3 min-h-[150px] max-h-[200px] overflow-y-auto">
              <div className="text-xs font-semibold text-accent mb-2">Original ({sourceLang})</div>
              <p className="text-sm text-text whitespace-pre-wrap">
                {originalText || (
                  <span className="text-accent flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Listening...
                  </span>
                )}
              </p>
            </div>

            {/* Translated Text */}
            <div className="bg-background rounded p-3 min-h-[150px] max-h-[200px] overflow-y-auto">
              <div className="text-xs font-semibold text-accent mb-2">
                Translation ({targetLang})
                {isTranslating && <Loader2 className="h-3 w-3 inline-block ml-2 animate-spin" />}
              </div>
              <p className="text-sm text-text whitespace-pre-wrap">
                {translatedText || (
                  <span className="text-accent">Translation will appear here...</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Aids - Show immediately */}
      {isActive && concepts.length > 0 && (
        <div className="bg-surface rounded-lg p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4" />
            Visual References (Live)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {concepts.slice(0, 8).map((concept) => {
              const conceptGifs = gifs.get(concept.name) || [];
              return (
                <div
                  key={concept.name}
                  className="bg-background rounded-lg p-2 border border-accent/30"
                >
                  <div className="text-xs font-semibold text-text mb-1 truncate">
                    {concept.name}
                  </div>
                  {conceptGifs.length > 0 ? (
                    <div className="aspect-video rounded overflow-hidden bg-black">
                      <img
                        src={conceptGifs[0].url}
                        alt={concept.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded bg-accent/20 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Note Taking */}
      {isActive && (
        <div className="bg-surface rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Active Notes
            </h4>
            {notes.length > 0 && (
              <button
                onClick={saveNotes}
                className="px-3 py-1 text-xs bg-accent text-background rounded hover:bg-opacity-80 transition-colors flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Save ({notes.length})
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Add your own notes here... (or click 'Add Note' to save current transcription)"
              className="w-full px-3 py-2 rounded border border-accent bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={3}
            />
            <button
              onClick={addNote}
              className="w-full px-4 py-2 bg-accent text-background rounded hover:bg-opacity-80 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Add Note
            </button>
          </div>

          {notes.length > 0 && (
            <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-background rounded p-2 text-xs border border-accent/20"
                >
                  <div className="text-accent font-semibold mb-1">
                    {note.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-text">{note.original.substring(0, 100)}...</div>
                  {note.concepts.length > 0 && (
                    <div className="text-accent mt-1">
                      Concepts: {note.concepts.slice(0, 3).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

