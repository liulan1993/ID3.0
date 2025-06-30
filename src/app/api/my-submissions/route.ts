// 文件路径: src/app/api/my-submissions/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || !process.env.JWT_SECRET) {
    throw new Error('缺少必需的 Vercel KV 或 JWT 环境变量。');
}

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * GET handler to fetch submissions for the authenticated user.
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userEmail = payload.email as string;

        if (!userEmail) {
            return NextResponse.json({ error: '无效的令牌' }, { status: 401 });
        }

        let cursor = '0';
        const allKeys: string[] = [];
        do {
            const [nextCursor, keys] = await kv.scan(cursor, { match: `user_submissions:${userEmail}:*` });
            allKeys.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');

        if (allKeys.length === 0) {
            return NextResponse.json([]);
        }

        const submissionsData = await kv.mget(...allKeys);
        
        const submissions = submissionsData.map((data, index) => {
            if (data) {
                const submission = typeof data === 'string' ? JSON.parse(data) : data;
                return {
                    key: allKeys[index],
                    ...submission,
                };
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json(submissions);

    } catch (error) {
        console.error("Token验证或数据获取失败:", error);
        return NextResponse.json({ error: '未授权或服务器错误' }, { status: 401 });
    }
}
