# ezstudy

Academic Live Translation & Learning Companion for Chinese and Indonesian students studying in the UK.

## Features

- Real-time English ↔ Mandarin and English ↔ Bahasa Indonesia translation
- Academic glossary highlighting and contextual definitions
- Slide/document upload & translation
- Voice input/output support
- User-friendly mobile/web interface with language preference toggles
- Session history with export options

## Tech Stack

- Next.js 14+ with React and TypeScript
- OpenRouter API for translation and glossary
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
# Add your OpenRouter API key to .env
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and API clients
- `/types` - TypeScript type definitions

