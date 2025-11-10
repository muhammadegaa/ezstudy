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

  // Request microphone permission - PRODUCTION READY: Handle all cases gracefully
  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    setError(null);
    
    try {
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasMicrophone(false);
        setIsRequestingPermission(false);
        setIsActive(false);
        return false;
      }

      // Request permission directly - browser will prompt user
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop());
        setHasMicrophone(false);
        setIsRequestingPermission(false);
        setIsActive(false);
        return false;
      }
      
      // Keep stream briefly to ensure permission is granted
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      // Verify we have microphone access
      setHasMicrophone(true);
      setIsRequestingPermission(false);
      return true;
      
    } catch (err: any) {
      setIsRequestingPermission(false);
      
      // Handle NotFoundError gracefully - no microphone hardware
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setHasMicrophone(false);
        setIsActive(false);
        // Don't show error - just disable voice features gracefully
        return false;
      }
      
      // Handle permission denied
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setHasMicrophone(false);
        setIsActive(false);
        setError('Microphone permission denied. Voice features disabled.');
        return false;
      }
      
      // Handle microphone in use
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setHasMicrophone(false);
        setIsActive(false);
        setError('Microphone is being used by another application.');
        return false;
      }
      
      // Handle other errors
      console.warn('Microphone error (non-critical):', err.name, err.message);
      setHasMicrophone(false);
      setIsActive(false);
      return false;
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
      console.log('✅ Speech recognition started');
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
        setError('Microphone access denied. Please allow in browser settings.');
        setIsActive(false);
      } else if (event.error === 'no-speech') {
        // Normal - restart silently
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
      } else if (event.error === 'audio-capture') {
        setError('Microphone not working. Please check your microphone.');
        setIsActive(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your connection.');
        setIsActive(false);
      } else {
        // Try to restart for other errors
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
    
    // Request permission and start
    const startRecognition = async () => {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setIsActive(false);
        return;
      }
      
      if (!isActive || !recognitionRef.current) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!isActive || !recognitionRef.current) {
        return;
      }
      
      try {
        recognitionRef.current.start();
        console.log('✅ Speech recognition started successfully');
      } catch (e: any) {
        console.error('Failed to start recognition:', e);
        if (e.message && e.message.includes('already started')) {
          console.log('Recognition already running');
        } else {
          setError(`Failed to start: ${e.message || 'Unknown error'}`);
          setIsActive(false);
          setIsRequestingPermission(false);
        }
      }
    };

    startRecognition();

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
  }, [isActive, sourceLang, targetLang, isSupported]);

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
              disabled={isRequestingPermission || isSupported === false || hasMicrophone === false}
              className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg relative ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                  : hasMicrophone === false
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-accent to-accent/90 text-background hover:from-accent/90 hover:to-accent'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              title={hasMicrophone === false ? 'Microphone not available' : ''}
            >
              {isRequestingPermission ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Requesting...
                </>
              ) : isActive ? (
                <>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse" />
                  <MicOff className="h-5 w-5" />
                  Stop
                </>
              ) : hasMicrophone === false ? (
                <>
                  <MicOff className="h-5 w-5" />
                  No Mic
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

        {/* Status Messages */}
        {error && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full" />
              {error}
            </p>
          </div>
        )}
        {hasMicrophone === false && !error && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Voice input unavailable. You can still type or paste text to translate.
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
