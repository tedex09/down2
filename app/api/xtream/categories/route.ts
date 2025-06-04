import { NextRequest, NextResponse } from 'next/server';
import { Xtream } from '@iptv/xtream-api';
import { IXtreamServer } from '@/lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const { server }: { server: IXtreamServer } = await req.json();
    const xtream = new Xtream(server);
    const categories = await xtream.getMovieCategories();
    return NextResponse.json(categories);
  } catch (e) {
    return NextResponse.json({ error: `Internal error: ${e}` }, { status: 500 });
  }
}
