// 文件路径: src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

// 从环境变量中获取密钥，确保安全
// 您需要在 .env.local 和 Vercel 中设置 JWT_SECRET
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

// 从环境变量中安全地获取凭证列表
// 您需要在 Vercel 项目设置中添加 ADMIN_ACCOUNTS 环境变量
const adminAccountsJson = process.env.ADMIN_ACCOUNTS;

export async function POST(request: Request) {
  try {
    // 检查环境变量是否设置
    if (!adminAccountsJson) {
        console.error('管理员账户列表未在环境变量中设置 (ADMIN_ACCOUNTS)。');
        return NextResponse.json({ message: '服务器配置错误' }, { status: 500 });
    }

    let adminAccounts = [];
    try {
        adminAccounts = JSON.parse(adminAccountsJson);
        if (!Array.isArray(adminAccounts)) {
            throw new Error("ADMIN_ACCOUNTS 不是一个有效的JSON数组。");
        }
    } catch (e) {
        console.error('解析 ADMIN_ACCOUNTS 环境变量失败:', e);
        return NextResponse.json({ message: '服务器配置错误' }, { status: 500 });
    }

    const { username, password } = await request.json();

    // 在账户列表中查找匹配的用户
    const validUser = adminAccounts.find(
      (acc: { username?: string; password?: string }) => 
        acc.username === username && acc.password === password
    );


    // 验证账号和密码
    if (validUser) {
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
    console.error('Login API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
