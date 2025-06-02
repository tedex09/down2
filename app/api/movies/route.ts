import { NextResponse } from 'next/server';
import { fetchMovies, IXtreamServer } from '@/lib/xtream';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    const categoryId = searchParams.get('category_id');
    
    if (!url || !username || !password) {
      return NextResponse.json(
        { message: 'URL, username, and password are required' },
        { status: 400 }
      );
    }
    
    const server: IXtreamServer = {
      url,
      username,
      password
    };
    
    const movies = await fetchMovies(server, categoryId || undefined);
    
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
}