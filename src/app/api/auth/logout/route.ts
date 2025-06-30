// 文件路径: src/app/api/auth/logout/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // 重定向到登录页面
    const redirectUrl = new URL('/admin/login', request.url);
    const response = NextResponse.redirect(redirectUrl);

    // 在响应中清除 cookie
    response.cookies.delete('auth_token');

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ message: '服务器内部错误' }, { status: 500 });
  }
}
