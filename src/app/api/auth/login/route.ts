// 文件路径: src/app/api/auth/login/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

interface UserData {
  hashedPassword: string;
  name: string;
  email: string;
  phone?: string;
  permission?: 'full' | 'readonly';
}

export async function POST(request: NextRequest) {
  try {
    // [最终修复] 接收前端明确指定的登录方式 'method'
    const { username, password, method } = await request.json();
    if (!username || !password || !method) {
      return NextResponse.json({ message: '请求参数不完整' }, { status: 400 });
    }

    let user: UserData | null = null;

    // [最终修复] 根据前端传递的 'method' 决定查找逻辑，不再猜测
    if (method === 'email') {
      const userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
    } else if (method === 'phone') {
      // 手机号登录逻辑保持不变，但现在只有在前端明确指定时才会触发
      const phoneIndexKey = `user_phone:${username}`;
      const userIdentifier = await kv.get<string>(phoneIndexKey);

      if (userIdentifier) {
        const userKey = `user:${userIdentifier}`;
        user = await kv.get<UserData>(userKey);
      } else {
        console.warn(`Phone index not found for ${username}. Falling back to a full scan.`);
        let cursor = 0;
        do {
          const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*' });
          for (const key of keys) {
            const rawData = await kv.get(key);
            let potentialUser: UserData | null = null;

            if (typeof rawData === 'string') {
              try {
                potentialUser = JSON.parse(rawData) as UserData;
              } catch {
                continue;
              }
            } else if (rawData && typeof rawData === 'object') {
              potentialUser = rawData as UserData;
            }
            
            if (potentialUser && potentialUser.phone && String(potentialUser.phone).trim() === String(username).trim()) {
              user = potentialUser;
              break;
            }
          }
          cursor = Number(nextCursor);
        } while (cursor !== 0 && !user);
      }
    } else {
        // 如果 method 不是 'email' 或 'phone'，则认为是无效请求
        return NextResponse.json({ message: '不支持的登录方式' }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ message: '该用户不存在。' }, { status: 401 });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (passwordMatch) {
      const expirationTime = '24h';
      
      const payload = { 
        username: user.name,
        email: user.email,
        permission: user.permission || 'user'
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secret);

      const responsePayload = {
          success: true,
          user: {
            name: payload.username,
            email: payload.email,
          },
          token: token
      };
      
      const response = NextResponse.json(responsePayload, { status: 200 });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return response;
    } else {
      return NextResponse.json({ message: '密码错误。' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
