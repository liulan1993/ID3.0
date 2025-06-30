// 文件路径: src/app/api/chat-logs/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// GET: 获取所有聊天记录
export async function GET() {
    try {
        const chatLogKeys = await kv.keys('chat:*');
        if (chatLogKeys.length === 0) {
            return NextResponse.json([]);
        }
        const chatLogsRaw = await kv.mget(...chatLogKeys);

        // 解析数据，并为每一条记录添加一个唯一的 key 字段
        const chatLogs = chatLogsRaw.map((log, index) => {
            const key = chatLogKeys[index];
            if (typeof log === 'string') {
                try {
                    const parsedLog = JSON.parse(log);
                    parsedLog.key = key; 
                    return parsedLog;
                } catch (e) {
                    console.error("Failed to parse chat log:", log, e);
                    return null;
                }
            }
            if (log && typeof log === 'object') {
                (log as any).key = key;
                return log;
            }
            return null;
        }).filter(Boolean);

        return NextResponse.json(chatLogs);
    } catch (error) {
        console.error("Error fetching chat logs:", error);
        return NextResponse.json({ message: "获取聊天记录失败" }, { status: 500 });
    }
}

// DELETE: 删除一个或多个聊天记录
export async function DELETE(req: NextRequest) {
    try {
        const { keys } = await req.json();
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ message: "缺少要删除的记录 key" }, { status: 400 });
        }

        // BUG 2 修复：直接执行删除操作，并返回删除的数量。
        // 如果 kv.del 抛出异常，将被外层 try...catch 捕获。
        const deletedCount = await kv.del(...keys);

        return NextResponse.json({ message: `成功删除了 ${deletedCount} 条记录` }, { status: 200 });
    } catch (error) {
        console.error("Error deleting chat logs:", error);
        return NextResponse.json({ message: "删除聊天记录失败" }, { status: 500 });
    }
}
