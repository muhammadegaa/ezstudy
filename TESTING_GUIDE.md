# Testing Guide - Conference Call (WebRTC)

## How to Test Video Conferencing

### Method 1: Two Browser Windows (Recommended)
1. **Open First Window (Student/Tutor 1)**:
   - Navigate to `/tutoring`
   - Select "I'm a Student" or "I'm a Tutor"
   - Browse tutors and click "Book Session" on any tutor
   - Wait for Peer ID to generate (shown in "Your Peer ID" field)
   - Copy the Peer ID (click the Copy button)

2. **Open Second Window (Student/Tutor 2)**:
   - Open a new incognito/private window or different browser
   - Navigate to the same URL: `/tutoring/session/[same-tutor-id]`
   - Paste the Peer ID from Window 1 into "Enter Peer ID to connect"
   - Click "Connect"

3. **Connection Flow**:
   - Window 1: Click "Start Session" (this generates your Peer ID)
   - Window 2: Enter Window 1's Peer ID and click "Connect"
   - Both windows should show video feeds and "Connected" status
   - Test chat, mute, video toggle, and Live Learning Assistant

### Method 2: Two Devices
1. **Device 1**: Open the app, go to tutoring session, copy Peer ID
2. **Device 2**: Open the app on same network, enter Device 1's Peer ID
3. Both devices connect via WebRTC

### Method 3: Share Peer ID Externally
1. Generate Peer ID in one browser
2. Share Peer ID via phone/email/messaging app
3. Other person enters Peer ID in their browser
4. Connect!

## Testing Checklist

- [ ] Peer ID generates correctly
- [ ] Peer ID can be copied
- [ ] Connection establishes between two peers
- [ ] Video streams appear on both sides
- [ ] Audio works (test mute/unmute)
- [ ] Video toggle works
- [ ] Chat messages send/receive
- [ ] Live Learning Assistant works during call
- [ ] Translation works in real-time
- [ ] Visual aids appear for concepts
- [ ] Notes can be taken during session
- [ ] Leave call button works

## Troubleshooting

**Issue: Peer ID not generating**
- Wait a few seconds (PeerJS needs to connect to signaling server)
- Check browser console for errors
- Try refreshing the page

**Issue: Connection fails**
- Ensure both windows are on the same network (for local testing)
- Check firewall settings
- Try using different Peer IDs
- Check browser console for WebRTC errors

**Issue: No video/audio**
- Allow camera/microphone permissions in browser
- Check browser settings for media permissions
- Try different browser (Chrome/Firefox recommended)

**Issue: Chat not working**
- Ensure connection is established (green "Connected" status)
- Check browser console for data channel errors
- Try refreshing both windows

