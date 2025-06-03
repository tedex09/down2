import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { encrypt, login } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    await dbConnect();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário ou senha incorretos.' },
        { status: 401 }
      );
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { message: 'Usuário ou senha incorretos.' },
        { status: 401 }
      );
    }

    // Create session
    const token = await encrypt({ id: user._id, username: user.username });
    await login(token);

    return NextResponse.json({ message: 'Logado com sucesso!' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Erro interno' },
      { status: 500 }
    );
  }
}