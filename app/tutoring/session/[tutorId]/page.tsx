'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Video, VideoOff, Mic, MicOff, X, MessageSquare, Send, Users, Copy, CheckCircle2, Loader2 } from 'lucide-react';
import LiveLearningAssistant from '@/components/LiveLearningAssistant';
import type { Language } from '@/types';

// Extended tutor data matching the tutors list
const MOCK_TUTORS: Record<string, { name: string; subjects: string[]; languages: string[] }> = {
  '1': { name: 'Dr. Sarah Chen', subjects: ['Mathematics', 'Physics', 'Quantum Computing'], languages: ['English', 'Mandarin'] },
  '2': { name: 'Prof. Ahmad Wijaya', subjects: ['Chemistry', 'Biology', 'Organic Chemistry'], languages: ['English', 'Bahasa Indonesia'] },
  '3': { name: 'Dr. Li Wei', subjects: ['Mathematics', 'Statistics', 'Calculus'], languages: ['English', 'Mandarin'] },
  '4': { name: 'Dr. Emily Rodriguez', subjects: ['Computer Science', 'Data Structures', 'Algorithms'], languages: ['English', 'Spanish'] },
  '5': { name: 'Prof. Budi Santoso', subjects: ['Biology', 'Genetics', 'Molecular Biology'], languages: ['English', 'Bahasa Indonesia'] },
  '6': { name: 'Dr. Zhang Ming', subjects: ['Physics', 'Thermodynamics', 'Electromagnetism'], languages: ['English', 'Mandarin'] },
  '7': { name: 'Ms. Siti Nurhaliza', subjects: ['Chemistry', 'Biochemistry', 'Analytical Chemistry'], languages: ['English', 'Bahasa Indonesia'] },
  '8': { name: 'Dr. James Wilson', subjects: ['Mathematics', 'Linear Algebra', 'Differential Equations'], languages: ['English'] },
  '9': { name: 'Prof. Chen Xiaoli', subjects: ['Computer Science', 'Machine Learning', 'Python'], languages: ['English', 'Mandarin'] },
  '10': { name: 'Dr. Rina Kartika', subjects: ['Biology', 'Cell Biology', 'Microbiology'], languages: ['English', 'Bahasa Indonesia'] },
  '11': { name: 'Dr. Michael Brown', subjects: ['Physics', 'Mechanics', 'Optics'], languages: ['English'] },
  '12': { name: 'Prof. Wang Fang', subjects: ['Mathematics', 'Number Theory', 'Abstract Algebra'], languages: ['English', 'Mandarin'] },
  '13': { name: 'Dr. Andi Pratama', subjects: ['Chemistry', 'Physical Chemistry', 'Inorganic Chemistry'], languages: ['English', 'Bahasa Indonesia'] },
  '14': { name: 'Dr. Lisa Thompson', subjects: ['Biology', 'Ecology', 'Evolutionary Biology'], languages: ['English'] },
  '15': { name: 'Prof. Liu Hong', subjects: ['Computer Science', 'Database Systems', 'Software Engineering'], languages: ['English', 'Mandarin'] },
  '16': { name: 'Dr. Dewi Sari', subjects: ['Mathematics', 'Geometry', 'Trigonometry'], languages: ['English', 'Bahasa Indonesia'] },
  '17': { name: 'Dr. Robert Kim', subjects: ['Physics', 'Quantum Mechanics', 'Atomic Physics'], languages: ['English'] },
  '18': { name: 'Prof. Huang Mei', subjects: ['Computer Science', 'Web Development', 'JavaScript'], languages: ['English', 'Mandarin'] },
};

export default function TutoringSessionPage() {
  const router = useRouter();
  const params = useParams();
  const tutorId = params?.tutorId as string;
  const tutor = MOCK_TUTORS[tutorId] || { name: 'Tutor', subjects: [], languages: [] };

  const [myId, setMyId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; name: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>(tutor.languages.includes('Mandarin') ? 'zh' : tutor.languages.includes('Bahasa Indonesia') ? 'id' : 'en');
  
  const peerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelsRef = useRef<Map<string, any>>(new Map());
  const callRef = useRef<any>(null);

  // Initialize PeerJS on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPeerJS = async () => {
      // Load PeerJS if not already loaded
      if (!(window as any).Peer) {
        return new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js';
          script.async = true;
          script.onload = () => {
            console.log('PeerJS loaded');
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load PeerJS');
            setIsInitializing(false);
            resolve();
          };
          document.head.appendChild(script);
        });
      }
    };

    const initPeer = async () => {
      await loadPeerJS();
      
      if (!(window as any).Peer) {
        setIsInitializing(false);
        return;
      }

      try {
        const Peer = (window as any).Peer;
        const peer = new Peer(undefined, {
          host: '0.peerjs.com',
          port: 443,
          path: '/',
          secure: true,
        });

        peer.on('open', (id: string) => {
          console.log('My Peer ID:', id);
          setMyId(id);
          peerRef.current = peer;
          setIsInitializing(false);
        });

        peer.on('error', (err: any) => {
          console.error('Peer error:', err);
          if (err.type === 'peer-unavailable') {
            // Peer ID not found - this is normal when connecting
            return;
          }
          setIsInitializing(false);
        });

        peer.on('call', async (call: any) => {
          console.log('Incoming call from:', call.peer);
          // Handle incoming call inline to avoid dependency issues
          try {
            setConnectionStatus('connecting');
            // Get stream with current video/audio state
            const currentVideoOff = isVideoOff;
            const currentMuted = isMuted;
            const stream = await getLocalStream(!currentVideoOff, !currentMuted);
            call.answer(stream);
            callRef.current = call;

            call.on('stream', (remoteStream: MediaStream) => {
              console.log('Received remote stream');
              remoteStreamRef.current = remoteStream;
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setParticipants(2);
              setIsInCall(true);
              setConnectionStatus('connected');
            });

            call.on('close', () => {
              console.log('Call closed');
              cleanup();
            });

            call.on('error', (err: any) => {
              console.error('Call error:', err);
              cleanup();
            });
          } catch (error) {
            console.error('Error handling incoming call:', error);
            setConnectionStatus('disconnected');
          }
        });

        peer.on('connection', (conn: any) => {
          console.log('Incoming data connection from:', conn.peer);
          handleDataConnection(conn);
        });

        peer.on('disconnected', () => {
          console.log('Peer disconnected');
          setConnectionStatus('disconnected');
        });

      } catch (error) {
        console.error('Error initializing Peer:', error);
        setIsInitializing(false);
      }
    };

    initPeer();

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
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    dataChannelsRef.current.forEach(conn => {
      try {
        conn.close();
      } catch (e) {
        console.error('Error closing data connection:', e);
      }
    });
    dataChannelsRef.current.clear();
    if (peerRef.current) {
      try {
        peerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying peer:', e);
      }
      peerRef.current = null;
    }
    setIsInCall(false);
    setParticipants(1);
    setConnectionStatus('disconnected');
  };

  const getLocalStream = async (video: boolean = true, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
        audio: audio,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video to prevent echo
      }
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      if (error.name === 'NotAllowedError') {
        alert('Camera/microphone access denied. Please allow access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        alert('No camera/microphone found. Please connect a device.');
      } else {
        alert(`Could not access camera/microphone: ${error.message}`);
      }
      throw error;
    }
  };

  const handleIncomingCallInternal = async (call: any) => {
    try {
      setConnectionStatus('connecting');
      const stream = await getLocalStream(!isVideoOff, !isMuted);
      call.answer(stream);
      callRef.current = call;

      call.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream');
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setParticipants(2);
        setIsInCall(true);
        setConnectionStatus('connected');
      });

      call.on('close', () => {
        console.log('Call closed');
        cleanup();
      });

      call.on('error', (err: any) => {
        console.error('Call error:', err);
        cleanup();
      });

    } catch (error) {
      console.error('Error handling incoming call:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleDataConnection = (conn: any) => {
    conn.on('open', () => {
      console.log('Data connection opened');
      dataChannelsRef.current.set(conn.peer, conn);
    });

    conn.on('data', (data: string) => {
      try {
        const message = JSON.parse(data);
        setChatMessages(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          name: message.name || 'Peer',
          message: message.message,
          timestamp: new Date(),
        }]);
      } catch (e) {
        console.error('Error parsing chat message:', e);
      }
    });

    conn.on('close', () => {
      console.log('Data connection closed');
      dataChannelsRef.current.delete(conn.peer);
    });

    conn.on('error', (err: any) => {
      console.error('Data connection error:', err);
    });
  };

  const startCall = async () => {
    if (!remotePeerId.trim()) {
      alert('Please enter the other person\'s Peer ID');
      return;
    }

    if (!peerRef.current) {
      alert('PeerJS not initialized. Please wait...');
      return;
    }

    setIsJoining(true);
    setConnectionStatus('connecting');

    try {
      const stream = await getLocalStream(true, true);
      
      // Make the call
      const call = peerRef.current.call(remotePeerId, stream);
      callRef.current = call;

      call.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream');
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setParticipants(2);
        setIsInCall(true);
        setConnectionStatus('connected');
      });

      call.on('close', () => {
        console.log('Call closed');
        cleanup();
      });

      call.on('error', (err: any) => {
        console.error('Call error:', err);
        alert(`Failed to connect: ${err.message || 'Unknown error'}`);
        cleanup();
      });

      // Create data connection for chat
      const conn = peerRef.current.connect(remotePeerId, {
        reliable: true,
      });
      handleDataConnection(conn);

    } catch (error: any) {
      console.error('Error starting call:', error);
      alert(`Failed to start call: ${error.message || 'Unknown error'}`);
      setConnectionStatus('disconnected');
    } finally {
      setIsJoining(false);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || dataChannelsRef.current.size === 0) return;

    const message = {
      name: 'You',
      message: chatInput.trim(),
    };

    setChatMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      name: 'You',
      message: chatInput.trim(),
      timestamp: new Date(),
    }]);

    // Send to all data channels
    dataChannelsRef.current.forEach(conn => {
      try {
        if (conn.open) {
          conn.send(JSON.stringify(message));
        }
      } catch (e) {
        console.error('Error sending message:', e);
      }
    });

    setChatInput('');
  };

  const leaveCall = () => {
    cleanup();
    router.push('/tutoring');
  };

  const copyPeerId = () => {
    if (myId) {
      navigator.clipboard.writeText(myId);
      alert('Peer ID copied to clipboard!');
    }
  };

  if (isInitializing) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Initializing Video Call</h2>
          <p className="text-gray-600">Setting up your connection...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                {tutor.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Session with {tutor.name}</h1>
                <p className="text-xs text-gray-500 font-medium">{tutor.subjects.join(' • ')}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/tutoring')}
              className="px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all border border-gray-200 font-semibold shadow-sm"
            >
              Back to Tutors
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {!isInCall ? (
          <div className="max-w-2xl mx-auto card">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Video Session</h2>
              <p className="text-gray-600">Connect with {tutor.name} for personalized learning</p>
            </div>
            
            <div className="space-y-6">
              {/* Your Peer ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Peer ID (share this with {tutor.name}):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myId || 'Generating...'}
                    readOnly
                    className="flex-1 input bg-gray-50"
                  />
                  <button
                    onClick={copyPeerId}
                    disabled={!myId}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Copy className="h-5 w-5" />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Share this ID with the other person so they can connect to you
                </p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              {/* Connect to Peer ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter {tutor.name}&apos;s Peer ID to connect:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={remotePeerId}
                    onChange={(e) => setRemotePeerId(e.target.value)}
                    placeholder="Enter peer ID here"
                    className="flex-1 input"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && remotePeerId.trim()) {
                        startCall();
                      }
                    }}
                  />
                  <button
                    onClick={startCall}
                    disabled={isJoining || !remotePeerId.trim() || connectionStatus === 'connecting'}
                    className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5" />
                        Connect
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ask {tutor.name} for their Peer ID and enter it above
                </p>
              </div>

              {/* Connection Status */}
              {connectionStatus === 'connecting' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Connecting...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Local Video */}
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl relative">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      You
                    </div>
                  </div>
                  {/* Remote Video */}
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl relative">
                    {connectionStatus === 'connected' ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      {tutor.name}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-110 ${
                      isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-110 ${
                      isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={leaveCall}
                    className="p-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Connection Status */}
                {connectionStatus === 'connected' && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Connected</span>
                  </div>
                )}
              </div>

              {/* Live Learning Assistant */}
              <LiveLearningAssistant sourceLang={sourceLang} targetLang={targetLang} />
            </div>

            {/* Chat Sidebar */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Chat</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">{participants}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start chatting with {tutor.name}</p>
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className={`p-3 rounded-xl ${msg.name === 'You' ? 'bg-primary-50 ml-4' : 'bg-gray-50 mr-4'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-bold text-sm ${msg.name === 'You' ? 'text-primary-700' : 'text-gray-900'}`}>
                          {msg.name}
                        </span>
                        <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className={`text-sm leading-relaxed ${msg.name === 'You' ? 'text-primary-900' : 'text-gray-700'}`}>
                        {msg.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 input"
                  disabled={dataChannelsRef.current.size === 0}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || dataChannelsRef.current.size === 0}
                  className="px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
