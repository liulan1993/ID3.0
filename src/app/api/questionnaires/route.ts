// 文件路径: src/app/api/questionnaires/route.ts

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('缺少必需的 Vercel KV REST API 环境变量。');
}

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

/**
 * GET handler to fetch all questionnaire submissions.
 * It scans for all keys matching 'user_questionnaires:*',
 * retrieves them, and returns them as a JSON array.
 */
export async function GET() {
    try {
        // 使用 scan 代替 keys 来处理大量数据
        let cursor = '0'; // Bug Fix: cursor should be a string and initialized to '0'
        const allKeys: string[] = [];
        do {
            // The scan command returns the next cursor as a string.
            const [nextCursor, keys] = await kv.scan(cursor, { match: 'user_questionnaires:*' });
            allKeys.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0'); // The loop continues until the cursor returned is '0'

        if (allKeys.length === 0) {
            return NextResponse.json([]);
        }

        // 使用 mget 批量获取数据
        const submissionsData = await kv.mget(...allKeys);
        
        // 将 key 和数据结合起来
        const submissions = submissionsData.map((data, index) => {
            // kv.mget can return null for keys that don't exist, so we handle that.
            if (data) {
                const submission = typeof data === 'string' ? JSON.parse(data) : data;
                return {
                    key: allKeys[index],
                    ...submission,
                };
            }
            return null;
        }).filter(Boolean); // Filter out any null results

        return NextResponse.json(submissions);
    } catch (error: unknown) {
        console.error("从 Redis 获取问卷数据时出错:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `获取失败: ${errorMessage}` }, { status: 500 });
    }
}

/**
 * DELETE handler to remove specified questionnaire submissions.
 * It expects an array of keys in the request body.
 */
export async function DELETE(req: Request) {
    try {
        const { keys } = await req.json();

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '删除失败: 未提供有效的键。' }, { status: 400 });
        }

        // 使用 del 删除一个或多个键
        await kv.del(...keys);

        return NextResponse.json({ message: '删除成功！' });
    } catch (error: unknown) {
        console.error("从 Redis 删除问卷数据时出错:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `删除失败: ${errorMessage}` }, { status: 500 });
    }
}
