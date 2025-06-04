import { NextRequest, NextResponse } from 'next/server';
import { Xtream } from '@iptv/xtream-api';
import { IXtreamServer } from '@/lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const { server, seriesId }: { server: IXtreamServer; seriesId: number } = await req.json();
    const xtream = new Xtream(server);
    const info = await xtream.getShow({ showId: seriesId });
    return NextResponse.json(info);
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
