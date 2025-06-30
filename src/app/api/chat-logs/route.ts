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
            if (typeof log === 'string') {
                try {
                    const parsedLog = JSON.parse(log);
                    // 将数据库的 key 附加到对象上，以便前端可以识别并用于删除
                    parsedLog.key = chatLogKeys[index]; 
                    return parsedLog;
                } catch (e) {
                    console.error("Failed to parse chat log:", log, e);
                    return null;
                }
            }
            return log;
        }).filter(Boolean); // 过滤掉解析失败的 null 值

        return NextResponse.json(chatLogs);
    } catch (error) {
        console.error("Error fetching chat logs:", error);
        return NextResponse.json({ message: "获取聊天记录失败" }, { status: 500 });
    }
}

// DELETE: 删除一个或多个聊天记录
export async function DELETE(req: NextRequest) {
    try {
        const { keys } = await req.json(); // keys 是一个包含要删除的数据库key的数组
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ message: "缺少要删除的记录 key" }, { status: 400 });
        }

        const result = await kv.del(...keys);

        if (result === 0) {
            return NextResponse.json({ message: "记录不存在或已被删除" }, { status: 404 });
        }

        return NextResponse.json({ message: `成功删除了 ${result} 条记录` }, { status: 200 });
    } catch (error) {
        console.error("Error deleting chat logs:", error);
        return NextResponse.json({ message: "删除聊天记录失败" }, { status: 500 });
    }
}
