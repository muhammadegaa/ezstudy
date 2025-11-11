'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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

      // Ultra-fast real-time translation - immediate for speech speed
      if (finalText.trim()) {
        // No delay - translate immediately for speech-speed response
        translateInRealTime.current(finalText.trim());
        // Concepts can be slightly delayed (not critical for speed)
        setTimeout(() => {
          analyzeConceptsInRealTime.current(finalText.trim());
        }, 50);
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
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Ultra-fast timeout for speech-speed
        
        // Optimized fetch with no-cache for fastest response
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
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
      {/* Main Translation Interface - Production-Grade Design */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        {/* Professional Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mic className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Live Translation</h2>
                <p className="text-xs text-gray-500 font-medium">Speech-speed real-time translation</p>
              </div>
            </div>
            
            <button
              onClick={handleToggle}
              disabled={isRequestingPermission || isSupported === false}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 ${
                isActive
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : isActive ? (
                <>
                  <MicOff className="h-4 w-4" />
                  Stop Listening
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

        {/* Error Message - Professional styling */}
        {error && (
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
              <p className="text-sm font-medium text-amber-900">{error}</p>
            </div>
          </div>
        )}

        {/* Translation Area - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {/* Source */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {langNames[sourceLang]}
                </span>
              </div>
              {originalText && (
                <button
                  onClick={() => copyText(originalText)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-all group"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
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
                  // Ultra-fast translation - 100ms debounce for near-instant speech-speed translation
                  translateTimeoutRef.current = setTimeout(() => {
                    translateInRealTime.current(text.trim());
                    analyzeConceptsInRealTime.current(text.trim());
                  }, 100);
                } else {
                  setTranslatedText('');
                }
              }}
              placeholder={isActive ? "Listening... or type here" : "Type or paste text here..."}
              className="w-full min-h-[320px] text-lg text-gray-900 placeholder-gray-400 border-0 focus:outline-none resize-none bg-transparent font-medium leading-relaxed"
              rows={14}
            />
            {isActive && speechText && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 animate-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Live Speech</span>
                </div>
                <p className="text-sm text-green-900 font-medium leading-relaxed">{speechText}</p>
              </div>
            )}
          </div>

          {/* Target */}
          <div className="p-6 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {langNames[targetLang]}
                </span>
              </div>
              {translatedText && (
                <button
                  onClick={() => copyText(translatedText)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-all group"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                </button>
              )}
            </div>
            <div className="min-h-[320px]">
              {isTranslating ? (
                <div className="flex items-center gap-3 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                  <span className="text-sm font-medium">Translating...</span>
                </div>
              ) : translatedText ? (
                <p className="text-lg text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">{translatedText}</p>
              ) : (
                <p className="text-lg text-gray-400 italic">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Aids */}
      {concepts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md ring-2 ring-purple-100">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Visual References</h3>
              <p className="text-xs text-gray-500 font-medium">Concepts that benefit from visual aids</p>
            </div>
            <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
              {concepts.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {concepts.slice(0, 8).map((concept) => {
              const conceptGifs = gifs.get(concept.name) || [];
              return (
                <div
                  key={concept.name}
                  className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-primary-300 hover:shadow-md transition-all transform hover:-translate-y-1 group"
                >
                  <div className="text-sm font-bold text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors">
                    {concept.name}
                  </div>
                          {conceptGifs.length > 0 ? (
                            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm relative">
                              <Image
                                src={conceptGifs[0].url}
                                alt={`Visual aid for ${concept.name}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 25vw"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md ring-2 ring-amber-100">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Notes</h3>
              <p className="text-xs text-gray-500 font-medium">AI-powered note enhancement</p>
            </div>
            {notes.length > 0 && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                {notes.length}
              </span>
            )}
          </div>
          {notes.length > 0 && (
            <button
              onClick={saveNotes}
              className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all flex items-center gap-2 text-sm font-semibold border border-gray-200 shadow-sm hover:shadow-md"
            >
              <Download className="h-4 w-4" />
              Export All
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          <textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Add your notes here..."
            className="input resize-none"
            rows={4}
          />
          <button
            onClick={addNote}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            <Save className="h-4 w-4" />
            Save Note
          </button>
        </div>

        {notes.length > 0 && (
          <div className="mt-6 space-y-3 max-h-[400px] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-primary-400 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-semibold text-gray-600">
                      {note.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {!note.enhanced && (
                    <button
                      onClick={() => enhanceNoteWithAI(note.id)}
                      disabled={isEnhancingNote && enhancingNoteId === note.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-all flex items-center gap-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-purple-200 shadow-sm hover:shadow-md"
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
                  <div className="space-y-4">
                    {/* Professional formatted note display */}
                    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                      <div className="prose prose-sm max-w-none">
                        {note.enhanced.split('\n').map((line, idx) => {
                          // Style different sections professionally
                          if (line.includes('═══════════════════════════════════════════════════════════')) {
                            return <div key={idx} className="text-gray-300 font-mono text-xs py-2 border-b border-gray-200">{line}</div>;
                          }
                          if (line.includes('───────────────────────────────────────────────────────────')) {
                            return <div key={idx} className="text-gray-200 py-1 border-b border-gray-100">{line}</div>;
                          }
                          if (line.match(/^[📋🔑📌🌐📄]/)) {
                            return <div key={idx} className="text-primary-700 font-bold text-base mt-6 mb-3 first:mt-0">{line}</div>;
                          }
                          if (line.match(/^\d+\./)) {
                            return <div key={idx} className="text-gray-800 ml-6 py-1 text-sm leading-relaxed">{line}</div>;
                          }
                          if (line.trim() === '') {
                            return <div key={idx} className="h-3"></div>;
                          }
                          // Regular content
                          if (line.trim().length > 0) {
                            return <div key={idx} className="text-gray-700 py-1 text-sm leading-relaxed">{line}</div>;
                          }
                          return null;
                        })}
                      </div>
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
                      className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 text-sm font-semibold shadow-md hover:shadow-lg"
                    >
                      <Download className="h-4 w-4" />
                      Download Note
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-gray-900 text-sm font-medium leading-relaxed p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {note.original.length > 200 ? `${note.original.substring(0, 200)}...` : note.original}
                    </div>
                    {note.concepts.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.concepts.slice(0, 4).map((concept, idx) => (
                          <span key={idx} className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-lg border border-primary-200">
                            {concept}
                          </span>
                        ))}
                        {note.concepts.length > 4 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                            +{note.concepts.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
