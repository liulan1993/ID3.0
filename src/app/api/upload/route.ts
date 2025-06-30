// src/app/api/upload/route.ts

import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { customAlphabet } from 'nanoid';

// 使用一个自定义的字符集来生成随机ID
const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  10
);

export const runtime = 'edge';

export async function POST(request: Request): Promise<NextResponse> {
  // 检查 Blob 存储的 token
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "配置错误：缺少 BLOB_READ_WRITE_TOKEN 环境变量。" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  
  // **确认**: 从 URL 参数获取用户邮箱
  const userEmail = searchParams.get('userEmail');

  if (!filename) {
    return NextResponse.json({ error: '必须提供文件名。' }, { status: 400 });
  }

  // **确认**: 验证用户邮箱是否存在
  if (!userEmail) {
    return NextResponse.json({ error: '未提供用户信息，禁止上传。' }, { status: 401 });
  }
  
  if (!request.body) {
    return NextResponse.json({ message: '没有要上传的文件。' }, { status: 400 });
  }

  const randomPrefix = nanoid();
  // **确认**: 创建包含用户邮箱的唯一文件路径
  // 例如: uploads/user@example.com/randomId-original-filename.jpg
  const uniquePath = `uploads/${userEmail}/${randomPrefix}-${filename}`;

  try {
    const blob = await put(uniquePath, request.body, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("文件上传到 Blob 时出错:", error);
    const errorMessage = error instanceof Error ? error.message : "未知的上传错误。";
    return NextResponse.json(
      { error: `文件上传失败: ${errorMessage}` },
      { status: 500 }
    );
  }
}
