'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, BookOpen, Save, Download, Sparkles, Copy, CheckCircle2, AlertCircle, Wand2 } from 'lucide-react';
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
  enhanced?: string;
  summary?: string;
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
  const [speechText, setSpeechText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [gifs, setGifs] = useState<Map<string, Gif[]>>(new Map());
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEnhancingNote, setIsEnhancingNote] = useState(false);
  const [enhancingNoteId, setEnhancingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cumulativeTextRef = useRef('');
  const translateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const permissionCheckedRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Check if microphone permission is already granted (silent check)
  useEffect(() => {
    if (permissionCheckedRef.current) return;
    permissionCheckedRef.current = true;

    const checkPermission = async () => {
      try {
        // Try to get microphone access - this confirms permission is actually working
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getAudioTracks();
        if (tracks.length > 0 && tracks[0].readyState === 'live') {
          // Permission is granted AND microphone is actually working
          setHasMicrophone(true);
          stream.getTracks().forEach(track => track.stop());
        } else {
          setHasMicrophone(false);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (e: any) {
        // Permission not granted or error
        setHasMicrophone(false);
      }
    };

    checkPermission();
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
        recognitionRef.current = null;
      }
      return;
    }

    // CRITICAL: Verify microphone permission is actually working before starting
    const verifyAndStart = async () => {
      try {
        // Double-check permission is actually working
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const tracks = stream.getAudioTracks();
        if (tracks.length === 0 || tracks[0].readyState !== 'live') {
          setError('Microphone is not working. Please check your microphone connection.');
          setHasMicrophone(false);
          setIsActive(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        stream.getTracks().forEach(track => track.stop());
        setHasMicrophone(true);
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (e.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(`Microphone error: ${e.message || e.name}`);
        }
        setHasMicrophone(false);
        setIsActive(false);
        return;
      }

      // Permission verified, now start recognition
      if (isSupported === false) {
        setError('Speech recognition requires Chrome, Edge, or Safari.');
        setIsActive(false);
        return;
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError('Speech recognition not available');
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

      recognition.onstart = () => {
        setError(null);
        setIsRequestingPermission(false);
        setHasMicrophone(true);
      };

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
      cumulativeTextRef.current = cumulativeTextRef.current + ' ' + finalText;
      setSpeechText(cumulativeTextRef.current.trim() + ' ' + interimText);
      
      const combinedText = cumulativeTextRef.current.trim() + ' ' + interimText;
      setOriginalText(combinedText);

      if (finalText.trim()) {
        translateInRealTime.current(finalText.trim());
        analyzeConceptsInRealTime.current(finalText.trim());
      }
    };

      recognition.onerror = (event: any) => {
      setIsRequestingPermission(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Click the microphone icon in your browser address bar to allow access.');
        setHasMicrophone(false);
        setIsActive(false);
      } else if (event.error === 'no-speech') {
        // Normal - restart silently
        setHasMicrophone(true);
        if (isActive && recognitionRef.current) {
          setTimeout(() => {
            try {
              if (recognitionRef.current && isActive) {
                recognitionRef.current.start();
              }
            } catch (e) {
              // Ignore
            }
          }, 1000);
        }
      } else if (event.error === 'aborted') {
        setHasMicrophone(true);
      } else if (event.error === 'audio-capture') {
        setError('Microphone not found. Please connect a microphone.');
        setHasMicrophone(false);
        setIsActive(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your connection.');
        setHasMicrophone(true);
        setIsActive(false);
      } else {
        setHasMicrophone(true);
        if (isActive && recognitionRef.current && event.error !== 'bad-grammar' && event.error !== 'language-not-supported') {
          setTimeout(() => {
            try {
              if (recognitionRef.current && isActive) {
                recognitionRef.current.start();
              }
            } catch (e) {
              // Ignore
            }
          }, 1000);
        }
      }
    };

      recognition.onend = () => {
      setIsRequestingPermission(false);
      if (isActive && recognitionRef.current) {
        setTimeout(() => {
          try {
            if (recognitionRef.current && isActive) {
              recognitionRef.current.start();
            }
          } catch (e) {
            setIsActive(false);
          }
        }, 300);
      }
    };

      recognitionRef.current = recognition;
      
      setIsRequestingPermission(true);
      setTimeout(() => {
        if (!isActive || !recognitionRef.current) return;
        
        try {
          recognitionRef.current.start();
          setHasMicrophone(true);
        } catch (e: any) {
          setIsRequestingPermission(false);
          if (e.message && e.message.includes('already started')) {
            setHasMicrophone(true);
          } else if (e.message && e.message.includes('not-allowed') || e.name === 'NotAllowedError') {
            setError('Microphone permission denied. Please refresh the page and allow microphone access.');
            setHasMicrophone(false);
            setIsActive(false);
          } else {
            setError(`Failed to start: ${e.message || 'Unknown error'}`);
            setHasMicrophone(false);
            setIsActive(false);
          }
        }
      }, 200);

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
    };

    verifyAndStart();
  }, [isActive, sourceLang, targetLang, isSupported]);

  const translateInRealTime = useRef(async (text: string) => {
    if (!text.trim()) return;
    
    if (sourceLang === targetLang) {
      setTranslatedText((prev) => {
        const updated = prev ? `${prev} ${text}` : text;
        return updated;
      });
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          sourceLang,
          targetLang,
          includeGlossary: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslatedText((prev) => {
          const updated = prev ? `${prev} ${data.translation || text}` : (data.translation || text);
          return updated;
        });
      } else {
        // Still show something
        setTranslatedText((prev) => {
          return prev ? `${prev} ${text}` : text;
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Show original text if translation fails
      setTranslatedText((prev) => {
        return prev ? `${prev} ${text}` : text;
      });
    } finally {
      setIsTranslating(false);
    }
  });

  const analyzeConceptsInRealTime = useRef(async (text: string) => {
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
        
        setConcepts((prev) => {
          const existingNames = new Set(prev.map(c => c.name));
          const uniqueNew = newConcepts.filter((c: Concept) => !existingNames.has(c.name));
          return [...prev, ...uniqueNew];
        });

        newConcepts.forEach((concept: Concept) => {
          fetchGifForConcept(concept);
        });
      }
    } catch (error) {
      console.error('Concept analysis error:', error);
      // Don't break UI - just continue
    }
  });

  // Update refs when languages change
  useEffect(() => {
    translateInRealTime.current = async (text: string) => {
      if (!text.trim()) return;
      
      if (sourceLang === targetLang) {
        setTranslatedText((prev) => {
          const updated = prev ? `${prev} ${text}` : text;
          return updated;
        });
        return;
      }

      setIsTranslating(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text.trim(),
            sourceLang,
            targetLang,
            includeGlossary: false,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const translation = data.translation || text;
          setTranslatedText((prev) => {
            const updated = prev ? `${prev} ${translation}` : translation;
            return updated;
          });
        } else {
          // Still show original text
          setTranslatedText((prev) => {
            return prev ? `${prev} ${text}` : text;
          });
        }
      } catch (error) {
        console.error('Translation error:', error);
        // Always show something - never leave blank
        setTranslatedText((prev) => {
          return prev ? `${prev} ${text}` : text;
        });
      } finally {
        setIsTranslating(false);
      }
    };

    analyzeConceptsInRealTime.current = async (text: string) => {
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
          
          setConcepts((prev) => {
            const existingNames = new Set(prev.map(c => c.name));
            const uniqueNew = newConcepts.filter((c: Concept) => !existingNames.has(c.name));
            return [...prev, ...uniqueNew];
          });

          newConcepts.forEach((concept: Concept) => {
            fetchGifForConcept(concept);
          });
        }
      } catch (error) {
        console.error('Concept analysis error:', error);
      }
    };
  }, [sourceLang, targetLang]);

  const fetchGifForConcept = async (concept: Concept) => {
    // Only fetch GIFs for concepts that actually need visual aids
    // Skip common words and non-visualizable concepts
    const commonWords = ['plus', 'minus', 'showcases', 'section', 'chapter', 'example', 'evolution'];
    const lowerName = concept.name.toLowerCase();
    
    if (commonWords.some(word => lowerName.includes(word))) {
      return; // Don't fetch GIFs for common words
    }

    try {
      const searchTerm = concept.searchTerms[0] || concept.name;
      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        // Only set GIFs if we actually got results
        if (data.gifs && data.gifs.length > 0) {
          setGifs((prev) => {
            const newMap = new Map(prev);
            if (!newMap.has(concept.name)) {
              newMap.set(concept.name, data.gifs.slice(0, 2));
            }
            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('GIF fetch error:', error);
    }
  };

  const addNote = () => {
    if (!currentNote.trim() && !originalText.trim() && !speechText.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      timestamp: new Date(),
      original: originalText || speechText || currentNote,
      translated: translatedText,
      concepts: concepts.map(c => c.name),
    };

    setNotes((prev) => [note, ...prev]);
    setCurrentNote('');
  };

  const enhanceNoteWithAI = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note || note.enhanced) return; // Already enhanced

    setIsEnhancingNote(true);
    setEnhancingNoteId(noteId);

    try {
      const response = await fetch('/api/enhance-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: note.original,
          translatedText: note.translated,
          concepts: note.concepts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? { ...n, enhanced: data.enhanced, summary: data.summary }
              : n
          )
        );
      } else {
        // Fallback: simple formatting
        const simpleEnhanced = formatNoteSimply(note.original, note.translated, note.concepts);
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, enhanced: simpleEnhanced } : n
          )
        );
      }
    } catch (error) {
      console.error('Note enhancement error:', error);
      // Fallback: simple formatting
      const simpleEnhanced = formatNoteSimply(note.original, note.translated, note.concepts);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId ? { ...n, enhanced: simpleEnhanced } : n
        )
      );
    } finally {
      setIsEnhancingNote(false);
      setEnhancingNoteId(null);
    }
  };

  const formatNoteSimply = (original: string, translated: string, concepts: string[]): string => {
    const lines: string[] = [];
    const firstSentence = original.split(/[.!?]/)[0].trim();
    lines.push(`📝 ${firstSentence.substring(0, 100)}${firstSentence.length > 100 ? '...' : ''}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    if (concepts.length > 0) {
      lines.push('🔑 Key Concepts:');
      concepts.forEach(c => lines.push(`  • ${c}`));
      lines.push('');
    }
    lines.push('📌 Main Points:');
    const sentences = original.split(/[.!?]/).filter(s => s.trim().length > 20);
    sentences.slice(0, 5).forEach((s, idx) => {
      lines.push(`  ${idx + 1}. ${s.trim()}`);
    });
    lines.push('');
    if (translated && translated !== original) {
      lines.push('🌐 Translation:');
      lines.push(translated.substring(0, 300));
      lines.push('');
    }
    lines.push('---');
    lines.push('📄 Full Text:');
    lines.push(original);
    return lines.join('\n');
  };

  const saveNotes = () => {
    const content = notes
      .map((note, idx) => {
        let noteContent = `Note ${idx + 1} - ${note.timestamp.toLocaleTimeString()}\n`;
        if (note.enhanced) {
          noteContent += `\n${note.enhanced}\n`;
        } else {
          noteContent += `Original: ${note.original}\n` +
                         `Translated: ${note.translated}\n` +
                         `Concepts: ${note.concepts.join(', ')}\n`;
        }
        return noteContent;
      })
      .join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezstudy-notes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggle = async () => {
    if (!isActive) {
      setError(null);
      cumulativeTextRef.current = '';
      setSpeechText('');
      setTranslatedText('');
      setConcepts([]);
      setGifs(new Map());
      setIsActive(true);
    } else {
      setIsActive(false);
      setIsRequestingPermission(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore
        }
      }
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const langNames = {
    en: 'English',
    zh: '中文',
    id: 'Bahasa Indonesia',
  };

  return (
    <div className="space-y-6">
      {/* Main Translation Interface - Production Ready */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Translation</h2>
              <p className="text-xs text-gray-500 mt-0.5">Real-time speech-to-text translation</p>
            </div>
            
            <button
              onClick={handleToggle}
              disabled={isRequestingPermission || isSupported === false}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-sm'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : isActive ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  Start Listening
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message - Only show if actually needed */}
        {error && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">{error}</p>
            </div>
          </div>
        )}

        {/* Translation Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-100">
          {/* Source */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {langNames[sourceLang]}
              </span>
              {originalText && (
                <button
                  onClick={() => copyText(originalText)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <textarea
              value={originalText}
              onChange={(e) => {
                const text = e.target.value;
                setOriginalText(text);
                setSpeechText('');
                cumulativeTextRef.current = '';
                
                if (translateTimeoutRef.current) {
                  clearTimeout(translateTimeoutRef.current);
                }
                
                if (text.trim()) {
                  translateTimeoutRef.current = setTimeout(() => {
                    translateInRealTime.current(text.trim());
                    analyzeConceptsInRealTime.current(text.trim());
                  }, 800);
                } else {
                  setTranslatedText('');
                }
              }}
              placeholder={isActive ? "Listening... or type here" : "Type or paste text here..."}
              className="w-full min-h-[280px] text-base text-gray-900 placeholder-gray-400 border-0 focus:outline-none resize-none bg-transparent"
              rows={12}
            />
            {isActive && speechText && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700">Live Speech</span>
                </div>
                <p className="text-sm text-green-800">{speechText}</p>
              </div>
            )}
          </div>

          {/* Target */}
          <div className="p-6 bg-gray-50/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {langNames[targetLang]}
              </span>
              {translatedText && (
                <button
                  onClick={() => copyText(translatedText)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="min-h-[280px]">
              {isTranslating ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Translating...</span>
                </div>
              ) : translatedText ? (
                <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed">{translatedText}</p>
              ) : (
                <p className="text-base text-gray-400">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Aids */}
      {concepts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">Visual References</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
              {concepts.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {concepts.slice(0, 8).map((concept) => {
              const conceptGifs = gifs.get(concept.name) || [];
              return (
                <div
                  key={concept.name}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="text-xs font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]">
                    {concept.name}
                  </div>
                  {conceptGifs.length > 0 ? (
                    <div className="aspect-video rounded overflow-hidden bg-gray-100">
                      <img
                        src={conceptGifs[0].url}
                        alt={concept.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">Notes</h3>
            {notes.length > 0 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {notes.length}
              </span>
            )}
          </div>
          {notes.length > 0 && (
            <button
              onClick={saveNotes}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Add your notes here..."
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
            rows={3}
          />
          <button
            onClick={addNote}
            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Note
          </button>
        </div>

        {notes.length > 0 && (
          <div className="mt-4 space-y-2 max-h-[300px] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-gray-500 font-medium">
                      {note.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {!note.enhanced && (
                    <button
                      onClick={() => enhanceNoteWithAI(note.id)}
                      disabled={isEnhancingNote && enhancingNoteId === note.id}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isEnhancingNote && enhancingNoteId === note.id ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3 w-3" />
                          Enhance with AI
                        </>
                      )}
                    </button>
                  )}
                </div>
                {note.enhanced ? (
                  <div className="space-y-2">
                    <div className="text-gray-900 whitespace-pre-wrap text-xs font-medium bg-white p-2 rounded border border-gray-200">
                      {note.enhanced}
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob([note.enhanced || ''], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `enhanced-note-${note.id}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      Download Enhanced Note
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-gray-900 line-clamp-2">{note.original.substring(0, 100)}...</div>
                    {note.concepts.length > 0 && (
                      <div className="text-gray-500 mt-1 text-xs">
                        {note.concepts.slice(0, 3).join(' • ')}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
