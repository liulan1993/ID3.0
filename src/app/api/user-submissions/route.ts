// 文件路径: src/app/api/user-submissions/route.ts

import { createClient } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('缺少必需的 Vercel KV 或 Blob 环境变量。');
}

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// 递归函数，用于从表单数据中查找所有文件URL
function findFileUrls(data: unknown): string[] {
    let urls: string[] = [];
    if (Array.isArray(data)) {
        for (const item of data) {
            urls = urls.concat(findFileUrls(item));
        }
    } else if (typeof data === 'object' && data !== null) {
        // Type guard to check for 'url' property
        if ('url' in data && typeof (data as {url: unknown}).url === 'string') {
            urls.push((data as {url: string}).url);
        } else {
            for (const key in data) {
                 if (Object.prototype.hasOwnProperty.call(data, key)) {
                    urls = urls.concat(findFileUrls((data as Record<string, unknown>)[key]));
                 }
            }
        }
    }
    return urls;
}

/**
 * GET handler to fetch all user submissions.
 */
export async function GET() {
    try {
        let cursor = '0';
        const allKeys: string[] = [];
        do {
            const [nextCursor, keys] = await kv.scan(cursor, { match: 'user_submissions:*' });
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
    } catch (error: unknown) {
        console.error("从 Redis 获取用户资料时出错:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `获取失败: ${errorMessage}` }, { status: 500 });
    }
}

/**
 * DELETE handler to remove specified submissions from KV and associated files from Blob storage.
 */
export async function DELETE(req: Request) {
    try {
        const { keys } = await req.json();

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '删除失败: 未提供有效的键。' }, { status: 400 });
        }

        const submissionsToDelete = await kv.mget(...keys);
        const allFileUrls: string[] = [];

        for (const submissionData of submissionsToDelete) {
            if (submissionData) {
                const submission = typeof submissionData === 'string' ? JSON.parse(submissionData) : submissionData;
                if (submission.formData) {
                    const fileUrls = findFileUrls(submission.formData);
                    allFileUrls.push(...fileUrls);
                }
            }
        }

        // 从 Vercel Blob 删除文件
        if (allFileUrls.length > 0) {
            await del(allFileUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }

        // 从 Vercel KV 删除记录
        await kv.del(...keys);

        return NextResponse.json({ message: '删除成功！' });
    } catch (error: unknown) {
        console.error("删除用户资料时出错:", error);
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `删除失败: ${errorMessage}` }, { status: 500 });
    }
}
