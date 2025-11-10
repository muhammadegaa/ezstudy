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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Session with {tutor.name}</h1>
            <p className="text-gray-600">Subjects: {tutor.subjects.join(', ')}</p>
          </div>
          <button
            onClick={() => router.push('/tutoring')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Tutors
          </button>
        </header>

        {!isInCall ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Tutoring Session</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Peer ID (share this with {tutor.name}):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myId}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="Generating..."
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(myId);
                      alert('Peer ID copied!');
                    }}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter {tutor.name}&apos;s Peer ID to connect:
                </label>
                <input
                  type="text"
                  placeholder="Enter tutor's Peer ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={toggleMute}
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-200'} text-white hover:opacity-80 transition-colors`}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-200'} text-white hover:opacity-80 transition-colors`}
                  >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={leaveCall}
                    className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Live Learning Assistant */}
              <LiveLearningAssistant sourceLang={sourceLang} targetLang={targetLang} />
            </div>

            {/* Chat Sidebar */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Chat</h3>
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">{participants}</span>
              </div>

              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-medium text-gray-900">{msg.name}:</span>
                    <span className="text-gray-700 ml-2">{msg.message}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

