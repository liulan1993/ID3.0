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
    const { email: username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '请求参数不完整' }, { status: 400 });
    }

    let user: UserData | null = null;
    let userKey: string | null = null; // 用于存储找到的用户的主键
    
    const isEmail = /\S+@\S+\.\S+/.test(username);

    if (isEmail) {
      userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
    } else { // isPhone
      const phone = username;
      const phoneIndexKey = `user_phone:${phone}`;
      const userEmail = await kv.get<string>(phoneIndexKey);

      if (userEmail) {
        // 方案A: 通过索引快速找到用户
        userKey = `user:${userEmail}`;
        user = await kv.get<UserData>(userKey);
      } else {
        // 方案B: 索引不存在，执行全库扫描 (Fallback)
        console.warn(`Phone index not found for ${phone}. Falling back to a full scan.`);
        let cursor = 0;
        do {
          const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*' });
          for (const key of keys) {
            const potentialUser = await kv.get<UserData>(key);
            
            if (potentialUser?.phone && String(potentialUser.phone).trim() === String(phone).trim()) {
              user = potentialUser;
              userKey = key; // 记录下找到的用户的主键
              break;
            }
          }
          cursor = Number(nextCursor);
        } while (cursor !== 0 && !user);
      }
    }

    if (!user || !userKey) { // 检查 user 和 userKey 是否都存在
      return NextResponse.json({ message: '该用户不存在。' }, { status: 401 });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (passwordMatch) {
      // [最终修复] 机会性地创建缺失的索引
      // 如果是手机登录，并且是通过慢速扫描找到的用户，则为其创建索引以加速未来登录。
      if (!isEmail) {
          const phoneIndexKey = `user_phone:${username}`;
          const existingIndex = await kv.get(phoneIndexKey);
          if (!existingIndex) {
              console.log(`Creating missing phone index for ${username}`);
              await kv.set(phoneIndexKey, user.email);
          }
      }

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