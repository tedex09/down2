import { NextRequest, NextResponse } from 'next/server';
import { Xtream } from '@iptv/xtream-api';
import { IXtreamServer } from '@/lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const { server, categoryId }: { server: IXtreamServer; categoryId?: string } = await req.json();
    const xtream = new Xtream(server);
    const movies = await xtream.getMovies(categoryId ? { categoryId } : {});
    return NextResponse.json(movies);
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
