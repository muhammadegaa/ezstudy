'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, BookOpen, Save, Download, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
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
  const [speechText, setSpeechText] = useState(''); // Separate state for speech input
  const [translatedText, setTranslatedText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [gifs, setGifs] = useState<Map<string, Gif[]>>(new Map());
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
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

  // Request microphone permission - FIXED VERSION
  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    setError(null);
    
    try {
      // Request permission directly - this will prompt user
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Keep stream alive briefly to ensure permission is granted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Now enumerate to check what we got
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      
      // Stop the stream - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setIsRequestingPermission(false);
      
      if (audioInputs.length === 0) {
        setError('No microphone detected. Please connect a microphone and try again.');
        setIsActive(false);
        return false;
      }
      
      return true;
    } catch (err: any) {
      setIsRequestingPermission(false);
      console.error('Microphone permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please allow microphone access in your browser settings and refresh the page.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Microphone is being used by another application. Please close other apps using the microphone.');
      } else {
        setError(`Microphone error: ${err.message || err.name}. Please check your microphone connection.`);
      }
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
      setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
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
      console.log('✅ Speech recognition started successfully');
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
        setError('Microphone access denied. Please allow microphone access in browser settings and refresh.');
        setIsActive(false);
      } else if (event.error === 'no-speech') {
        // This is normal - no speech detected, just restart silently
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
        // User stopped it, ignore
      } else if (event.error === 'audio-capture') {
        setError('No microphone found or microphone is not working. Please check your microphone.');
        setIsActive(false);
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet connection.');
        setIsActive(false);
      } else {
        console.warn('Speech recognition error (non-critical):', event.error);
        // Don't stop for minor errors, just log them
        if (event.error !== 'bad-grammar' && event.error !== 'language-not-supported') {
          // Try to restart
          if (isActive && recognitionRef.current) {
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
    
    // Request permission and start recognition
    const startRecognition = async () => {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setIsActive(false);
        return;
      }
      
      if (!isActive || !recognitionRef.current) {
        return;
      }
      
      // Small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!isActive || !recognitionRef.current) {
        return;
      }
      
      try {
        recognitionRef.current.start();
        console.log('✅ Speech recognition started successfully');
      } catch (e: any) {
        console.error('Failed to start recognition:', e);
        if (e.message && e.message.includes('already started')) {
          // Already running, that's fine
          console.log('Recognition already running');
        } else {
          setError(`Failed to start listening: ${e.message || 'Unknown error'}. Please try again.`);
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
        setTranslatedText(data.translation || text);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation failed:', errorData);
        setError('Translation failed. Please try again.');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation service unavailable. Please check your connection.');
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
    if (!currentNote.trim() && !originalText.trim()) return;

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
      // Starting - clear previous state
      setError(null);
      cumulativeTextRef.current = '';
      setSpeechText('');
      setTranslatedText('');
      setConcepts([]);
      setGifs(new Map());
      setIsActive(true);
      // Permission will be requested in useEffect
    } else {
      // Stopping
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

  return (
    <div className="space-y-4">
      {/* Main Control Card - Premium Design */}
      <div className="bg-gradient-to-br from-surface via-surface to-accent/20 rounded-2xl p-6 shadow-lg border border-accent/20">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl ${isActive ? 'bg-red-500/10' : 'bg-accent/10'}`}>
                <Sparkles className={`h-6 w-6 ${isActive ? 'text-red-500' : 'text-accent'}`} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text">Live Learning Assistant</h3>
                <p className="text-sm text-accent mt-1">Real-time translation • Visual aids • Smart notes</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleToggle}
            disabled={isRequestingPermission || isSupported === false}
            className={`relative px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 shadow-lg ${
              isActive
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                : 'bg-gradient-to-r from-accent to-accent/90 text-background hover:from-accent/90 hover:to-accent'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
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

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {isSupported === false && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-800">
                Speech recognition requires Chrome, Edge, or Safari. Your current browser doesn&apos;t support this feature.
              </p>
            </div>
          </div>
        )}

        {/* Manual Input Option - Always Available */}
        <div className="mt-6 space-y-4">
          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="text-xs font-semibold text-accent uppercase tracking-wide">Or Type/Paste Text</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <textarea
                  value={originalText}
                  onChange={(e) => {
                    const text = e.target.value;
                    setOriginalText(text);
                    // Clear speech text when typing manually
                    setSpeechText('');
                    cumulativeTextRef.current = '';
                    
                    // Clear previous timeout
                    if (translateTimeoutRef.current) {
                      clearTimeout(translateTimeoutRef.current);
                    }
                    
                    // Auto-translate as you type (debounced)
                    if (text.trim()) {
                      translateTimeoutRef.current = setTimeout(() => {
                        translateInRealTime(text.trim());
                        analyzeConceptsInRealTime(text.trim());
                      }, 800);
                    } else {
                      setTranslatedText('');
                    }
                  }}
                  placeholder="Type or paste text here..."
                  className="w-full px-4 py-3 rounded-lg border-2 border-accent/30 bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none transition-all min-h-[150px]"
                  rows={6}
                />
              </div>
              <div className="bg-background/50 rounded-lg p-4 border border-accent/20 min-h-[150px]">
                <div className="flex items-center gap-2 mb-2">
                  {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
                  <div className="text-xs font-semibold text-accent uppercase">Translation ({targetLang})</div>
                </div>
                <p className="text-sm text-text whitespace-pre-wrap min-h-[120px]">
                  {translatedText || (
                    <span className="text-accent/60">Translation appears here...</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {isActive && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Text from Speech */}
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-accent/20 min-h-[180px] max-h-[250px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="text-xs font-semibold text-accent uppercase tracking-wide">Live Speech ({sourceLang})</div>
                </div>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {speechText || (
                    <span className="text-accent/60 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Listening...
                    </span>
                  )}
                </p>
              </div>

              {/* Translated Text */}
              <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-accent/20 min-h-[180px] max-h-[250px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
                  <div className="text-xs font-semibold text-accent uppercase tracking-wide">Translation ({targetLang})</div>
                </div>
                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                  {translatedText || (
                    <span className="text-accent/60">Translation will appear here...</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Aids - Premium Grid */}
      {isActive && concepts.length > 0 && (
        <div className="bg-gradient-to-br from-surface to-surface/80 rounded-2xl p-6 shadow-lg border border-accent/20">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h4 className="text-lg font-bold text-text">Visual References</h4>
            <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
              {concepts.length} concepts
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {concepts.slice(0, 8).map((concept) => {
              const conceptGifs = gifs.get(concept.name) || [];
              return (
                <div
                  key={concept.name}
                  className="bg-background/80 backdrop-blur-sm rounded-xl p-3 border border-accent/20 hover:border-accent/40 transition-all hover:shadow-md"
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

      {/* Note Taking - Premium Design */}
      {isActive && (
        <div className="bg-gradient-to-br from-surface to-surface/80 rounded-2xl p-6 shadow-lg border border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <h4 className="text-lg font-bold text-text">Active Notes</h4>
              {notes.length > 0 && (
                <span className="px-2 py-1 bg-accent/20 text-accent text-xs font-semibold rounded-full">
                  {notes.length} saved
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
              placeholder="Add your own notes here... (or click 'Save Note' to capture current transcription)"
              className="w-full px-4 py-3 rounded-xl border-2 border-accent/30 bg-background/80 backdrop-blur-sm text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none transition-all"
              rows={3}
            />
            <button
              onClick={addNote}
              className="w-full px-6 py-3 bg-gradient-to-r from-accent to-accent/90 text-background rounded-xl hover:from-accent/90 hover:to-accent transition-all font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
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
                  className="bg-background/60 backdrop-blur-sm rounded-lg p-3 border border-accent/20 text-xs"
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
      )}
    </div>
  );
}
