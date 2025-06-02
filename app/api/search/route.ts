import { NextResponse } from 'next/server';
import Fuse from 'fuse.js';
import { fetchMovies, IXtreamServer, IMovie } from '@/lib/xtream';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, password, query, exactMatch = false } = body;
    
    if (!url || !username || !password || !query) {
      return NextResponse.json(
        { message: 'URL, username, password, and search query are required' },
        { status: 400 }
      );
    }
    
    const server: IXtreamServer = {
      url,
      username,
      password
    };
    
    // Fetch all movies
    const allMovies = await fetchMovies(server);
    
    let results: IMovie[] = [];
    
    if (exactMatch) {
      // Exact match
      results = allMovies.filter(movie => {
        const movieName = (movie.name || movie.title || '').toLowerCase();
        return movieName === query.toLowerCase();
      });
    } else {
      // Fuzzy search with fuse.js
      const fuse = new Fuse(allMovies, {
        keys: ['name', 'title'],
        threshold: 0.4,
      });
      results = fuse.search(query).map(result => result.item);
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching movies:', error);
    return NextResponse.json(
      { message: 'Failed to search movies' },
      { status: 500 }
    );
  }
}