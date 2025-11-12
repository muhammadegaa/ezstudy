'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoCameraIcon, VideoCameraSlashIcon, MicrophoneIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface MediaPreviewProps {
  onJoin: (stream: MediaStream, videoEnabled: boolean, audioEnabled: boolean) => void;
  onCancel: () => void;
}

export default function MediaPreview({ onJoin, onCancel }: MediaPreviewProps) {
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'prompt' | 'granted' | 'denied'>('unknown');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Don't request media automatically - user must click "Enable Camera & Microphone"
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return;

    let cancelled = false;
    let cameraStatus: PermissionStatus | null = null;
    let microphoneStatus: PermissionStatus | null = null;

    const updateStatus = () => {
      if (cancelled) return;
      const states = [cameraStatus?.state, microphoneStatus?.state];
      if (states.includes('denied')) {
        setPermissionStatus('denied');
      } else if (states.every(state => state === 'granted')) {
        setPermissionStatus('granted');
      } else if (states.some(state => state === 'prompt')) {
        setPermissionStatus('prompt');
      } else {
        setPermissionStatus('unknown');
      }
    };

    const watchPermissions = async () => {
      try {
        const results = await Promise.all([
          navigator.permissions.query({ name: 'camera' as PermissionName }),
          navigator.permissions.query({ name: 'microphone' as PermissionName }),
        ]);

        cameraStatus = results[0];
        microphoneStatus = results[1];

        const handleChange = () => updateStatus();
        cameraStatus.onchange = handleChange;
        microphoneStatus.onchange = handleChange;

        updateStatus();
      } catch (err) {
        console.warn('Unable to query media permissions:', err);
        setPermissionStatus('unknown');
      }
    };

    watchPermissions();

    return () => {
      cancelled = true;
      if (cameraStatus) cameraStatus.onchange = null;
      if (microphoneStatus) microphoneStatus.onchange = null;
    };
  }, []);

  const requestMedia = async () => {
    setIsRequesting(true);
    setError(null);
    setShowPermissionHelp(false);

    try {
      // Request both video and audio, but we'll control them separately
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      setStream(mediaStream);
      
      // Set initial states based on tracks
      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];
      
      setVideoEnabled(videoTrack?.enabled ?? false);
      setAudioEnabled(audioTrack?.enabled ?? false);
      setPermissionStatus('granted');

      // Display preview
      if (videoRef.current && videoTrack) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err: any) {
      console.error('Error requesting media:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera and microphone access denied. Please allow access in your browser settings and try again.');
        setPermissionStatus('denied');
        setShowPermissionHelp(true);
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
        setPermissionStatus('unknown');
      } else {
        setError(`Failed to access camera/microphone: ${err.message}`);
        setPermissionStatus('unknown');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const handleJoin = () => {
    if (!stream) {
      setError('Please enable camera and microphone first');
      return;
    }
    onJoin(stream, videoEnabled, audioEnabled);
  };

  return (
    <div className="fixed inset-0 z-[1700] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Join Video Session</h2>
            <p className="text-sm text-gray-600 mt-1">Check your camera and microphone before joining</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <p className="text-sm text-red-800 font-medium">{error}</p>
              {(permissionStatus === 'denied' || showPermissionHelp) && (
                <div className="bg-red-100/60 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <p className="font-semibold mb-2">How to re-enable camera &amp; microphone:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Click the lock icon in your browser&apos;s address bar.</li>
                    <li>Set both <span className="font-semibold">Camera</span> and <span className="font-semibold">Microphone</span> to <span className="font-semibold">Allow</span>.</li>
                    <li>Refresh this page, then click &quot;Enable Camera &amp; Microphone&quot; again.</li>
                  </ul>
                  <p className="mt-2 text-xs text-red-600">
                    Tip: If you use Safari, open Preferences → Websites → Camera/Microphone and allow access for this site.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video Preview */}
          <div className="mb-6">
            <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
              {stream && videoEnabled ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                          <VideoCameraSlashIcon className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">Camera preview</p>
                    {!stream && (
                      <p className="text-xs text-gray-500 mt-1">Click &quot;Enable Camera &amp; Microphone&quot; to start</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Video overlay controls */}
              {stream && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-xl transition-all ${
                      videoEnabled
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-red-500/80 hover:bg-red-600/80 text-white'
                    }`}
                    aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {videoEnabled ? (
                      <VideoCameraIcon className="h-5 w-5" />
                    ) : (
                      <VideoCameraSlashIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-xl transition-all ${
                      audioEnabled
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-red-500/80 hover:bg-red-600/80 text-white'
                    }`}
                    aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {audioEnabled ? (
                      <MicrophoneIcon className="h-5 w-5" />
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {!stream ? (
              <Button
                onClick={requestMedia}
                loading={isRequesting}
                className="flex-1"
                leftIcon={isRequesting ? undefined : <VideoCameraIcon className="h-5 w-5" />}
              >
                {isRequesting ? 'Requesting access...' : 'Enable Camera & Microphone'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleJoin}
                  variant="primary"
                  className="flex-1"
                  leftIcon={<CheckCircleIcon className="h-5 w-5" />}
                >
                  Join Session
                </Button>
                <Button
                  onClick={() => {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                    setVideoEnabled(false);
                    setAudioEnabled(false);
                  }}
                  variant="outline"
                >
                  Reset
                </Button>
              </>
            )}
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> You can turn your camera or microphone on/off anytime during the session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

