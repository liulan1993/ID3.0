// 文件路径: src/app/api/user-submissions/route.ts

import { createClient } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { jwtVerify, errors } from 'jose'; // --- 新增导入 ---

// 检查环境变量
// --- 开始修改 ---
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || !process.env.BLOB_READ_WRITE_TOKEN || !process.env.JWT_SECRET) {
    throw new Error('缺少必需的 Vercel KV、Blob 或 JWT 环境变量。');
}
// --- 结束修改 ---

// 创建 KV 客户端
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- 新增 ---
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 递归函数，用于从表单数据中查找所有文件URL
function findFileUrls(data: unknown): string[] {
    let urls: string[] = [];
    if (Array.isArray(data)) {
        for (const item of data) {
            urls = urls.concat(findFileUrls(item));
        }
    } else if (typeof data === 'object' && data !== null) {
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

// --- 验证Token的辅助函数 ---
async function verifyToken(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('未提供授权凭证');
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        throw new Error('提供的令牌无效');
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
}


/**
 * GET handler to fetch all user submissions. (Now protected)
 */
export async function GET(req: Request) {
    try {
        // --- 开始修改：添加认证 ---
        await verifyToken(req);
        // --- 结束修改 ---

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
        // --- 开始修改：改进错误处理 ---
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ error: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `获取失败: ${errorMessage}` }, { status: 500 });
        // --- 结束修改 ---
    }
}

/**
 * DELETE handler to remove specified submissions from KV and associated files from Blob storage. (Now protected)
 */
export async function DELETE(req: Request) {
    try {
        // --- 开始修改：添加认证 ---
        await verifyToken(req);
        // --- 结束修改 ---

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

        if (allFileUrls.length > 0) {
            await del(allFileUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }

        await kv.del(...keys);

        return NextResponse.json({ message: '删除成功！' });
    } catch (error: unknown) {
        console.error("删除用户资料时出错:", error);
        // --- 开始修改：改进错误处理 ---
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ error: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        const errorMessage = error instanceof Error ? error.message : "发生未知错误。";
        return NextResponse.json({ error: `删除失败: ${errorMessage}` }, { status: 500 });
        // --- 结束修改 ---
    }
}
