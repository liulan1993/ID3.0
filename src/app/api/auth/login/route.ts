// 文件路径: src/app/api/auth/login/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcrypt';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

// [FIX] 定义用户数据类型以取代 'any'，并确保属性与数据库一致
interface UserData {
  hashedPassword: string; // 修正属性名以匹配数据库中的 'hashedPassword'
  name: string;
  email: string;
  permission?: 'full' | 'readonly'; // 管理员权限
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '账号和密码不能为空' }, { status: 400 });
    }

    // [FIX] 使用定义好的 UserData 类型，不再使用 'any'
    let user: UserData | null = null;
    const isEmail = username.includes('@');
    const isPhone = /^\d{11}$/.test(username);

    if (isEmail) {
      const userKey = `user_email:${username}`;
      user = await kv.get<UserData>(userKey);
    } else if (isPhone) {
      const phoneIndexKey = `user_phone:${username}`;
      const userEmail = await kv.get<string>(phoneIndexKey);

      if (userEmail) {
        const userKey = `user_email:${userEmail}`;
        user = await kv.get<UserData>(userKey);
      }
    } else {
      // 默认为管理员用户名登录
      const userKey = `user:${username}`;
      user = await kv.get<UserData>(userKey);
    }

    if (!user) {
      return NextResponse.json({ message: '该用户不存在。' }, { status: 401 });
    }
    
    // [FIX] 'user' 已经有正确的类型，无需再进行类型断言。
    // 同时使用正确的属性名 'hashedPassword'。
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
