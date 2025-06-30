// 文件路径: src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 创建一个成功的响应
    const response = NextResponse.json({ message: '登出成功' }, { status: 200 });

    // 在响应中清除 cookie
    response.cookies.set('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: new Date(0), // 设置为过去的时间使其立即过期
    });

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
