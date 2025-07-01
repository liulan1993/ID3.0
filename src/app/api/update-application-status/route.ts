// 文件路径: src/app/api/update-application-status/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

interface AdminJwtPayload extends JWTPayload {
  username: string;
  permission: 'full' | 'readonly';
}

export async function POST(request: NextRequest) {
  try {
    // 1. 验证管理员权限
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: '未授权' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    try {
      const { payload } = await jwtVerify(token, secret);
      const decodedToken = payload as AdminJwtPayload;
      if (decodedToken.permission !== 'full') {
        return NextResponse.json({ message: '权限不足' }, { status: 403 });
      }
    } catch (e) {
      // 修复：捕获错误但不在控制台打印，以避免 'e' 未被使用的 lint 错误
      return NextResponse.json({ message: '无效的凭证' }, { status: 401 });
    }

    // 2. 解析请求体
    const { key, status } = await request.json();
    if (!key || !status) {
      return NextResponse.json({ message: '缺少申请ID或状态' }, { status: 400 });
    }

    // 3. 获取并更新记录
    const existingSubmission = await kv.get(key);
    if (!existingSubmission) {
      return NextResponse.json({ message: '找不到该申请记录' }, { status: 404 });
    }

    const updatedSubmission = {
      ...existingSubmission as object,
      status: status,
    };

    await kv.set(key, JSON.stringify(updatedSubmission));

    return NextResponse.json({ success: true, updatedSubmission }, { status: 200 });

  } catch (e) {
    // 修复：使用捕获到的错误变量 'e'
    console.error('Update Application Status API error:', e);
    const errorMessage = e instanceof Error ? e.message : '服务器内部错误';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
