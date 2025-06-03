import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'your-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(token: string): Promise<any> {
  const { payload } = await jwtVerify(token, key);
  return payload;
}

export async function login(token: string) {
  cookies().set('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 86400 // 24 hours
  });
}

export async function logout() {
  cookies().delete('token');
}

export async function getSession() {
  const token = cookies().get('token')?.value;
  if (!token) return null;
  try {
    return await decrypt(token);
  } catch (error) {
    return null;
  }
}

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    return await decrypt(token);
  } catch (error) {
    return null;
  }
}