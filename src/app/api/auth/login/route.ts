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
    // [最终修复] 后端现在接收 'username'，它可以是邮箱或手机号
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '请求参数不完整' }, { status: 400 });
    }

    let user: UserData | null = null;
    
    // [最终修复] 依赖前端验证，通过 'includes' 判断是邮箱还是手机号
    const isEmail = username.includes('@');

    if (isEmail) {
      const userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
    } else { // isPhone
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
