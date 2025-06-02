import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Server } from '@/models/Server';

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