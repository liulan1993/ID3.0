// 文件路径: src/app/api/my-data/route.ts

import { createClient } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { jwtVerify, errors } from 'jose';

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
        return NextResponse.json({ error: '未提供授权凭证' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null') {
        return NextResponse.json({ error: '提供的令牌无效' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userEmail = payload.email as string;

        if (!userEmail) {
            return NextResponse.json({ error: '令牌中不包含有效的用户信息' }, { status: 401 });
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
                try {
                    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                    const item = { key, ...parsedData };

                    if (key.startsWith('user_submissions:')) {
                        result.submissions.push(item);
                    } else if (key.startsWith('user_questionnaires:')) {
                        result.questionnaires.push(item);
                    } else if (key.startsWith('customer-feedback:')) {
                        result.feedback.push(item);
                    }
                } catch (e) {
                    console.error(`解析数据失败，键: ${key}`, data, e);
                }
            }
        });

        return NextResponse.json(result);

    // --- 开始修改 ---
    } catch (error) {
        console.error("Token验证或数据获取失败:", error);
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ error: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ error: '未授权或服务器内部错误' }, { status: 500 });
    }
    // --- 结束修改 ---
}

/**
 * DELETE handler to remove a specific item for the authenticated user.
 */
export async function DELETE(req: Request) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: '未提供授权凭证' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null') {
        return NextResponse.json({ error: '提供的令牌无效' }, { status: 401 });
    }
    
    const { keyToDelete } = await req.json();

    if (!keyToDelete || typeof keyToDelete !== 'string') {
        return NextResponse.json({ error: '必须提供要删除的键' }, { status: 400 });
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userEmail = payload.email as string;

        if (!keyToDelete.includes(userEmail)) {
            return NextResponse.json({ error: '禁止操作：无权删除此资源' }, { status: 403 });
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
            
            if (fileUrls.length > 0) {
                await del(fileUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
        }

        await kv.del(keyToDelete);

        return NextResponse.json({ message: '删除成功' });

    // --- 开始修改 ---
    } catch (error) {
        console.error("删除失败:", error);
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ error: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ error: '删除操作时发生服务器内部错误' }, { status: 500 });
    }
    // --- 结束修改 ---
}
