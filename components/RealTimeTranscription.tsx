'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface RealTimeTranscriptionProps {
  audioStream: MediaStream | null;
  onTranscript: (text: string) => void;
  language: 'en' | 'zh' | 'id';
}

export default function RealTimeTranscription({
  audioStream,
  onTranscript,
  language,
}: RealTimeTranscriptionProps) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!isTranscribing) {
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
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    // Set language based on prop
    const langMap = {
      en: 'en-GB',
      zh: 'zh-CN',
      id: 'id-ID',
    };
    recognition.lang = langMap[language] || 'en-GB';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const fullTranscript = finalTranscript + interimTranscript;
      setTranscript(fullTranscript);
      
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Ignore no-speech errors, just restart
        recognition.start();
      }
    };

    recognition.onend = () => {
      if (isTranscribing) {
        // Restart if still transcribing
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
          // Ignore errors when stopping
        }
        recognitionRef.current = null;
      }
    };
  }, [isTranscribing, language, onTranscript]);

  const toggleTranscription = () => {
    setIsTranscribing(!isTranscribing);
    if (isTranscribing) {
      setTranscript('');
    }
  };

  return (
    <div className="bg-surface rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text">Real-time Transcription</h3>
        <button
          onClick={toggleTranscription}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            isTranscribing
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-accent text-background hover:bg-opacity-80'
          }`}
        >
          {isTranscribing ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start
            </>
          )}
        </button>
      </div>
      
      {isTranscribing && (
        <div className="bg-background rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
          {transcript ? (
            <p className="text-sm text-text whitespace-pre-wrap">{transcript}</p>
          ) : (
            <div className="flex items-center gap-2 text-accent text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Listening...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

