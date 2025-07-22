import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Server } from '@/models/Server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    await dbConnect();
    
    const server = await Server.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    
    if (!server) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(server);
  } catch (error) {
    console.error('Error updating server:', error);
    return NextResponse.json(
      { message: 'Failed to update server' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    await dbConnect();
    
    const result = await Server.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { message: 'Server not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Error deleting server:', error);
    return NextResponse.json(
      { message: 'Failed to delete server' },
      { status: 500 }
    );
  }
}