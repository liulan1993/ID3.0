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

// 为申请记录定义一个明确的类型
interface ApplicationRecord {
    submittedAt: string;
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
      return NextResponse.json({ message: '无效的凭证' }, { status: 401 });
    }

    const userEmail = decodedToken.email;

    // 2. 查找该用户的所有申请
    const submissionKeys = await kv.keys(`submission:${userEmail}:*`);
    if (submissionKeys.length === 0) {
      // 如果没有申请，返回一个带空数组的响应
      return NextResponse.json({ submissions: [] }, { status: 200 });
    }

    // 3. 获取所有申请记录
    const submissions = await kv.mget(...submissionKeys);
    
    const typedSubmissions = submissions.filter(s => s) as ApplicationRecord[];

    // 修复：按时间倒序排序所有申请，而不仅仅是返回最新的一个
    const sortedSubmissions = typedSubmissions
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    // 修复：在 'submissions' 键中返回包含所有申请的数组
    return NextResponse.json({ submissions: sortedSubmissions }, { status: 200 });

  } catch (e) {
    console.error('Get My Application Status API error:', e);
    const errorMessage = e instanceof Error ? e.message : '服务器内部错误';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
