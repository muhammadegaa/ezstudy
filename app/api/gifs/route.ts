import { NextRequest, NextResponse } from 'next/server';

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || 'dc6zaTOxFJmzC'; // Public beta key (free)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Use Giphy API (free public beta key)
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=5&rating=g&lang=en`
    );

    if (!response.ok) {
      throw new Error('Giphy API error');
    }

    const data = await response.json();
    
    return NextResponse.json({
      gifs: data.data?.map((gif: any) => ({
        id: gif.id,
        url: gif.images?.fixed_height?.url || gif.images?.original?.url,
        title: gif.title,
        width: gif.images?.fixed_height?.width,
        height: gif.images?.fixed_height?.height,
      })) || [],
    });
  } catch (error: any) {
    console.error('GIF search error:', error);
    // Return empty array instead of error to not break the UI
    return NextResponse.json({ gifs: [] });
  }
}

