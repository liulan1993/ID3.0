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

// 为申请记录定义一个明确的类型，以避免使用 'any'
interface ApplicationRecord {
    submittedAt: string;
    // 允许其他任何字段存在
    [key: string]: unknown;
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
    } catch {
      // 修复：移除未使用的错误变量 'e'
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
    
    // 过滤并进行类型断言，以进行安全的排序
    const typedSubmissions = submissions.filter(s => s) as ApplicationRecord[];

    const latestSubmission = typedSubmissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];

    return NextResponse.json({ submission: latestSubmission }, { status: 200 });

  } catch (e) {
    console.error('Get My Application Status API error:', e);
    const errorMessage = e instanceof Error ? e.message : '服务器内部错误';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
