import { NextRequest, NextResponse } from 'next/server';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, roomName } = body;

    if (!DAILY_API_KEY) {
      return NextResponse.json(
        { error: 'Daily.co API key not configured' },
        { status: 500 }
      );
    }

    if (action === 'create') {
      // Create a new room
      const response = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName || `room-${Date.now()}`,
          privacy: 'public',
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            enable_knocking: false,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily API error: ${error}`);
      }

      const room = await response.json();
      return NextResponse.json({
        room: room.data,
        url: room.data.url,
        token: await createMeetingToken(room.data.name),
      });
    } else if (action === 'join') {
      // Generate token for existing room
      if (!roomName) {
        return NextResponse.json(
          { error: 'Room name required' },
          { status: 400 }
        );
      }

      const token = await createMeetingToken(roomName);
      return NextResponse.json({
        url: `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'ezstudy.daily.co'}/${roomName}`,
        token,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Room API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create/join room' },
      { status: 500 }
    );
  }
}

async function createMeetingToken(roomName: string): Promise<string> {
  const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DAILY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: false,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create meeting token');
  }

  const data = await response.json();
  return data.token;
}

