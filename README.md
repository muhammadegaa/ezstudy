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
- **Real-time transcription** - Understand what the professor says instantly
- **Visual aids** - Automatic GIFs/animations for academic concepts (e.g., physics laws)
- Screen sharing for presentations and document review
- Real-time chat during tutoring sessions
- Integrated translation support during calls

## Tech Stack

- Next.js 14+ with React and TypeScript
- OpenRouter API for translation and glossary
- PeerJS (WebRTC) for free video conferencing - no paid services required!
- Tailwind CSS for styling
- Web Speech API for voice support

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your API key from:
- [OpenRouter](https://openrouter.ai/keys) - for translation

**Note:** Video conferencing uses PeerJS with free WebRTC - no API key needed!

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
   - **Real-time transcription** - Click "Start" to transcribe what's being said
   - **Visual aids** - Automatic GIFs/animations appear for concepts like physics laws, chemical reactions, etc.
   - Screen sharing for presentations
   - Real-time chat messaging
   - Integrated translation panel
   - Mute/unmute audio and video controls
6. **Understanding Features:**
   - Enable transcription to see real-time text of what the professor says
   - Visual aids automatically show relevant GIFs/animations for academic concepts
   - Use translation features to translate academic terms to your language
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
4. Configure environment variables:
   - `OPENROUTER_API_KEY` - Your OpenRouter API key
   - `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL (will be auto-filled)
5. Click "Deploy"
6. Wait for deployment to complete

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

4. Add environment variables in Vercel dashboard or via CLI:
```bash
vercel env add OPENROUTER_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

5. Redeploy with environment variables:
```bash
vercel --prod
```

### Environment Variables in Vercel

Make sure to add these environment variables in your Vercel project settings:
- `OPENROUTER_API_KEY` - Your OpenRouter API key (required)
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL (auto-set, but can be manually configured)

**Note:** Video conferencing uses free WebRTC (PeerJS) - no additional API keys needed!

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and API clients
- `/types` - TypeScript type definitions

