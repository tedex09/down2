import { NextResponse } from 'next/server';
import { fetchMovieInfo, IXtreamServer } from '@/lib/xtream';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const streamId = searchParams.get('stream_id');
    
    if (!url || !username || !password || !streamId) {
      return NextResponse.json(
        { message: 'URL, username, password, and stream_id are required' },
        { status: 400 }
      );
    }
    
    const server: IXtreamServer = {
      url,
      username,
      password
    };
    
    const movieInfo = await fetchMovieInfo(server, streamId);
    
    return NextResponse.json(movieInfo);
  } catch (error) {
    console.error('Error fetching movie info:', error);
    return NextResponse.json(
      { message: 'Failed to fetch movie info' },
      { status: 500 }
    );
  }
}