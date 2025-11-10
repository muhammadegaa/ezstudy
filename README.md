# ezstudy

Academic Live Translation & Learning Companion for Chinese and Indonesian students studying in the UK.

## Features

- Real-time English ↔ Mandarin and English ↔ Bahasa Indonesia translation
- Academic glossary highlighting and contextual definitions
- Slide/document upload & translation
- Voice input/output support
- User-friendly mobile/web interface with language preference toggles
- Session history with export options
- **Live video tutoring sessions** with HD video/audio conferencing
- **Real-time translation** - See translations appear instantly as professor speaks (not after recording!)
- **Instant visual aids** - GIFs/animations appear immediately when concepts are mentioned
- **Active note-taking** - Take notes while listening, with automatic concept tagging
- Screen sharing for presentations and document review
- Real-time chat during tutoring sessions
- All features work simultaneously - listen, translate, see references, and take notes at the same time

## Tech Stack

- Next.js 14+ with React and TypeScript
- **Firebase** - Authentication (Email/Password) & Firestore Database
- PeerJS (WebRTC) for free video conferencing - no paid services required!
- Tailwind CSS for styling
- Web Speech API for voice support
- OpenRouter API (optional) for AI concept detection

## Firebase Setup

This app uses Firebase for authentication and data storage. See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete setup instructions.

**Quick Setup:**
1. Copy `.env.example` to `.env.local`
2. Add your Firebase config (see FIREBASE_SETUP.md)
3. Enable Email/Password auth in Firebase Console
4. Deploy Firestore rules from `firestore.rules`

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (OPTIONAL):
```bash
cp .env.example .env
```

Edit `.env` (all optional - app works without any API keys!):
```
# Optional: Giphy API key (free tier works without it)
GIPHY_API_KEY=dc6zaTOxFJmzC

# Optional: App URL (auto-detected)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**No API keys required!** The app uses:
- LibreTranslate (free, open-source) for translation
- Free pattern matching for concept extraction
- Free Giphy public beta key for GIFs
- Free PeerJS WebRTC for video conferencing

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Real-time Translation
1. Select source and target languages using the language toggle
2. Enter text in the input field or use voice input
3. Click "Translate" or press Cmd/Ctrl + Enter
4. View translation with glossary terms highlighted

### Voice Input
- Click "Start Voice Input" to begin recording
- Speak clearly in your source language
- The transcript will automatically populate the translation input

### Document Upload
- Upload a TXT file containing lecture notes or slides
- Preview the content
- Click "Translate Document" to translate the entire document

### Session History
- All translations are automatically saved
- Click on a session to view details
- Export sessions as text files
- Delete sessions you no longer need

### Live Tutoring Sessions
1. Click "Start Tutoring" from the main page
2. **To create a room:** Enter any room name and click "Create Room"
3. **To join a room:** Enter the host's Peer ID (shown after creating) and click "Join Room"
4. Share your Peer ID with your tutor/student (click the copy button)
5. Features available during sessions:
   - Free WebRTC video and audio (no paid services!)
   - **Live Learning Assistant** - Click "Start Listening" to activate:
     - **Real-time translation** - See translations appear instantly as words are spoken
     - **Instant visual references** - GIFs/animations appear immediately when concepts are mentioned (physics laws, chemical reactions, etc.)
     - **Active note-taking** - Take notes while listening, with automatic concept tagging
   - Screen sharing for presentations
   - Real-time chat messaging
   - Mute/unmute audio and video controls
6. **How It Works:**
   - Click "Start Listening" - The assistant begins transcribing in real-time
   - **As professor speaks:**
     - Original text appears on the left
     - Translation appears instantly on the right (no waiting!)
     - Visual aids (GIFs) appear immediately when concepts are detected
   - **Take notes:** Add your own notes or click "Add Note" to save current transcription
   - All features work simultaneously - you can listen, see translations, view visual aids, and take notes at the same time!
7. Click "Leave" to exit the session

## Sample Lecture Texts

### English Sample:
"The fundamental principles of quantum mechanics challenge our classical understanding of physics. Wave-particle duality suggests that particles exhibit both wave-like and particle-like properties depending on the observation method."

### Academic Terms Glossary:
- **Quantum mechanics**: A branch of physics dealing with atomic and subatomic systems
- **Wave-particle duality**: The concept that matter exhibits both wave and particle characteristics

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
2. Click "Add New Project"
3. Import your GitHub repository: `muhammadegaa/ezstudy`
4. Configure environment variables (OPTIONAL):
   - `GIPHY_API_KEY` - Optional, free tier works without it
   - `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL (will be auto-filled)
5. Click "Deploy"
6. Wait for deployment to complete

**No API keys required!** Everything works with free services.

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Add environment variables in Vercel dashboard (OPTIONAL):
```bash
vercel env add GIPHY_API_KEY  # Optional
vercel env add NEXT_PUBLIC_APP_URL  # Optional
```

5. Redeploy with environment variables:
```bash
vercel --prod
```

### Environment Variables in Vercel (All Optional!)

The app works completely without any API keys! All services are free:
- **Translation**: LibreTranslate (free, open-source)
- **Concept Extraction**: Free pattern matching
- **GIFs**: Giphy free public beta key
- **Video Conferencing**: Free PeerJS WebRTC

Optional environment variables:
- `GIPHY_API_KEY` - Optional, free tier works without it
- `NEXT_PUBLIC_APP_URL` - Auto-detected, optional to set manually

**100% FREE - No paid services required!**

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and API clients
- `/types` - TypeScript type definitions

