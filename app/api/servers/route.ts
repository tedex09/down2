import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Server } from '@/models/Server';

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    await dbConnect();
    const servers = await Server.find({}).sort({ createdAt: -1 });
    return NextResponse.json(servers);
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { message: 'Failed to fetch servers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, username, password } = body;
    
    // Validate required fields
    if (!url || !username || !password) {
      return NextResponse.json(
        { message: 'URL, username, and password are required' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Check if server already exists
    const existingServer = await Server.findOne({
      url,
      username,
    });
    
    if (existingServer) {
      return NextResponse.json(
        { message: 'Server with this URL and username already exists' },
        { status: 409 }
      );
    }
    
    // Create new server
    const server = new Server({
      url,
      username,
      password,
      createdAt: new Date(),
    });
    
    await server.save();
    
    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { message: 'Failed to add server' },
      { status: 500 }
    );
  }
}