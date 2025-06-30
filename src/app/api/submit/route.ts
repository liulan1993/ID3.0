// src/app/api/submit/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// **修改**: 更新请求体结构，加入用户邮箱
interface SubmissionPayload {
    id: string;
    userEmail: string; // 新增字段
    services: string[];
    formData: Record<string, unknown>;
}

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const body = await req.json() as SubmissionPayload;

        // **新增**: 验证请求体中是否包含用户邮箱
        if (!body.userEmail) {
            return NextResponse.json({ error: '提交失败: 缺少用户信息。' }, { status: 401 });
        }

        // **修改**: 使用新的、包含用户邮箱的 Key 结构
        const submissionKey = `user_submissions:${body.userEmail}:${body.id}`;
        
        const dataToStore = {
            services: body.services,
            formData: body.formData,
            submittedAt: new Date().toISOString(),
        };

        await kv.set(submissionKey, JSON.stringify(dataToStore));

        return NextResponse.json({ message: "Success", submissionId: body.id, user: body.userEmail });

    } catch (error: unknown) {
        console.error("Redis 提交错误:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}
