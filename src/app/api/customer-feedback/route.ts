// 文件路径: src/app/api/customer-feedback/route.ts

import { createClient } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// 获取所有客户反馈
export async function GET() {
    try {
        const keys: string[] = [];
        for await (const key of kv.scanIterator({ match: 'user_content_submissions:*' })) {
            keys.push(key);
        }

        if (keys.length === 0) {
            return NextResponse.json([]);
        }

        const submissionsData = await kv.mget(...keys);
        
        // BUG 3 修复：过滤掉 key 重复的数据，解决“勾选一个选中多个”的问题。
        const uniqueSubmissions = new Map<string, any>();
        submissionsData.forEach((data, index) => {
            const key = keys[index];
            if (uniqueSubmissions.has(key)) {
                console.warn(`发现重复的 key，已忽略: ${key}`);
                return;
            }

            let submission;
            if (typeof data === 'string') {
                try {
                    submission = JSON.parse(data);
                } catch (e) {
                    console.error(`解析失败，key: ${key}`, e);
                    return;
                }
            } else if (data && typeof data === 'object') {
                submission = data;
            } else {
                return;
            }
            
            uniqueSubmissions.set(key, { key, ...submission });
        });

        const submissions = Array.from(uniqueSubmissions.values());

        return NextResponse.json(submissions);

    } catch (error) {
        console.error("获取客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}

// 删除指定的客户反馈
export async function DELETE(request: NextRequest) {
    try {
        const { keys } = await request.json();

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '缺少要删除的键' }, { status: 400 });
        }

        // BUG 3 修复：使用 del 批量删除并获取删除的数量，提供更明确的反馈。
        const deletedCount = await kv.del(...keys);

        if (deletedCount > 0) {
            return NextResponse.json({ message: `成功删除了 ${deletedCount} 条反馈。` });
        } else {
            return NextResponse.json({ error: '未找到要删除的反馈，或已被删除。' }, { status: 404 });
        }

    } catch (error) {
        console.error("删除客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
