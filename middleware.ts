// 文件路径: middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保护 /admin 路径下的页面，但排除 /api 路由
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
    const token = request.cookies.get('auth_token')?.value;
    const loginUrl = new URL('/admin', request.url); // 重定向到登录页

    if (!token) {
      return NextResponse.redirect(loginUrl);
    }

    try {
      // 验证 token 是否有效
      await jwtVerify(token, secret);
      // Token 有效，允许访问
      return NextResponse.next();
    } catch (error) {
      // Token 无效或过期，重定向到登录页
      console.log('Token verification failed:', error);
      const response = NextResponse.redirect(loginUrl);
      // 清除无效的 cookie
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // 对于其他所有路径，不进行任何操作
  return NextResponse.next();
}

// 指定中间件需要匹配的路径
export const config = {
  matcher: '/admin/:path*',
};