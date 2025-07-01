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

    // --- 开始修改：兼容普通用户和管理员登录 ---
    // 假设普通用户使用邮箱登录，管理员使用用户名
    const isEmail = username.includes('@');
    const userKey = isEmail ? `user_email:${username}` : `user:${username}`;
    const user = await kv.get(userKey);
    // --- 结束修改 ---

    if (!user || typeof user !== 'object') {
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }

    // --- 开始修改：统一用户数据结构 ---
    const userData = user as { 
        passwordHash: string; 
        permission?: 'full' | 'readonly'; // 管理员有
        name?: string; // 普通用户有
        email?: string; // 普通用户有
    };
    // --- 结束修改 ---
    
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (passwordMatch) {
      const expirationTime = '24h';
      
      // --- 开始修改：统一JWT载荷 ---
      const payload = { 
        username: isEmail ? userData.name : username, // JWT中统一使用name
        email: isEmail ? userData.email : `${username}@admin.local`, // 赋予管理员一个虚拟邮箱
        permission: userData.permission || 'user' // 普通用户赋予'user'权限
      };
      // --- 结束修改 ---

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secret);

      // --- 开始修改：在JSON响应中返回所有需要的信息，包括token ---
      const responsePayload = {
          success: true,
          username: payload.username,
          email: payload.email,
          permission: payload.permission,
          token: token // 将Token添加到JSON响应中
      };
      
      const response = NextResponse.json(responsePayload, { status: 200 });
      // --- 结束修改 ---

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24小时
      });

      return response;
    } else {
      return NextResponse.json({ message: '账号或密码错误' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
