import { NextResponse } from 'next/server';
import { fetchCategories, IXtreamServer } from '@/lib/xtream';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const username = searchParams.get('username');
    const password = searchParams.get('password');
    
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
    
    const categories = await fetchCategories(server);
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}