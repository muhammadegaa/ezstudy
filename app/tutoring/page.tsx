'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Video, VideoOff, Mic, MicOff, Monitor, X, MessageSquare, Send, Users, Copy } from 'lucide-react';
import TranslationPanel from '@/components/TranslationPanel';
import LanguageToggle from '@/components/LanguageToggle';
import LiveLearningAssistant from '@/components/LiveLearningAssistant';
import type { Language, Translation } from '@/types';

interface PeerConnection {
  peer: any;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connections: Map<string, RTCPeerConnection>;
}

export default function TutoringPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [myId, setMyId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; name: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(1);
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('zh');
  
  const peerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const connectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

  useEffect(() => {
    // Load PeerJS
    if (typeof window !== 'undefined' && !(window as any).Peer) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => {
        console.log('PeerJS loaded');
      };
      document.head.appendChild(script);
    }

    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
    connectionsRef.current.forEach(conn => conn.close());
    connectionsRef.current.clear();
    dataChannelsRef.current.clear();
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setIsInCall(false);
    setParticipants(1);
  };

  const getLocalStream = async (video: boolean = true, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      throw error;
    }
  };

  const createRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room name');
      return;
    }

    setIsJoining(true);
    try {
      await initializePeer();
      await getLocalStream();
      peerRef.current?.open();
      
      // Wait for peer ID
      await new Promise((resolve) => {
        const checkPeer = setInterval(() => {
          if (peerRef.current && peerRef.current.id) {
            clearInterval(checkPeer);
            setMyId(peerRef.current.id);
            resolve(true);
          }
        }, 100);
      });

      setIsInCall(true);
      setIsJoining(false);
      setParticipants(1);

      // Listen for incoming connections
      peerRef.current?.on('connection', (conn: any) => {
        handleDataConnection(conn);
        setParticipants(prev => prev + 1);
      });

      peerRef.current?.on('call', (call: any) => {
        handleIncomingCall(call);
        setParticipants(prev => prev + 1);
      });
    } catch (error: any) {
      alert(error.message || 'Failed to create room');
      setIsJoining(false);
      cleanup();
    }
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      alert('Please enter a room name');
      return;
    }

    setIsJoining(true);
    try {
      await initializePeer();
      await getLocalStream();
      
      // Wait for peer ID
      await new Promise((resolve) => {
        const checkPeer = setInterval(() => {
          if (peerRef.current && peerRef.current.id) {
            clearInterval(checkPeer);
            setMyId(peerRef.current.id);
            resolve(true);
          }
        }, 100);
      });

      // Connect to host
      const conn = peerRef.current?.connect(roomId);
      if (conn) {
        handleDataConnection(conn);
      }

      // Call host
      const call = peerRef.current?.call(roomId, localStreamRef.current!);
      if (call) {
        handleOutgoingCall(call);
      }

      setIsInCall(true);
      setIsJoining(false);
      setParticipants(2);

      // Listen for new connections
      peerRef.current?.on('connection', (conn: any) => {
        handleDataConnection(conn);
        setParticipants(prev => prev + 1);
      });

      peerRef.current?.on('call', (call: any) => {
        handleIncomingCall(call);
        setParticipants(prev => prev + 1);
      });
    } catch (error: any) {
      alert(error.message || 'Failed to join room');
      setIsJoining(false);
      cleanup();
    }
  };

  const initializePeer = () => {
    return new Promise((resolve, reject) => {
      if (!(window as any).Peer) {
        setTimeout(() => initializePeer(), 100);
        return;
      }

      const peer = new (window as any).Peer({
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      peer.on('open', (id: string) => {
        setMyId(id);
        peerRef.current = peer;
        resolve(true);
      });

      peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        reject(err);
      });

      setTimeout(() => {
        if (!peerRef.current) {
          reject(new Error('Peer initialization timeout'));
        }
      }, 10000);
    });
  };

  const handleDataConnection = (conn: any) => {
    conn.on('open', () => {
      dataChannelsRef.current.set(conn.peer, conn);
    });

    conn.on('data', (data: any) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed.type === 'chat') {
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              name: parsed.name || 'Peer',
              message: parsed.message,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (e) {
        console.error('Error parsing chat message:', e);
      }
    });

    conn.on('close', () => {
      dataChannelsRef.current.delete(conn.peer);
      setParticipants(prev => Math.max(1, prev - 1));
    });
  };

  const handleIncomingCall = (call: any) => {
    call.answer(localStreamRef.current);
    call.on('stream', (remoteStream: MediaStream) => {
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  };

  const handleOutgoingCall = (call: any) => {
    call.on('stream', (remoteStream: MediaStream) => {
      remoteStreamRef.current = remoteStream;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });
  };

  const leaveCall = () => {
    cleanup();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen share and resume camera
        const stream = await getLocalStream(true, !isMuted);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(false);
      } else {
        // Start screen share
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen share error:', error);
      alert('Screen sharing failed. Please try again.');
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const message = {
      type: 'chat',
      message: chatInput,
      name: 'You',
    };

    // Send to all connected peers
    dataChannelsRef.current.forEach((conn) => {
      conn.send(JSON.stringify(message));
    });

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

  const copyRoomId = () => {
    if (myId) {
      navigator.clipboard.writeText(myId);
      alert('Room ID copied to clipboard!');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text mb-2">ezstudy Tutoring</h1>
            <p className="text-accent">Free WebRTC video tutoring with translation support</p>
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
                    Room Name / Peer ID
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room name or peer ID to join"
                    className="w-full px-4 py-3 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        createRoom();
                      }
                    }}
                  />
                  <p className="text-xs text-accent mt-1">
                    To create: Enter any name. To join: Enter the host&apos;s Peer ID.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={createRoom}
                    disabled={isJoining || !roomId.trim()}
                    className="flex-1 px-6 py-3 bg-accent text-background rounded-lg hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isJoining ? 'Creating...' : 'Create Room'}
                  </button>
                  <button
                    onClick={joinRoom}
                    disabled={isJoining || !roomId.trim()}
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
                <li>✓ Free WebRTC video and audio (no paid services)</li>
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
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent" />
                      <span className="text-sm text-text">{participants} participant{participants !== 1 ? 's' : ''}</span>
                    </div>
                    {myId && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-accent">Your ID: {myId}</span>
                        <button
                          onClick={copyRoomId}
                          className="p-1 text-accent hover:text-text transition-colors"
                          title="Copy Room ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={leaveCall}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Leave
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      You
                    </div>
                  </div>
                  <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Peer
                    </div>
                  </div>
                </div>
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

              <LiveLearningAssistant
                sourceLang={sourceLang}
                targetLang={targetLang}
              />

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
