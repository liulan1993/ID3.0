// 文件路径: src/app/api/customer-feedback/route.ts

import { createClient } from '@vercel/kv';
import { del } from '@vercel/blob';
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

// 定义客户反馈的数据结构
interface CustomerSubmission {
    key: string;
    userName: string;
    userEmail: string;
    content: string;
    fileUrls: string[];
    submittedAt: string;
}

// 获取所有客户反馈
export async function GET() {
    try {
        const keys: string[] = [];
        // --- 开始修改 ---
        // 修复了KV扫描的key，确保与提交时使用的key前缀一致
        for await (const key of kv.scanIterator({ match: 'user_customer_submissions:*' })) {
        // --- 结束修改 ---
            keys.push(key);
        }

        if (keys.length === 0) {
            return NextResponse.json([]);
        }

        const submissionsData = await kv.mget(...keys);
        
        const uniqueSubmissions = new Map<string, CustomerSubmission>();
        
        submissionsData.forEach((data, index) => {
            const key = keys[index];
            if (uniqueSubmissions.has(key)) {
                console.warn(`发现重复的 key，已忽略: ${key}`);
                return;
            }

            let submissionData: Omit<CustomerSubmission, 'key'>;
            if (typeof data === 'string') {
                try {
                    submissionData = JSON.parse(data);
                } catch (e) {
                    console.error(`解析失败，key: ${key}`, e);
                    return;
                }
            } else if (data && typeof data === 'object') {
                submissionData = data as Omit<CustomerSubmission, 'key'>;
            } else {
                return;
            }
            
            const fullSubmission: CustomerSubmission = { key, ...submissionData };
            uniqueSubmissions.set(key, fullSubmission);
        });

        const submissions = Array.from(uniqueSubmissions.values());

        return NextResponse.json(submissions);

    } catch (error) {
        console.error("获取客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}

// 删除指定的客户反馈及其关联图片
export async function DELETE(request: NextRequest) {
    try {
        const { keys } = await request.json();

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '缺少要删除的键' }, { status: 400 });
        }

        // 1. 从 KV 获取所有待删除的反馈数据
        const submissionsRaw = await kv.mget(...keys);

        // 2. 收集所有需要删除的图片 URL
        const urlsToDelete: string[] = [];
        submissionsRaw.forEach(subRaw => {
            if (subRaw) {
                const submission = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;
                if (submission.fileUrls && Array.isArray(submission.fileUrls)) {
                    urlsToDelete.push(...submission.fileUrls);
                }
            }
        });

        // 3. 从 Vercel Blob 中删除图片 (去重后)
        const uniqueUrls = [...new Set(urlsToDelete)];
        if (uniqueUrls.length > 0) {
            await del(uniqueUrls);
        }

        // 4. 从 KV 中删除反馈记录
        const deletedCount = await kv.del(...keys);

        if (deletedCount > 0) {
            return NextResponse.json({ message: `成功删除了 ${deletedCount} 条反馈及其关联图片。` });
        } else {
            return NextResponse.json({ error: '未找到要删除的反馈，或已被删除。' }, { status: 404 });
        }

    } catch (error) {
        console.error("删除客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
