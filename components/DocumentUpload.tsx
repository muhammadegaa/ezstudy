'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import type { Language, Translation } from '@/types';

interface DocumentUploadProps {
  sourceLang: Language;
  targetLang: Language;
  onTranslationComplete: (translations: Translation[]) => void;
}

export default function DocumentUpload({
  sourceLang,
  targetLang,
  onTranslationComplete,
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    try {
      const fileText = await readFile(selectedFile);
      setText(fileText);
    } catch (err: any) {
      setError(err.message || 'Failed to read file');
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    
    // Split text into chunks for better translation
    const chunks = text.match(/.{1,500}/g) || [text];
    const translations: Translation[] = [];

    try {

      for (const chunk of chunks) {
        try {
          const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: chunk,
              sourceLang,
              targetLang,
              includeGlossary: true,
            }),
          });

          if (!response.ok) {
            // Continue with next chunk instead of failing completely
            translations.push({
              original: chunk,
              translated: chunk + ' [Translation failed for this chunk]',
              language: targetLang,
              glossary: [],
            });
            continue;
          }

          const data = await response.json();
          translations.push({
            original: chunk,
            translated: data.translation || chunk,
            language: targetLang,
            glossary: data.glossary?.map((g: any) => ({
              ...g,
              language: targetLang,
            })) || [],
          });
        } catch (chunkError) {
          // Continue with next chunk - don't fail entire document
          translations.push({
            original: chunk,
            translated: chunk + ' [Translation error]',
            language: targetLang,
            glossary: [],
          });
        }
      }

      onTranslationComplete(translations);
      setText('');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Translation failed. Some chunks may have been translated successfully.');
      // Still save what we got
      if (translations.length > 0) {
        onTranslationComplete(translations);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg p-6 shadow-sm space-y-4">
      <h2 className="text-xl font-semibold text-text flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Document Upload
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Upload Document (TXT, PDF text extraction coming soon)
          </label>
          <div className="border-2 border-dashed border-accent rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".txt,.text"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-accent" />
              <span className="text-sm text-text">
                Click to upload or drag and drop
              </span>
              <span className="text-xs text-accent">TXT files only</span>
            </label>
          </div>
          {file && (
            <p className="text-sm text-accent mt-2">
              Selected: {file.name}
            </p>
          )}
        </div>

        {text && (
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Preview ({text.length} characters)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded border border-accent bg-background text-text focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows={8}
              readOnly
            />
          </div>
        )}

        {text && (
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="w-full px-4 py-3 bg-accent text-background rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Translating document...' : 'Translate Document'}
          </button>
        )}

        {error && (
          <div className="p-3 bg-red-100 text-red-800 rounded text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

