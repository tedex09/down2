import { NextRequest, NextResponse } from 'next/server';
import { Xtream } from '@iptv/xtream-api';
import { IXtreamServer } from '@/lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const { server, movieId }: { server: IXtreamServer; movieId: string } = await req.json();
    const xtream = new Xtream(server);
    const info = await xtream.getMovie({ movieId });
    return NextResponse.json(info);
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
