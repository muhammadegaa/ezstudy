import { NextRequest, NextResponse } from 'next/server';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Public beta key (free)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ gifs: [] });
    }

    // Use Giphy API (free public beta key - completely free!)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=5&rating=g&lang=en`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Return empty array instead of error - don't break UI
      return NextResponse.json({ gifs: [] });
    }

    const data = await response.json();
    
    const gifs = (data.data || []).map((gif: any) => ({
      id: gif.id,
      url: gif.images?.fixed_height?.url || gif.images?.original?.url || gif.images?.downsized?.url,
      title: gif.title || query,
      width: gif.images?.fixed_height?.width || 200,
      height: gif.images?.fixed_height?.height || 200,
    })).filter((gif: any) => gif.url); // Only return gifs with valid URLs
    
    return NextResponse.json({ gifs });
  } catch (error: any) {
    // Always return empty array - never break the UI
    console.error('GIF search error:', error);
    return NextResponse.json({ gifs: [] });
  }
}

