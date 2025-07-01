// 文件路径: src/app/api/my-application-status/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

interface UserJwtPayload extends JWTPayload {
  email: string;
}

export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    let decodedToken: UserJwtPayload;
    try {
      const { payload } = await jwtVerify(token, secret);
      decodedToken = payload as UserJwtPayload;
    } catch (error) {
      return NextResponse.json({ message: '无效的凭证' }, { status: 401 });
    }

    const userEmail = decodedToken.email;

    // 2. 查找该用户的所有申请
    const submissionKeys = await kv.keys(`submission:${userEmail}:*`);
    if (submissionKeys.length === 0) {
      return NextResponse.json({ submission: null }, { status: 200 });
    }

    // 3. 找到最新的申请
    const submissions = await kv.mget(...submissionKeys);
    const latestSubmission = submissions
      .filter(s => s) // 过滤掉可能存在的 null 值
      .sort((a, b) => new Date((b as any).submittedAt).getTime() - new Date((a as any).submittedAt).getTime())[0];

    return NextResponse.json({ submission: latestSubmission }, { status: 200 });

  } catch (error) {
    console.error('Get My Application Status API error:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
