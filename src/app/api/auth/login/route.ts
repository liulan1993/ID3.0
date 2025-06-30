// 文件路径: src/app/api/auth/login/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '账号和密码不能为空' }, { status: 400 });
    }

    const userKey = `user:${username}`;
    const user = await kv.get(userKey);

    if (!user || typeof user !== 'object') {
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }

    const userData = user as { passwordHash: string; permission: 'full' | 'readonly' };
    
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (passwordMatch) {
      // 凭证正确，创建包含权限信息的 JWT
      const expirationTime = '24h';
      const payload = { username, permission: userData.permission };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secret);

      const response = NextResponse.json({ success: true, permission: userData.permission }, { status: 200 });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24小时
      });

      return response;
    } else {
      // 凭证错误
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
