'use client';

import { useState, useEffect } from 'react';
import { Image, Loader2, X } from 'lucide-react';
import type { Language } from '@/types';

interface Concept {
  name: string;
  description: string;
  searchTerms: string[];
}

interface Gif {
  id: string;
  url: string;
  title: string;
  width: number;
  height: number;
}

interface VisualAidsProps {
  transcript: string;
  language: Language;
}

export default function VisualAids({ transcript, language }: VisualAidsProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [gifs, setGifs] = useState<Map<string, Gif[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState<string | null>(null);

  useEffect(() => {
    if (!transcript.trim() || transcript.length < 20) return;

    // Debounce concept analysis
    const timer = setTimeout(() => {
      analyzeConcepts(transcript);
    }, 2000);

    return () => clearTimeout(timer);
  }, [transcript]);

  const analyzeConcepts = async (text: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze concepts');
      }

      const data = await response.json();
      setConcepts(data.concepts || []);

      // Fetch GIFs for each concept
      for (const concept of data.concepts || []) {
        fetchGifs(concept);
      }
    } catch (error) {
      console.error('Concept analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGifs = async (concept: Concept) => {
    try {
      // Use the first search term
      const searchTerm = concept.searchTerms[0] || concept.name;
      const response = await fetch(`/api/gifs?q=${encodeURIComponent(searchTerm)}`);

      if (response.ok) {
        const data = await response.json();
        setGifs((prev) => {
          const newMap = new Map(prev);
          newMap.set(concept.name, data.gifs || []);
          return newMap;
        });
      }
    } catch (error) {
      console.error('GIF fetch error:', error);
    }
  };

  if (concepts.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="bg-surface rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Image className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-semibold text-text">Visual Aids</h3>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {concepts.map((concept) => {
          const conceptGifs = gifs.get(concept.name) || [];
          const isExpanded = expandedConcept === concept.name;

          return (
            <div
              key={concept.name}
              className="bg-background rounded-lg p-3 border border-accent/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-text text-sm mb-1">
                    {concept.name}
                  </h4>
                  <p className="text-xs text-accent mb-2">{concept.description}</p>
                  
                  {conceptGifs.length > 0 && (
                    <button
                      onClick={() =>
                        setExpandedConcept(isExpanded ? null : concept.name)
                      }
                      className="text-xs text-accent hover:text-text transition-colors"
                    >
                      {isExpanded ? 'Hide' : 'Show'} visualizations ({conceptGifs.length})
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && conceptGifs.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {conceptGifs.map((gif) => (
                    <div
                      key={gif.id}
                      className="relative rounded overflow-hidden bg-black aspect-video"
                    >
                      <img
                        src={gif.url}
                        alt={gif.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

