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
    let userKey: string | null = null;
    
    const isEmail = /\S+@\S+\.\S+/.test(username);

    if (isEmail) {
      userKey = `user:${username}`;
      // 直接获取，后续逻辑会处理格式
      const rawData = await kv.get(userKey);
      if (typeof rawData === 'string') {
          user = JSON.parse(rawData) as UserData;
      } else if (rawData && typeof rawData === 'object') {
          user = rawData as UserData;
      }

    } else { // isPhone
      const phone = username;
      const phoneIndexKey = `user_phone:${phone}`;
      const userEmail = await kv.get<string>(phoneIndexKey);

      if (userEmail) {
        userKey = `user:${userEmail}`;
        const rawData = await kv.get(userKey);
        if (typeof rawData === 'string') {
            user = JSON.parse(rawData) as UserData;
        } else if (rawData && typeof rawData === 'object') {
            user = rawData as UserData;
        }
      } else {
        console.warn(`Phone index not found for ${phone}. Falling back to a full scan.`);
        let cursor = 0;
        do {
          const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*' });
          for (const key of keys) {
            // [最终修复] 恢复并加固了对 STRING 和 JSON 两种格式的处理逻辑
            const rawData = await kv.get(key);
            let potentialUser: UserData | null = null;

            if (typeof rawData === 'string') {
              try {
                potentialUser = JSON.parse(rawData) as UserData;
              } catch {
                continue; // 如果字符串无法解析，则跳过
              }
            } else if (rawData && typeof rawData === 'object') {
              potentialUser = rawData as UserData;
            }
            
            if (potentialUser && potentialUser.phone && String(potentialUser.phone).trim() === String(phone).trim()) {
              user = potentialUser;
              userKey = key;
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
      // 机会性地创建缺失的索引
      if (!isEmail && user.phone) {
          const phoneIndexKey = `user_phone:${user.phone}`;
          const existingIndex = await kv.get(phoneIndexKey);
          if (!existingIndex) {
              console.log(`Creating missing phone index for ${user.phone}`);
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