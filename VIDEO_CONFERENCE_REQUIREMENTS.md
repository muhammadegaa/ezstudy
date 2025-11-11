# Video Conference Requirements - Production Ready

## Core Requirements

### 1. Permission Management
- **REQ-1.1**: Browser permission dialog MUST appear when user clicks camera/mic buttons for the first time
- **REQ-1.2**: Permission state must be checked before requesting media
- **REQ-1.3**: Clear error messages when permissions are denied
- **REQ-1.4**: Handle permission states: 'prompt', 'granted', 'denied'

### 2. Media Stream Management
- **REQ-2.1**: Camera button MUST request video stream when clicked (if no stream exists)
- **REQ-2.2**: Microphone button MUST request audio stream when clicked (if no stream exists)
- **REQ-2.3**: If stream exists, buttons toggle track.enabled state
- **REQ-2.4**: Stream must be properly attached to video element
- **REQ-2.5**: Video element MUST display video when camera is enabled
- **REQ-2.6**: Video element MUST hide/show based on isVideoOff state

### 3. State Synchronization
- **REQ-3.1**: UI state (isVideoOff/isMuted) MUST match MediaStream track.enabled states
- **REQ-3.2**: State updates must happen IMMEDIATELY after track changes
- **REQ-3.3**: Video element visibility must sync with isVideoOff state
- **REQ-3.4**: Button appearance must reflect actual track states

### 4. PeerJS Connection Flow
- **REQ-4.1**: Tutor creates session → PeerJS initializes → peerId saved to Firestore
- **REQ-4.2**: Student joins via link → Reads tutor's peerId → Connects automatically
- **REQ-4.3**: Tutor receives incoming call → Answers with local stream
- **REQ-4.4**: Student initiates call → Sends local stream → Receives remote stream
- **REQ-4.5**: Both peers see each other's video/audio

### 5. Video Display Logic
- **REQ-5.1**: Local video shows when: localStreamRef.current exists AND isVideoOff === false
- **REQ-5.2**: Remote video shows when: remoteStreamRef.current exists AND connectionStatus === 'connected'
- **REQ-5.3**: Video element must have srcObject set when stream exists
- **REQ-5.4**: Video element must call play() after srcObject is set

## Current Issues Identified

1. **Permission Dialog Not Appearing**
   - Root cause: getLocalStream logic may not be requesting permissions correctly
   - Impact: User can't grant permissions, camera/mic don't work

2. **State Not Syncing**
   - Root cause: State updates happen but video element doesn't reflect changes
   - Impact: Camera hardware on but UI shows "Camera Off"

3. **Video Not Displaying**
   - Root cause: Video element srcObject not set correctly or play() not called
   - Impact: Black screen even when stream exists

4. **Connection Flow Broken**
   - Root cause: Multiple PeerJS instances, cleanup issues
   - Impact: Peers can't connect

## Success Criteria

✅ **Camera Button Clicked**:
- Permission dialog appears (if not granted)
- Stream obtained
- Video displays in UI
- Button shows camera ON state

✅ **Microphone Button Clicked**:
- Permission dialog appears (if not granted)
- Stream obtained
- Audio track enabled
- Button shows mic ON state

✅ **Tutor Creates Session**:
- PeerJS initializes
- peerId saved to Firestore
- Waiting room shows with camera/mic controls

✅ **Student Joins**:
- Reads tutor's peerId from Firestore
- Connects via PeerJS
- Video/audio streams exchanged
- Both see each other

