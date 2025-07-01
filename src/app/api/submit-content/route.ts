// 文件路径: src/app/api/submit-content/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { jwtVerify, errors } from 'jose'; // --- 新增导入 ---

// 定义请求体结构
interface SubmissionPayload {
    content: string;
    fileUrls: string[];
    userEmail: string;
    userName: string;
}

// --- 开始修改：添加JWT_SECRET环境变量检查 ---
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || !process.env.JWT_SECRET) {
    throw new Error('缺少必需的 Vercel KV 或 JWT 环境变量。');
}
// --- 结束修改 ---

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- 新增 ---
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: Request) {
    try {
        // --- 开始修改：添加JWT验证 ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: '未授权' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
        // --- 结束修改 ---

        const body = await req.json() as SubmissionPayload;
        const { content, fileUrls } = body;

        // --- 开始修改：从JWT中获取用户信息，而不是从请求体 ---
        const userEmail = jwtPayload.email as string;
        const userName = jwtPayload.username as string;

        if (!userEmail || !userName) {
            return NextResponse.json({ error: '提交失败: 无效的用户凭证。' }, { status: 401 });
        }
        // --- 结束修改 ---

        const submissionId = uuidv4();
        const submissionKey = `customer-feedback:${userEmail}:${submissionId}`; // 修正键名以匹配my-data API
        
        const dataToStore = {
            userName,
            userEmail,
            content,
            fileUrls,
            submittedAt: new Date().toISOString(),
        };

        await kv.set(submissionKey, JSON.stringify(dataToStore));

        return NextResponse.json({ 
            message: "提交成功！感谢您的反馈。", 
            submissionId: submissionId 
        });

    } catch (error: unknown) {
        console.error("内容提交到 Redis 时出错:", error);
        // --- 开始修改：改进错误处理 ---
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ error: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `提交失败: ${errorMessage}` }, { status: 500 });
        // --- 结束修改 ---
    }
}