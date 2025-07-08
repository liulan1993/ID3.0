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
      // 修正了用户键名以匹配数据库结构 (user:email)
      const userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
    } else if (isPhone) {
      // 增加后备扫描机制以支持无索引的手机号登录
      // 优先尝试高效的索引查找
      const phoneIndexKey = `user_phone:${username}`;
      const userIdentifier = await kv.get<string>(phoneIndexKey);

      if (userIdentifier) {
        const userKey = `user:${userIdentifier}`;
        user = await kv.get<UserData>(userKey);
      } else {
        // 后备方案：扫描所有用户键。警告：此操作在大量用户时效率低下。
        console.warn(`Phone index not found for ${username}. Falling back to a full scan. Consider adding phone-to-email indexes during registration.`);
        let cursor = 0;
        do {
          const [nextCursor, keys] = await kv.scan(cursor, { match: 'user:*' });
          for (const key of keys) {
            const potentialUser = await kv.get<UserData>(key);
            // 确保 potentialUser 是一个包含 phone 属性的对象
            if (potentialUser && typeof potentialUser === 'object' && 'phone' in potentialUser && potentialUser.phone === username) {
              user = potentialUser;
              break; // 找到用户，跳出内层循环
            }
          }
          // [FIX] 将 nextCursor 转换为数字类型以解决类型不匹配的错误
          cursor = Number(nextCursor);
        } while (cursor !== 0 && !user); // 如果找到了用户或扫描完成，则停止
      }
    } else {
      // 处理管理员或其他非邮箱/手机号的用户名
      const userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
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
        maxAge: 60 * 60 * 24, // 24 小时
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
