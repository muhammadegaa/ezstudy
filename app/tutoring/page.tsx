'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Video, VideoOff, Mic, MicOff, Monitor, X, MessageSquare, Send, Users } from 'lucide-react';
// Daily.co SDK will be loaded via script tag
import TranslationPanel from '@/components/TranslationPanel';
import LanguageToggle from '@/components/LanguageToggle';
import type { Language, Translation } from '@/types';

export default function TutoringPage() {
  const router = useRouter();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; name: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(0);
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  
  const callFrameRef = useRef<any>(null);

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', roomName: roomName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      setRoomUrl(data.url);
      joinCall(data.url, data.token);
    } catch (error: any) {
      alert(error.message || 'Failed to create room');
      setIsJoining(false);
    }
  };

  const joinRoom = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', roomName: roomName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to join room');
      }

      const data = await response.json();
      joinCall(data.url, data.token);
    } catch (error: any) {
      alert(error.message || 'Failed to join room');
      setIsJoining(false);
    }
  };

  const joinCall = (url: string, token?: string) => {
    if (typeof window === 'undefined' || !window.DailyIframe) {
      alert('Daily.co SDK not loaded. Please refresh the page.');
      return;
    }

    const callFrame = window.DailyIframe.createFrame({
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: '8px',
      },
    });

    callFrameRef.current = callFrame;

    callFrame
      .on('joined-meeting', (event: any) => {
        setIsInCall(true);
        setIsJoining(false);
        setParticipants(event.participants ? Object.keys(event.participants).length : 1);
      })
      .on('left-meeting', () => {
        setIsInCall(false);
        setRoomUrl(null);
        setParticipants(0);
        if (callFrame) {
          callFrame.destroy();
        }
      })
      .on('participant-joined', () => {
        setParticipants((prev) => prev + 1);
      })
      .on('participant-left', () => {
        setParticipants((prev) => Math.max(0, prev - 1));
      })
      .on('app-message', (event: any) => {
        if (event.data.type === 'chat') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: event.data.name || 'Anonymous',
              message: event.data.message,
              timestamp: new Date(),
            },
          ]);
        }
      });

    callFrame.join({ url, token });
    
    const container = document.getElementById('video-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(callFrame.iframe());
    }
  };

  const leaveCall = () => {
    if (callFrameRef.current) {
      callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsInCall(false);
    setRoomUrl(null);
  };

  const toggleMute = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (callFrameRef.current) {
      try {
        if (isScreenSharing) {
          await callFrameRef.current.stopScreenShare();
        } else {
          await callFrameRef.current.startScreenShare();
        }
        setIsScreenSharing(!isScreenSharing);
      } catch (error) {
        console.error('Screen share error:', error);
      }
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !callFrameRef.current) return;

    callFrameRef.current.sendAppMessage(
      {
        type: 'chat',
        message: chatInput,
        name: 'You',
      },
      '*'
    );

    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: 'You',
        message: chatInput,
        timestamp: new Date(),
      },
    ]);

    setChatInput('');
  };

  useEffect(() => {
    // Load Daily.co SDK
    if (typeof window !== 'undefined' && !window.DailyIframe) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@daily-co/daily-js/dist/daily-iframe.js';
      script.async = true;
      script.onload = () => {
        console.log('Daily.co SDK loaded');
      };
      document.head.appendChild(script);
    }

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text mb-2">ezstudy Tutoring</h1>
            <p className="text-accent">Live video tutoring with translation support</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-surface rounded-lg hover:bg-accent transition-colors text-text"
          >
            Back to Translation
          </button>
        </header>

        {!isInCall ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-surface rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-text mb-4">Create or Join Session</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name (e.g., math-tutoring-2024)"
                    className="w-full px-4 py-3 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        createRoom();
                      }
                    }}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={createRoom}
                    disabled={isJoining || !roomName.trim()}
                    className="flex-1 px-6 py-3 bg-accent text-background rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isJoining ? 'Creating...' : 'Create Room'}
                  </button>
                  <button
                    onClick={joinRoom}
                    disabled={isJoining || !roomName.trim()}
                    className="flex-1 px-6 py-3 bg-surface text-text rounded-lg border border-accent hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isJoining ? 'Joining...' : 'Join Room'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text mb-4">Features</h3>
              <ul className="space-y-2 text-sm text-text">
                <li>✓ HD video and audio conferencing</li>
                <li>✓ Screen sharing for presentations</li>
                <li>✓ Real-time chat during sessions</li>
                <li>✓ Integrated translation support</li>
                <li>✓ Academic glossary assistance</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-surface rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-accent" />
                    <span className="text-sm text-text">{participants} participant{participants !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={leaveCall}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Leave
                  </button>
                </div>
                
                <div
                  id="video-container"
                  className="w-full h-[500px] bg-black rounded-lg overflow-hidden"
                />
              </div>

              <div className="bg-surface rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-4 justify-center">
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full transition-colors ${
                      isMuted ? 'bg-red-500 text-white' : 'bg-accent text-background'
                    }`}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoOff ? 'bg-red-500 text-white' : 'bg-accent text-background'
                    }`}
                    aria-label={isVideoOff ? 'Turn on video' : 'Turn off video'}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                  
                  <button
                    onClick={toggleScreenShare}
                    className={`p-3 rounded-full transition-colors ${
                      isScreenSharing ? 'bg-accent text-background' : 'bg-surface text-text border border-accent'
                    }`}
                    aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    <Monitor className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-surface rounded-lg p-4 shadow-sm">
                <LanguageToggle
                  sourceLang={sourceLang}
                  targetLang={targetLang}
                  onLanguageChange={(source, target) => {
                    setSourceLang(source);
                    setTargetLang(target);
                  }}
                />
              </div>

              <TranslationPanel
                sourceLang={sourceLang}
                targetLang={targetLang}
                onTranslationComplete={() => {}}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-surface rounded-lg p-4 shadow-sm h-[600px] flex flex-col">
                <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-accent text-center py-4">
                      No messages yet. Start chatting!
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-background rounded p-2">
                        <div className="text-xs font-semibold text-accent mb-1">
                          {msg.name}
                        </div>
                        <div className="text-sm text-text">{msg.message}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendChatMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 rounded border border-accent bg-background text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <button
                    onClick={sendChatMessage}
                    className="px-4 py-2 bg-accent text-background rounded hover:bg-opacity-80 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

