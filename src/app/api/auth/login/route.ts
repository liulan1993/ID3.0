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
    // 请求体中的 'username' 现在可以是邮箱或手机号
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: '账号和密码不能为空' }, { status: 400 });
    }

    // [FIX START] 重构用户查找逻辑以支持邮箱、手机和管理员登录
    let user: any = null; // 使用 any 以便后续处理不同结构的用户对象
    const isEmail = username.includes('@');
    // 简单的正则表达式，用于判断 'username' 是否为手机号格式
    // 应与注册时的验证规则保持一致
    const isPhone = /^\d{11}$/.test(username);

    if (isEmail) {
      // 邮箱登录，直接查找用户
      const userKey = `user_email:${username}`;
      user = await kv.get(userKey);
    } else if (isPhone) {
      // 手机号登录，需要先通过手机号索引找到用户的主标识（如邮箱）
      // 预期的 KV 结构: key="user_phone:16670120287", value="plj453369670@gmail.com"
      const phoneIndexKey = `user_phone:${username}`;
      const userEmail = await kv.get<string>(phoneIndexKey);

      if (userEmail) {
        // 获得邮箱后，再查找完整的用户对象
        const userKey = `user_email:${userEmail}`;
        user = await kv.get(userKey);
      }
    } else {
      // 默认为管理员用户名登录
      const userKey = `user:${username}`;
      user = await kv.get(userKey);
    }
    // [FIX END]

    if (!user || typeof user !== 'object') {
      // 此错误现在可以正确地在邮箱/手机/用户名未找到时触发
      return NextResponse.json({ message: '该用户不存在。' }, { status: 401 });
    }
    
    // 统一用户数据结构
    const userData = user as { 
        passwordHash: string; 
        permission?: 'full' | 'readonly';
        name: string; // 假设所有用户（普通和管理员）都有 name
        email: string; // 假设所有用户都有 email
    };
    
    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (passwordMatch) {
      const expirationTime = '24h';
      
      // 统一 JWT 载荷
      const payload = { 
        username: userData.name, // 使用数据库中存储的 name
        email: userData.email,   // 使用数据库中存储的 email
        permission: userData.permission || 'user'
      };

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTime)
        .sign(secret);

      // [FIX START] 优化响应结构以匹配前端类型定义
      const responsePayload = {
          success: true,
          user: { // 将用户信息嵌套在 user 对象中
            name: payload.username,
            email: payload.email,
          },
          token: token
      };
      
      const response = NextResponse.json(responsePayload, { status: 200 });
      // [FIX END]

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
