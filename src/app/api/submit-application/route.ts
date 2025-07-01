// 文件路径: src/app/api/submit-application/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

// 从环境变量中获取JWT密钥
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

// --- 开始修复 ---
// 通过继承 jose 的 JWTPayload 类型来定义载荷，以解决类型转换问题
interface UserJwtPayload extends JWTPayload {
  username: string;
  email: string;
  permission: string;
}
// --- 结束修复 ---

export async function POST(request: NextRequest) {
  try {
    // 1. 验证用户身份 (JWT)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: '未授权的访问' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    let decodedToken: UserJwtPayload;
    try {
      // jwtVerify 返回的 payload 类型是 JWTPayload，现在可以安全地转换为 UserJwtPayload
      const { payload } = await jwtVerify(token, secret);
      decodedToken = payload as UserJwtPayload;
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return NextResponse.json({ message: '无效的凭证' }, { status: 401 });
    }

    // 2. 解析请求体
    const { service } = await request.json();
    if (!service) {
      return NextResponse.json({ message: '未提供服务类别' }, { status: 400 });
    }

    const { username, email } = decodedToken;

    // 3. 准备要存储的数据
    const submittedAt = new Date().toISOString();
    const key = `submission:${email}:${Date.now()}`;

    const newSubmission = {
      key,
      userName: username,
      userEmail: email,
      services: [service], // 存储为数组以匹配 UserSubmission 接口
      formData: {}, // 根据当前需求，表单数据为空对象
      submittedAt: submittedAt,
    };

    // 4. 将数据存入 Vercel KV
    await kv.set(key, JSON.stringify(newSubmission));

    // 5. 返回成功响应
    return NextResponse.json({ success: true, submission: newSubmission }, { status: 201 });

  } catch (error) {
    console.error('Submit Application API error:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器内部错误';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
