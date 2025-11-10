'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, BookOpen, Save, Download, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
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
  const [speechText, setSpeechText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [gifs, setGifs] = useState<Map<string, Gif[]>>(new Map());
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [hasMicrophone, setHasMicrophone] = useState<boolean | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const cumulativeTextRef = useRef('');
  const translateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  // Check microphone permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Try Permissions API first
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setPermissionState(result.state as 'granted' | 'denied' | 'prompt');
            
            result.onchange = () => {
              setPermissionState(result.state as 'granted' | 'denied' | 'prompt');
            };
          } catch (e) {
            // Permissions API might not support 'microphone', that's fine
            // Default to 'prompt' - user hasn't been asked yet
            setPermissionState('prompt');
          }
        } else {
          // Permissions API not available, default to 'prompt'
          setPermissionState('prompt');
        }
      } catch (e) {
        // Default to 'prompt' if anything fails
        setPermissionState('prompt');
      }
    };
    checkPermission();
  }, []);

  // Request microphone permission explicitly BEFORE starting recognition
  const requestMicrophonePermission = async (): Promise<boolean> => {
    setIsRequestingPermission(true);
    setError(null);
    console.log('🔵 Requesting microphone permission...');
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Microphone access not available in this browser.');
        setIsRequestingPermission(false);
        setShowPermissionPrompt(false);
        return false;
      }

      // Explicitly request microphone permission - THIS TRIGGERS BROWSER DIALOG
      console.log('🔵 Calling getUserMedia - browser should show permission dialog now...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log('✅ Microphone permission granted!');
      
      // Got permission! Stop the stream (we just needed permission)
      stream.getTracks().forEach(track => track.stop());
      
      setHasMicrophone(true);
      setPermissionState('granted');
      setIsRequestingPermission(false);
      setShowPermissionPrompt(false);
      return true;
      
    } catch (err: any) {
      console.error('❌ Microphone permission error:', err.name, err.message);
      setIsRequestingPermission(false);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setHasMicrophone(false);
        setError('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.');
        setShowPermissionPrompt(false);
        return false;
      } else if (err.name === 'NotFoundError') {
        setHasMicrophone(false);
        setError('No microphone found. Please connect a microphone.');
        setShowPermissionPrompt(false);
        return false;
      } else {
        setHasMicrophone(false);
        setError(`Microphone error: ${err.message || err.name}`);
        setShowPermissionPrompt(false);
        return false;
      }
    }
  };

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

    // CRITICAL: Don't start recognition unless permission is granted
    if (permissionState !== 'granted' && hasMicrophone !== true) {
      console.log('Waiting for microphone permission...');
      setIsActive(false);
      setShowPermissionPrompt(true);
      return;
    }

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
      console.log('✅ Speech recognition started - microphone working!');
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
      
      // Update main text area too
      const combinedText = cumulativeTextRef.current.trim() + ' ' + interimText;
      setOriginalText(combinedText);

      // Real-time translation for final results
      if (finalText.trim()) {
        translateInRealTime(finalText.trim());
        analyzeConceptsInRealTime(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRequestingPermission(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('Microphone permission denied. Please allow microphone access in browser settings and refresh.');
        setHasMicrophone(false);
        setIsActive(false);
      } else if (event.error === 'no-speech') {
        // Normal - no speech detected, restart silently
        setHasMicrophone(true); // Microphone is working, just no speech
        if (isActive && recognitionRef.current) {
          setTimeout(() => {
            try {
              if (recognitionRef.current && isActive) {
                recognitionRef.current.start();
              }
            } catch (e) {
              console.error('Failed to restart:', e);
            }
          }, 1000);
        }
      } else if (event.error === 'aborted') {
        // User stopped, ignore
        setHasMicrophone(true); // Microphone was working
      } else if (event.error === 'audio-capture') {
        setError('Microphone not found or not working. Please connect a microphone.');
        setHasMicrophone(false);
        setIsActive(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
        setHasMicrophone(true); // Microphone is fine, network issue
        setIsActive(false);
      } else {
        // For other errors, try to restart
        setHasMicrophone(true); // Assume microphone is fine
        if (isActive && recognitionRef.current && event.error !== 'bad-grammar' && event.error !== 'language-not-supported') {
          setTimeout(() => {
            try {
              if (recognitionRef.current && isActive) {
                recognitionRef.current.start();
              }
            } catch (e) {
              console.error('Failed to restart after error:', e);
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
            console.error('Failed to restart recognition:', e);
            setIsActive(false);
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    
    // Start recognition - permission MUST be granted at this point
    setIsRequestingPermission(true);
    
    // Small delay to ensure permission state is synced
    setTimeout(() => {
      if (!isActive || !recognitionRef.current) return;
      
      try {
        recognitionRef.current.start();
        console.log('✅ Speech recognition started');
        setHasMicrophone(true);
      } catch (e: any) {
        console.error('Failed to start recognition:', e);
        setIsRequestingPermission(false);
        if (e.message && e.message.includes('already started')) {
          console.log('Recognition already running');
          setHasMicrophone(true);
        } else if (e.message && e.message.includes('not-allowed') || e.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access.');
          setHasMicrophone(false);
          setPermissionState('denied');
          setIsActive(false);
          setShowPermissionPrompt(true);
        } else {
          setError(`Failed to start listening: ${e.message || 'Unknown error'}`);
          setHasMicrophone(false);
          setIsActive(false);
        }
      }
    }, 100);

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
  }, [isActive, sourceLang, targetLang, isSupported, permissionState, hasMicrophone]);

  const translateInRealTime = async (text: string) => {
    if (!text.trim()) return;
    
    if (sourceLang === targetLang) {
      setTranslatedText(text);
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
          const updated = prev ? `${prev} ${data.translation}` : data.translation;
          return updated;
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation failed:', errorData);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const analyzeConceptsInRealTime = async (text: string) => {
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

  const fetchGifForConcept = async (concept: Concept) => {
    try {
      const searchTerm = concept.searchTerms[0] || concept.name;
      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        setGifs((prev) => {
          const newMap = new Map(prev);
          if (!newMap.has(concept.name) && data.gifs && data.gifs.length > 0) {
            newMap.set(concept.name, data.gifs.slice(0, 2));
          }
          return newMap;
        });
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

  const handleToggle = async () => {
    if (!isActive) {
      // ALWAYS show permission prompt first if not granted
      if (permissionState !== 'granted' && hasMicrophone !== true) {
        setShowPermissionPrompt(true);
        setError(null);
        return;
      }
      
      // Permission is granted, safe to start
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

  const handleAllowPermission = async () => {
    const granted = await requestMicrophonePermission();
    if (granted) {
      // Permission granted, now start listening
      setError(null);
      cumulativeTextRef.current = '';
      setSpeechText('');
      setTranslatedText('');
      setConcepts([]);
      setGifs(new Map());
      setIsActive(true);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Main Translation Interface - Google Translate Style */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text">Live Translation</h2>
                <p className="text-xs text-accent">Real-time speech-to-text translation</p>
              </div>
            </div>
            
            <button
              onClick={handleToggle}
              disabled={isRequestingPermission || isSupported === false}
              className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg relative ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-accent to-accent/90 text-background hover:from-accent/90 hover:to-accent'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : isActive ? (
                <>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse" />
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
        </div>

        {/* Permission Prompt - Production App Style */}
        {showPermissionPrompt && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Microphone Permission Required</h3>
                </div>
                <p className="text-sm text-blue-800 mb-3">
                  ezstudy needs access to your microphone to provide real-time speech translation. 
                  Click &quot;Allow Microphone&quot; below and then click &quot;Allow&quot; in the browser permission dialog that appears.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAllowPermission}
                    disabled={isRequestingPermission}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                  >
                    {isRequestingPermission ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Waiting for permission...
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                        Allow Microphone
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPermissionPrompt(false);
                      setError(null);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
                {isRequestingPermission && (
                  <p className="text-xs text-blue-700 mt-2">
                    ⚠️ If you don&apos;t see a browser permission dialog, check your browser&apos;s address bar for a microphone icon.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              {error}
            </p>
          </div>
        )}

        {/* Main Translation Area - Google Translate Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-gray-200">
          {/* Source Language */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                {sourceLang === 'en' ? 'English' : sourceLang === 'zh' ? '中文' : 'Bahasa Indonesia'}
              </span>
              {originalText && (
                <button
                  onClick={() => copyText(originalText)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-accent" />
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
                    translateInRealTime(text.trim());
                    analyzeConceptsInRealTime(text.trim());
                  }, 800);
                } else {
                  setTranslatedText('');
                }
              }}
              placeholder={isActive ? "Listening... or type here" : "Type or paste text here..."}
              className="w-full min-h-[300px] text-lg text-text placeholder-gray-400 border-0 focus:outline-none resize-none bg-transparent"
              rows={12}
            />
            {isActive && speechText && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-green-700">Live Speech</span>
                </div>
                <p className="text-sm text-green-800">{speechText}</p>
              </div>
            )}
          </div>

          {/* Target Language */}
          <div className="p-6 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                {targetLang === 'en' ? 'English' : targetLang === 'zh' ? '中文' : 'Bahasa Indonesia'}
              </span>
              {translatedText && (
                <button
                  onClick={() => copyText(translatedText)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="h-4 w-4 text-accent" />
                </button>
              )}
            </div>
            <div className="min-h-[300px]">
              {isTranslating ? (
                <div className="flex items-center gap-2 text-accent">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Translating...</span>
                </div>
              ) : translatedText ? (
                <p className="text-lg text-text whitespace-pre-wrap leading-relaxed">{translatedText}</p>
              ) : (
                <p className="text-lg text-gray-400">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Aids - Premium Design */}
      {concepts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-bold text-text">Visual References</h3>
            <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
              {concepts.length}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {concepts.slice(0, 8).map((concept) => {
              const conceptGifs = gifs.get(concept.name) || [];
              return (
                <div
                  key={concept.name}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-accent/40 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="text-xs font-bold text-text mb-2 line-clamp-2 min-h-[2.5rem]">
                    {concept.name}
                  </div>
                  {conceptGifs.length > 0 ? (
                    <div className="aspect-video rounded-lg overflow-hidden bg-black/10">
                      <img
                        src={conceptGifs[0].url}
                        alt={concept.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg bg-accent/10 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-accent" />
            <h3 className="text-lg font-bold text-text">Notes</h3>
            {notes.length > 0 && (
              <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
                {notes.length}
              </span>
            )}
          </div>
          {notes.length > 0 && (
            <button
              onClick={saveNotes}
              className="px-4 py-2 bg-accent text-background rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
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
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none transition-all"
            rows={3}
          />
          <button
            onClick={addNote}
            className="w-full px-6 py-3 bg-accent text-background rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center gap-2 shadow-md"
          >
            <Save className="h-4 w-4" />
            Save Note
          </button>
        </div>

        {notes.length > 0 && (
          <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="text-accent font-semibold">
                    {note.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-text line-clamp-2">{note.original.substring(0, 100)}...</div>
                {note.concepts.length > 0 && (
                  <div className="text-accent mt-1 text-xs">
                    {note.concepts.slice(0, 3).join(' • ')}
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
