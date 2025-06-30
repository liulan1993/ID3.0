// 文件路径: src/app/api/customer-feedback/route.ts

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

// 获取所有客户反馈
export async function GET() {
    try {
        const keys: string[] = []; // 修复：为 keys 数组明确指定 string[] 类型
        // 使用 scanIterator 遍历所有匹配的键
        for await (const key of kv.scanIterator({ match: 'user_content_submissions:*' })) {
            keys.push(key);
        }

        if (keys.length === 0) {
            return NextResponse.json([]);
        }

        // 使用 mget 批量获取所有键的值
        const submissionsData = await kv.mget(...keys);
        
        const submissions = submissionsData.map((data, index) => {
            if (typeof data === 'string') {
                try {
                    const parsedData = JSON.parse(data);
                    return {
                        key: keys[index], // 将数据库的 key 也返回给前端
                        ...parsedData
                    };
                } catch (e) {
                    console.error(`解析失败，key: ${keys[index]}`, e);
                    return null;
                }
            }
            return data; // 直接返回非字符串类型的数据
        }).filter(Boolean); // 过滤掉解析失败的 null 值

        return NextResponse.json(submissions);

    } catch (error) {
        console.error("获取客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}

// 删除指定的客户反馈
export async function DELETE(request: Request) {
    try {
        const { keys } = await request.json();

        if (!Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '缺少要删除的键' }, { status: 400 });
        }

        // 使用 del 批量删除
        await kv.del(...keys);

        return NextResponse.json({ message: '删除成功' });

    } catch (error) {
        console.error("删除客户反馈时出错:", error);
        return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
    }
}
