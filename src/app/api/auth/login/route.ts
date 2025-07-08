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
  phone?: string; // 确保 phone 属性在类型中
  permission?: 'full' | 'readonly';
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '账号和密码不能为空' }, { status: 400 });
    }

    let user: UserData | null = null;
    const isEmail = username.includes('@');
    const isPhone = /^\d{11}$/.test(username);

    if (isEmail) {
      const userKey = `user:${username}`;
      console.log(`Attempting to log in with email. Key: ${userKey}`);
      user = await kv.get<UserData>(userKey);
    } else if (isPhone) {
      const phoneIndexKey = `user_phone:${username}`;
      const userIdentifier = await kv.get<string>(phoneIndexKey);

      if (userIdentifier) {
        const userKey = `user:${userIdentifier}`;
        console.log(`Found phone index. Looking for user with key: ${userKey}`);
        user = await kv.get<UserData>(userKey);
      } else {
        // [DEBUG] 在此处加入详细的日志记录
        console.warn(`Phone index not found for ${username}. Falling back to a full scan. This can be slow.`);
        let cursor = 0;
        do {
          const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*' });
          console.log(`Scanning... Found keys: ${keys.join(', ')}`);
          for (const key of keys) {
            console.log(`--- Checking key: ${key} ---`);
            const rawData = await kv.get(key);
            console.log(`Raw data from KV for key ${key}:`, rawData);
            
            let potentialUser: UserData | null = null;

            if (typeof rawData === 'string') {
              try {
                potentialUser = JSON.parse(rawData) as UserData;
                console.log(`Successfully parsed string data for key ${key}:`, potentialUser);
              } catch {
                console.error(`Failed to parse JSON string for key ${key}. Skipping.`);
                continue;
              }
            } else if (rawData && typeof rawData === 'object') {
              potentialUser = rawData as UserData;
              console.log(`Data for key ${key} is already an object:`, potentialUser);
            }

            if (potentialUser) {
                console.log(`Comparing DB phone: "${potentialUser.phone}" (type: ${typeof potentialUser.phone}) with input username: "${username}" (type: ${typeof username})`);
                if (potentialUser.phone === username) {
                    console.log(`SUCCESS: Match found for key ${key}!`);
                    user = potentialUser;
                    break;
                }
            }
          }
          cursor = Number(nextCursor);
        } while (cursor !== 0 && !user);
      }
    } else {
      const userKey = `user:${username}`;
      console.log(`Attempting to log in with username. Key: ${userKey}`);
      user = await kv.get<UserData>(userKey);
    }

    if (!user) {
      console.error(`Login failed: User not found for identifier "${username}" after all checks.`);
      return NextResponse.json({ message: '该用户不存在。' }, { status: 401 });
    }
    
    console.log('User found, proceeding to password check:', user);
    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

    if (passwordMatch) {
      console.log('Password match successful. Generating token.');
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
        maxAge: 60 * 60 * 24, // 24 小时
      });

      return response;
    } else {
      console.error(`Login failed: Password mismatch for user: ${user.email}`);
      return NextResponse.json({ message: '密码错误。' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
