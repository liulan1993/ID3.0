import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 定义请求体结构
interface Answer {
    qId: string;
    question: string;
    answer: string | string[];
}

interface SubmissionPayload {
    userName: string;
    userEmail: string;
    answers: Answer[];
}

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const body = await req.json() as SubmissionPayload;
        const { userName, userEmail, answers } = body;

        // 验证用户信息
        if (!userEmail || !userName) {
            return NextResponse.json({ error: '提交失败: 缺少用户信息。' }, { status: 401 });
        }

        // 生成唯一的提交ID
        const submissionId = uuidv4();

        // 构造存储在 KV 中的键
        const submissionKey = `user_questionnaires:${userEmail}:${submissionId}`;
        
        // 构造要存储的数据对象
        const dataToStore = {
            userName,
            userEmail,
            submittedAt: new Date().toISOString(),
            answers,
        };

        // 将数据存储到 Redis
        await kv.set(submissionKey, JSON.stringify(dataToStore));

        // 返回成功响应
        return NextResponse.json({ 
            message: "问卷提交成功！", 
            submissionId: submissionId 
        });

    } catch (error: unknown) {
        console.error("问卷提交到 Redis 时出错:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
    }
}
