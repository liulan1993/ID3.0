// 文件路径: src/app/api/my-data/route.ts

import { createClient } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 检查环境变量
if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN || !process.env.JWT_SECRET || !process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('缺少必需的 Vercel KV、Blob 或 JWT 环境变量。');
}

const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// 辅助函数：扫描并获取指定模式的键
async function getKeysByPattern(pattern: string): Promise<string[]> {
    let cursor = '0';
    const allKeys: string[] = [];
    do {
        const [nextCursor, keys] = await kv.scan(cursor, { match: pattern });
        allKeys.push(...keys);
        cursor = nextCursor;
    } while (cursor !== '0');
    return allKeys;
}

// 辅助函数：递归查找文件URL
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

/**
 * GET handler to fetch all data for the authenticated user.
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

        const [submissionKeys, questionnaireKeys, feedbackKeys] = await Promise.all([
            getKeysByPattern(`user_submissions:${userEmail}:*`),
            getKeysByPattern(`user_questionnaires:${userEmail}:*`),
            getKeysByPattern(`customer-feedback:${userEmail}:*`),
        ]);

        const allKeys = [...submissionKeys, ...questionnaireKeys, ...feedbackKeys];

        if (allKeys.length === 0) {
            return NextResponse.json({ submissions: [], questionnaires: [], feedback: [] });
        }

        const allData = await kv.mget(...allKeys);

        const result = {
            submissions: [] as unknown[],
            questionnaires: [] as unknown[],
            feedback: [] as unknown[],
        };

        allData.forEach((data, index) => {
            if (data) {
                const key = allKeys[index];
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                const item = { key, ...parsedData };

                if (key.startsWith('user_submissions:')) {
                    result.submissions.push(item);
                } else if (key.startsWith('user_questionnaires:')) {
                    result.questionnaires.push(item);
                } else if (key.startsWith('customer-feedback:')) {
                    result.feedback.push(item);
                }
            }
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Token验证或数据获取失败:", error);
        return NextResponse.json({ error: '未授权或服务器错误' }, { status: 401 });
    }
}

/**
 * DELETE handler to remove a specific item for the authenticated user.
 */
export async function DELETE(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { keyToDelete } = await req.json();

    if (!keyToDelete || typeof keyToDelete !== 'string') {
        return NextResponse.json({ error: '必须提供要删除的键' }, { status: 400 });
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userEmail = payload.email as string;

        // 安全检查: 确保用户只能删除自己的数据
        if (!keyToDelete.includes(userEmail)) {
            return NextResponse.json({ error: '禁止操作' }, { status: 403 });
        }

        const itemData = await kv.get(keyToDelete);

        if (itemData) {
            const parsedData = typeof itemData === 'string' ? JSON.parse(itemData) : itemData;
            let fileUrls: string[] = [];

            if (keyToDelete.startsWith('user_submissions:')) {
                fileUrls = findFileUrls(parsedData.formData);
            } else if (keyToDelete.startsWith('customer-feedback:')) {
                fileUrls = parsedData.fileUrls || [];
            }
            
            // 从 Blob 删除关联文件
            if (fileUrls.length > 0) {
                await del(fileUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
        }

        // 从 KV 删除记录
        await kv.del(keyToDelete);

        return NextResponse.json({ message: '删除成功' });

    } catch (error) {
        console.error("删除失败:", error);
        return NextResponse.json({ error: '删除操作失败' }, { status: 500 });
    }
}
