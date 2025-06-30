// 文件路径: middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

export async function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 如果访问的是登录页，直接放行
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // 如果没有 token，重定向到登录页
  if (!authToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  try {
    // 验证 token
    await jwtVerify(authToken, secret);
    // Token 有效，放行
    return NextResponse.next();
  } catch (err) {
    // Token 无效，重定向到登录页
    console.error('JWT Verification Error:', err);
    // 清除无效的cookie
    const response = NextResponse.redirect(new URL('/admin/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

// 配置中间件要匹配的路径
export const config = {
  matcher: '/admin/:path*', // 保护所有 /admin 下的路径
};
