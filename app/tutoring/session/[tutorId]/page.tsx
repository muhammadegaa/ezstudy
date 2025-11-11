'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { 
  VideoCameraIcon, 
  VideoCameraSlashIcon, 
  MicrophoneIcon, 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  UserGroupIcon, 
  ClipboardDocumentIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import MediaPreview from '@/components/WebRTC/MediaPreview';

// Lazy load LiveLearningAssistant (heavy component)
const LiveLearningAssistant = dynamic(() => import('@/components/LiveLearningAssistant'), {
  loading: () => (
    <div className="card p-6">
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    </div>
  ),
  ssr: false,
});
import { useAuth } from '@/hooks/useAuth';
import { getTutor, getTutorByUserId } from '@/lib/firebase/firestore';
import { getSession, updateSession, type Session as FirestoreSession } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/userProfile';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import MobileNav from '@/components/Navigation/MobileNav';
import Breadcrumbs from '@/components/Navigation/Breadcrumbs';
import type { Language } from '@/types';

export default function TutoringSessionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  
  const tutorId = params?.tutorId as string;
  const sessionId = searchParams?.get('sessionId');
  
  // Check if this is a tutor-created session (starts with "tutor-")
  // OR if tutorId is actually a sessionId (student joining via link)
  const isTutorSession = tutorId.startsWith('tutor-');
  const actualSessionId = isTutorSession ? tutorId.replace('tutor-', '') : (sessionId || tutorId);
  
  const [tutor, setTutor] = useState<{ name: string; subjects: string[]; languages: string[] } | null>(null);
  const [session, setSession] = useState<FirestoreSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState('');
  const [remotePeerId, setRemotePeerId] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; name: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [participants, setParticipants] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('en');
  
  const peerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelsRef = useRef<Map<string, any>>(new Map());
  const callRef = useRef<any>(null);

  // Cleanup function for PeerJS connections
  const cleanup = useCallback(() => {
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
    dataChannelsRef.current.forEach(conn => conn.close());
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
    
    // Update session status to completed
    if (actualSessionId) {
      updateSession(actualSessionId, { status: 'completed' }).catch(console.error);
    }
  }, [actualSessionId]);

  // Load session and tutor data from Firestore
  useEffect(() => {
    const loadSessionData = async () => {
      if (!user || authLoading) return;
      
      setLoading(true);
      try {
        if (actualSessionId) {
          // Load session from Firestore
          const firestoreSession = await getSession(actualSessionId);
          if (firestoreSession) {
            setSession(firestoreSession);
            
            // Load tutor info
            if (isTutorSession) {
              // For tutor sessions, get tutor by userId
              const tutorProfile = await getTutorByUserId(user.uid);
              if (tutorProfile) {
                setTutor({
                  name: tutorProfile.name,
                  subjects: tutorProfile.subjects,
                  languages: tutorProfile.languages,
                });
                setTargetLang(tutorProfile.languages.includes('Mandarin') ? 'zh' : tutorProfile.languages.includes('Bahasa Indonesia') ? 'id' : 'en');
              } else {
                setTutor({ name: 'You (Tutor)', subjects: ['General'], languages: ['English'] });
              }
            } else {
              // For student sessions, get tutor by tutorId
              const tutorProfile = await getTutor(firestoreSession.tutorId);
              if (tutorProfile) {
                setTutor({
                  name: tutorProfile.name,
                  subjects: tutorProfile.subjects,
                  languages: tutorProfile.languages,
                });
                setTargetLang(tutorProfile.languages.includes('Mandarin') ? 'zh' : tutorProfile.languages.includes('Bahasa Indonesia') ? 'id' : 'en');
              } else {
                setTutor({ name: 'Tutor', subjects: [], languages: [] });
              }
            }
            
            // For students joining via link: auto-connect if tutor's peerId is available
            if (!isTutorSession && firestoreSession.peerId && user.uid !== firestoreSession.tutorId) {
              setRemotePeerId(firestoreSession.peerId);
              // Auto-join after a short delay to ensure PeerJS is initialized
              setTimeout(() => {
                if (peerRef.current && !isInCall) {
                  startCall().catch(console.error);
                }
              }, 1000);
            }
          } else {
            addToast({ title: 'Error', description: 'Session not found', type: 'error' });
            router.push('/tutoring');
          }
        } else if (!isTutorSession) {
          // Student session without sessionId - load tutor directly
          const tutorProfile = await getTutor(tutorId);
          if (tutorProfile) {
            setTutor({
              name: tutorProfile.name,
              subjects: tutorProfile.subjects,
              languages: tutorProfile.languages,
            });
            setTargetLang(tutorProfile.languages.includes('Mandarin') ? 'zh' : tutorProfile.languages.includes('Bahasa Indonesia') ? 'id' : 'en');
          } else {
            addToast({ title: 'Error', description: 'Tutor not found', type: 'error' });
            router.push('/tutoring');
          }
        } else {
          // Tutor session without sessionId - use tutor's own info
          const tutorProfile = await getTutorByUserId(user.uid);
          if (tutorProfile) {
            setTutor({
              name: tutorProfile.name,
              subjects: tutorProfile.subjects,
              languages: tutorProfile.languages,
            });
          } else {
            setTutor({ name: 'You (Tutor)', subjects: ['General'], languages: ['English'] });
          }
        }
      } catch (error) {
        console.error('Error loading session data:', error);
        addToast({ title: 'Error', description: 'Failed to load session', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [user, authLoading, actualSessionId, isTutorSession, tutorId, router, addToast]);

  // Initialize PeerJS on mount
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    const loadPeerJS = async () => {
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
      return Promise.resolve();
    };

    const initPeer = async () => {
      await loadPeerJS();
      if (!(window as any).Peer) {
        setIsInitializing(false);
        return;
      }

      const Peer = (window as any).Peer;
      const peer = new Peer();

      peer.on('open', (id: string) => {
        console.log('My peer ID is:', id);
        setMyId(id);
        setIsInitializing(false);
        
        // Update session with peerId if session exists (for tutors)
        if (actualSessionId && session && isTutorSession && !session.peerId) {
          updateSession(actualSessionId, { peerId: id }).catch(console.error);
        }
        
        // For tutors: Auto-enter waiting room (like Google Meet)
        if (isTutorSession && !localStreamRef.current && !showMediaPreview) {
          // Auto-request media (camera/mic off by default) - like Google Meet
          getLocalStream(false, false).then((stream) => {
            // Tutor is now in waiting room, ready to accept calls
            setConnectionStatus('connecting'); // Shows "Waiting for student..."
          }).catch((err) => {
            console.warn('Could not access media, continuing without:', err);
            // Continue without media - student can still join
          });
        }
        
        // For students: Auto-join if tutor's peerId is available
        if (!isTutorSession && session?.peerId && session.peerId !== id && user?.uid !== session.tutorId) {
          setRemotePeerId(session.peerId);
          // Auto-join immediately (like Google Meet)
          setTimeout(() => {
            getLocalStream(false, false).then((stream) => {
              startCallWithStream(stream).catch(console.error);
            }).catch((err) => {
              console.warn('Could not access media, joining without:', err);
              // Join without media if permission denied
              startCallWithStream(new MediaStream()).catch(console.error);
            });
          }, 500);
        }
      });

      peer.on('error', (err: any) => {
        console.error('Peer error:', err);
        setIsInitializing(false);
      });

      peerRef.current = peer;

      peer.on('call', async (call: any) => {
        console.log('Incoming call from:', call.peer);
        try {
          setConnectionStatus('connecting');
          if (!localStreamRef.current) {
            const stream = await getLocalStream(!isVideoOff, !isMuted);
            call.answer(stream);
          } else {
            call.answer(localStreamRef.current);
          }
          callRef.current = call;

          call.on('stream', (remoteStream: MediaStream) => {
            console.log('Received remote stream');
            remoteStreamRef.current = remoteStream;
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              remoteVideoRef.current.play().catch(err => {
                console.error('Error playing remote video:', err);
              });
            }
            setParticipants(2);
            setIsInCall(true);
            setConnectionStatus('connected');
            setConnectionQuality('good'); // Default to good
            
            // Monitor connection quality
            const audioTracks = remoteStream.getAudioTracks();
            if (audioTracks.length > 0) {
              const audioTrack = audioTracks[0];
              const checkQuality = () => {
                if (audioTrack.readyState === 'live') {
                  const videoTracks = remoteStream.getVideoTracks();
                  if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
                    setConnectionQuality('excellent');
                  } else {
                    setConnectionQuality('good');
                  }
                } else {
                  setConnectionQuality('poor');
                }
              };
              checkQuality();
              const qualityInterval = setInterval(checkQuality, 5000);
              audioTrack.onended = () => {
                clearInterval(qualityInterval);
                setConnectionQuality('poor');
              };
            }
            
            // Update session status to active
            if (actualSessionId) {
              updateSession(actualSessionId, { status: 'active' }).catch(console.error);
            }
            
            // Create return data channel
            if (peerRef.current && call.peer) {
              const returnConn = peerRef.current.connect(call.peer, { reliable: true });
              handleDataConnection(returnConn);
            }
          });

          call.on('close', () => {
            console.log('Call closed');
            cleanup();
          });

          call.on('error', (err: any) => {
            console.error('Call error:', err);
            if (err.type !== 'peer-unavailable') {
              setConnectionStatus('disconnected');
            }
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
    };

    initPeer();

    return () => {
      cleanup();
    };
  }, [loading, isVideoOff, isMuted, actualSessionId, session, cleanup]);

  const handleDataConnection = (conn: any) => {
    dataChannelsRef.current.set(conn.peer, conn);
    setParticipants(prev => Math.max(2, prev + 1));

    conn.on('open', () => {
      console.log('Data connection opened:', conn.peer);
      try {
        conn.send(JSON.stringify({
          type: 'system',
          message: 'Connection established',
        }));
      } catch (e) {
        console.error('Error sending welcome message:', e);
      }
    });

    conn.on('data', (data: string) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'system') {
          console.log('System message:', message.message);
          return;
        }
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
      console.log('Data connection closed:', conn.peer);
      dataChannelsRef.current.delete(conn.peer);
      setParticipants(prev => Math.max(1, prev - 1));
    });

    conn.on('error', (err: any) => {
      console.error('Data connection error:', err);
    });
  };

  const handleJoinWithMedia = async (stream: MediaStream, videoEnabled: boolean, audioEnabled: boolean) => {
    setShowMediaPreview(false);
    setIsMuted(!audioEnabled);
    setIsVideoOff(!videoEnabled);
    localStreamRef.current = stream;
    
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(console.error);
    }
    
    if (remotePeerId.trim()) {
      await startCallWithStream(stream);
    }
  };

  const startCallWithStream = async (stream: MediaStream) => {
    if (!remotePeerId.trim() && !isTutorSession) {
      return;
    }
    
    // For tutors: just wait for incoming calls, don't initiate
    if (isTutorSession) {
      return;
    }

    if (!peerRef.current) {
      addToast({ title: 'Error', description: 'PeerJS not initialized. Please wait...', type: 'error' });
      return;
    }

    setIsJoining(true);
    setConnectionStatus('connecting');

    try {
      const call = peerRef.current.call(remotePeerId, stream);
      callRef.current = call;

      call.on('stream', (remoteStream: MediaStream) => {
        console.log('Received remote stream');
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.play().catch(err => {
            console.error('Error playing remote video:', err);
          });
        }
        setParticipants(2);
        setIsInCall(true);
        setConnectionStatus('connected');
        setConnectionQuality('good'); // Default to good
        
        // Monitor connection quality
        const audioTracks = remoteStream.getAudioTracks();
        if (audioTracks.length > 0) {
          const audioTrack = audioTracks[0];
          const checkQuality = () => {
            if (audioTrack.readyState === 'live') {
              const videoTracks = remoteStream.getVideoTracks();
              if (videoTracks.length > 0 && videoTracks[0].readyState === 'live') {
                setConnectionQuality('excellent');
              } else {
                setConnectionQuality('good');
              }
            } else {
              setConnectionQuality('poor');
            }
          };
          checkQuality();
          const qualityInterval = setInterval(checkQuality, 5000);
          audioTrack.onended = () => {
            clearInterval(qualityInterval);
            setConnectionQuality('poor');
          };
        }
        
        // Update session status to active
        if (actualSessionId) {
          updateSession(actualSessionId, { status: 'active' }).catch(console.error);
        }
      });

      call.on('close', () => {
        console.log('Call closed');
        cleanup();
      });

      call.on('error', (err: any) => {
        console.error('Call error:', err);
        if (err.type !== 'peer-unavailable') {
          addToast({ title: 'Error', description: err.message || 'Failed to connect', type: 'error' });
        }
        setConnectionStatus('disconnected');
        setIsJoining(false);
      });

      const conn = peerRef.current.connect(remotePeerId, { reliable: true });
      handleDataConnection(conn);

    } catch (error: any) {
      console.error('Error starting call:', error);
      addToast({ title: 'Error', description: error.message || 'Failed to start call', type: 'error' });
      setConnectionStatus('disconnected');
    } finally {
      setIsJoining(false);
    }
  };

  const startCall = async () => {
    if (!remotePeerId.trim()) {
      addToast({ title: 'Error', description: 'Please enter the other person\'s Peer ID', type: 'error' });
      return;
    }

    if (!localStreamRef.current) {
      setShowMediaPreview(true);
      return;
    }

    await startCallWithStream(localStreamRef.current);
  };

  const getLocalStream = async (video: boolean, audio: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
        audio: audio,
      });
      
      stream.getVideoTracks().forEach(track => {
        track.enabled = video;
      });
      stream.getAudioTracks().forEach(track => {
        track.enabled = audio;
      });
      
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        localVideoRef.current.play().catch(err => {
          console.error('Error playing local video:', err);
        });
      }
      
      return stream;
    } catch (error: any) {
      console.error('Error accessing media devices:', error);
      throw error;
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
      name: user?.displayName || 'You',
      message: chatInput.trim(),
    };

    dataChannelsRef.current.forEach((conn) => {
      try {
        conn.send(JSON.stringify(message));
      } catch (e) {
        console.error('Error sending message:', e);
      }
    });

    setChatMessages(prev => [...prev, {
      id: Date.now().toString(),
      name: 'You',
      message: chatInput.trim(),
      timestamp: new Date(),
    }]);

    setChatInput('');
  };

  const leaveCall = () => {
    cleanup();
    router.push('/tutoring');
  };

  const copyPeerId = () => {
    if (myId) {
      navigator.clipboard.writeText(myId);
      addToast({ title: 'Copied!', description: 'Peer ID copied to clipboard', type: 'success' });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileNav />
              <button
                onClick={() => router.push('/tutoring')}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] items-center justify-center"
                aria-label="Back to tutoring"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {isTutorSession ? 'Tutor Session' : `Session with ${tutor.name}`}
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  {session?.subject || tutor.subjects[0] || 'General'}
                </p>
              </div>
            </div>
            {session && (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  session.status === 'active' ? 'bg-green-100 text-green-700' :
                  session.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {session.status}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <Breadcrumbs />
        {!isInCall ? (
          <div className="max-w-3xl mx-auto">
            {/* Tutor Waiting Room (Google Meet style) */}
            {isTutorSession ? (
              <div className="space-y-6">
                {/* Video Preview */}
                <div className="card overflow-hidden">
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
                    {localStreamRef.current ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <VideoCameraSlashIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">Camera off</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!localStreamRef.current) {
                              const stream = await getLocalStream(!isVideoOff, !isMuted);
                            } else {
                              const videoTrack = localStreamRef.current.getVideoTracks()[0];
                              if (videoTrack) {
                                videoTrack.enabled = !videoTrack.enabled;
                                setIsVideoOff(!videoTrack.enabled);
                              }
                            }
                          }}
                          className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-80 transition-all`}
                        >
                          {isVideoOff ? <VideoCameraSlashIcon className="h-5 w-5" /> : <VideoCameraIcon className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={async () => {
                            if (!localStreamRef.current) {
                              const stream = await getLocalStream(!isVideoOff, !isMuted);
                            } else {
                              const audioTrack = localStreamRef.current.getAudioTracks()[0];
                              if (audioTrack) {
                                audioTrack.enabled = !audioTrack.enabled;
                                setIsMuted(!audioTrack.enabled);
                              }
                            }
                          }}
                          className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-700'} text-white hover:opacity-80 transition-all`}
                        >
                          {isMuted ? <MicrophoneIcon className="h-5 w-5" /> : <MicrophoneIcon className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share Link Section */}
                {actualSessionId && (
                  <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <ClipboardDocumentIcon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-primary-900">Share Meeting Link</h3>
                        <p className="text-sm text-primary-700">Copy and send to your student</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/tutoring/session/${actualSessionId}`}
                        readOnly
                        className="flex-1 px-4 py-3 border-2 border-primary-300 rounded-xl bg-white text-gray-900 font-mono text-sm font-semibold"
                      />
                      <button
                        onClick={() => {
                          const link = `${window.location.origin}/tutoring/session/${actualSessionId}`;
                          navigator.clipboard.writeText(link).then(() => {
                            addToast({ title: 'Link Copied!', description: 'Share this link with your student', type: 'success' });
                          });
                        }}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-bold shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                        Copy Link
                      </button>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-primary-200">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-sm text-primary-800 font-medium">
                          Waiting for student to join... When they click the link, they'll join automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Student View */
              <div className="card">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                    <VideoCameraIcon className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Session</h2>
                  <p className="text-gray-600">
                    Connecting to {tutor.name}...
                  </p>
                </div>

              {/* Your Peer ID (for students) */}
              {!isTutorSession && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Peer ID (share with {tutor.name}):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={myId}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-mono text-sm"
                      placeholder={isInitializing ? 'Initializing...' : 'Your Peer ID will appear here'}
                    />
                    <button
                      onClick={copyPeerId}
                      disabled={!myId}
                      className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Copy Peer ID"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Enter Peer ID to Connect (manual fallback) */}
              {!isTutorSession && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter Tutor&apos;s Peer ID to connect:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={remotePeerId}
                      onChange={(e) => setRemotePeerId(e.target.value)}
                      placeholder="Enter Peer ID"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={startCall}
                      disabled={isJoining || !remotePeerId.trim()}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <VideoCameraIcon className="h-5 w-5" />
                          Join Session
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

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
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Video Section */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <div className="card overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                  {/* Local Video */}
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl relative">
                    {localStreamRef.current && !isVideoOff ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => {
                          localVideoRef.current?.play().catch(console.error);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <VideoCameraSlashIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Camera off</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      You {isMuted && '(Muted)'} {isVideoOff && '(Camera Off)'}
                    </div>
                  </div>
                  {/* Remote Video */}
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-xl relative">
                    {connectionStatus === 'connected' && remoteStreamRef.current ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => {
                          remoteVideoRef.current?.play().catch(console.error);
                        }}
                      />
                    ) : connectionStatus === 'connecting' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-white" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <VideoCameraSlashIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Waiting for connection...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                      {isTutorSession ? 'Student' : tutor.name}
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
                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {isMuted ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      </svg>
                    ) : (
                      <MicrophoneIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={toggleVideo}
                    className={`p-4 h-11 min-h-[44px] min-w-[44px] rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-110 ${
                      isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                  >
                    {isVideoOff ? <VideoCameraSlashIcon className="h-5 w-5" /> : <VideoCameraIcon className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={leaveCall}
                    className="p-4 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-110"
                    aria-label="Leave call"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Connection Status & Quality */}
                {connectionStatus === 'connected' && (
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="font-medium">Connected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500 font-medium">Quality:</span>
                      <div className="flex items-center gap-1">
                        {connectionQuality === 'excellent' && (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Excellent</span>
                          </>
                        )}
                        {connectionQuality === 'good' && (
                          <>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-green-600 font-medium">Good</span>
                          </>
                        )}
                        {connectionQuality === 'fair' && (
                          <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-yellow-600 font-medium">Fair</span>
                          </>
                        )}
                        {connectionQuality === 'poor' && (
                          <>
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                            <span className="text-xs text-red-600 font-medium">Poor</span>
                          </>
                        )}
                      </div>
                    </div>
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
                    <ChatBubbleLeftRightIcon className="h-4 w-4 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Chat</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                  <UserGroupIcon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">{participants}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4 max-h-[500px] overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {dataChannelsRef.current.size === 0 
                        ? 'Waiting for connection...' 
                        : `Start chatting with ${isTutorSession ? 'student' : tutor.name}`}
                    </p>
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

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={dataChannelsRef.current.size === 0}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || dataChannelsRef.current.size === 0}
                  className="px-5 py-3 h-11 min-h-[44px] min-w-[44px] bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  aria-label="Send message"
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Media Preview Modal */}
      {showMediaPreview && (
        <MediaPreview
          onJoin={handleJoinWithMedia}
          onCancel={() => setShowMediaPreview(false)}
        />
      )}
    </main>
  );
}
