'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Video, VideoOff, Mic, MicOff, Monitor, X, MessageSquare, Send, Users, Copy } from 'lucide-react';
import LiveLearningAssistant from '@/components/LiveLearningAssistant';
import type { Language } from '@/types';

// Mock tutor data - in production, fetch from API
const MOCK_TUTORS: Record<string, { name: string; subjects: string[] }> = {
  '1': { name: 'Dr. Sarah Chen', subjects: ['Mathematics', 'Physics'] },
  '2': { name: 'Prof. Ahmad Wijaya', subjects: ['Chemistry', 'Biology'] },
  '3': { name: 'Dr. Li Wei', subjects: ['Mathematics', 'Statistics'] },
};

export default function TutoringSessionPage() {
  const router = useRouter();
  const params = useParams();
  const tutorId = params?.tutorId as string;
  const tutor = MOCK_TUTORS[tutorId] || { name: 'Tutor', subjects: [] };

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

  const initializePeer = async () => {
    return new Promise((resolve, reject) => {
      const peer = new (window as any).Peer(undefined, {
        host: '0.peerjs.com',
        port: 443,
        path: '/',
        secure: true,
      });

      peer.on('open', (id: string) => {
        console.log('Peer ID:', id);
        setMyId(id);
        peerRef.current = peer;
        resolve(peer);
      });

      peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        reject(err);
      });

      peer.on('call', (call: any) => {
        handleIncomingCall(call);
      });

      peer.on('connection', (conn: any) => {
        handleDataConnection(conn);
      });
    });
  };

  const handleIncomingCall = async (call: any) => {
    try {
      const stream = await getLocalStream(!isVideoOff, !isMuted);
      call.answer(stream);

      call.on('stream', (remoteStream: MediaStream) => {
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setParticipants(2);
      });

      call.on('close', () => {
        cleanup();
      });
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  const handleDataConnection = (conn: any) => {
    conn.on('data', (data: string) => {
      try {
        const message = JSON.parse(data);
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          name: message.name || 'Tutor',
          message: message.message,
          timestamp: new Date(),
        }]);
      } catch (e) {
        console.error('Error parsing chat message:', e);
      }
    });

    dataChannelsRef.current.set(conn.peer, conn);
  };

  const startSession = async () => {
    setIsJoining(true);
    try {
      await initializePeer();
      const stream = await getLocalStream(true, true);
      setIsInCall(true);
      
      // In a real app, you'd connect to the tutor's Peer ID here
      // For now, show instructions
      alert(`Your Peer ID: ${myId}\n\nShare this ID with ${tutor.name} to connect.`);
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const joinWithPeerId = async (peerId: string) => {
    if (!peerRef.current || !peerId.trim()) {
      alert('Please enter a Peer ID');
      return;
    }

    try {
      const stream = await getLocalStream(true, true);
      const call = peerRef.current.call(peerId, stream);

      call.on('stream', (remoteStream: MediaStream) => {
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setParticipants(2);
      });

      call.on('close', () => {
        cleanup();
      });

      // Create data channel for chat
      const conn = peerRef.current.connect(peerId);
      handleDataConnection(conn);

      setIsInCall(true);
    } catch (error) {
      console.error('Error joining call:', error);
      alert('Failed to connect. Please check the Peer ID.');
    }
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

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const message = {
      name: 'You',
      message: chatInput,
    };

    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      name: 'You',
      message: chatInput,
      timestamp: new Date(),
    }]);

    // Send to all data channels
    dataChannelsRef.current.forEach(conn => {
      try {
        conn.send(JSON.stringify(message));
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Professional Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
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
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Tutoring Session</h2>
              <p className="text-gray-600">Connect with {tutor.name} for personalized learning</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Peer ID (share this with {tutor.name}):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myId}
                    readOnly
                    className="flex-1 input bg-gray-50"
                    placeholder="Generating..."
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(myId);
                      alert('Peer ID copied!');
                    }}
                    className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter {tutor.name}&apos;s Peer ID to connect:
                </label>
                <input
                  type="text"
                  placeholder="Enter tutor's Peer ID"
                  className="input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      joinWithPeerId((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>

              <button
                onClick={startSession}
                disabled={isJoining}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] disabled:transform-none"
              >
                <Video className="h-5 w-5" />
                {isJoining ? 'Starting Session...' : 'Start Session'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="card overflow-hidden">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-xl ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-100 hover:bg-gray-200'} text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-110`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-gray-700" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-xl ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-100 hover:bg-gray-200'} text-white transition-all shadow-lg hover:shadow-xl transform hover:scale-110`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5 text-gray-700" />}
                  </button>
                  <button
                    onClick={leaveCall}
                    className="p-4 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Live Learning Assistant */}
              <LiveLearningAssistant sourceLang={sourceLang} targetLang={targetLang} />
            </div>

            {/* Chat Sidebar */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
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
                  </div>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-gray-900">{msg.name}</span>
                        <span className="text-xs text-gray-400">{msg.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{msg.message}</p>
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
                />
                <button
                  onClick={sendChatMessage}
                  className="px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
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

