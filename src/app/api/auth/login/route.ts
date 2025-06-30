// 文件路径: src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// 从环境变量中获取密钥，确保安全
// 您需要在 .env.local 文件中设置一个 JWT_SECRET
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

// 在这里设置固定的账号和密码
const ADMIN_USERNAME = 'sara';
const ADMIN_PASSWORD = 'Apex@2025'; // 请务必修改为更安全的密码

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 验证账号和密码
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 凭证正确，创建 JWT
      const expirationTime = '24h';
      const payload = { username };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secret);

      // 创建一个成功的响应
      const response = NextResponse.json({ success: true }, { status: 200 });

      // 在响应上设置 httpOnly cookie
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
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
