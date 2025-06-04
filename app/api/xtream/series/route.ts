import { NextRequest, NextResponse } from 'next/server';
import { Xtream } from '@iptv/xtream-api';
import { IXtreamServer } from '@/lib/xtream';

export async function POST(req: NextRequest) {
  try {
    const { server, categoryId }: { server: IXtreamServer; categoryId?: string } = await req.json();
    const xtream = new Xtream(server);
    const series = await xtream.getShows(categoryId ? { categoryId } : {});
    return NextResponse.json(series);
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
