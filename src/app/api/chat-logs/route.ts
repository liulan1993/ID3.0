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
            // 使用 Record<string, unknown> 代替 any 来确保类型安全
            let logObject: Record<string, unknown> | null = null;

            if (typeof log === 'string') {
                try {
                    // 将解析后的对象断言为通用记录类型
                    logObject = JSON.parse(log) as Record<string, unknown>;
                } catch (e) {
                    console.error("Failed to parse chat log:", log, e);
                    return null;
                }
            } else if (log && typeof log === 'object') {
                // 将已有的对象断言为通用记录类型
                logObject = log as Record<string, unknown>;
            }

            if (logObject) {
                logObject.key = key; // 附加 key
                return logObject;
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

        const deletedCount = await kv.del(...keys);

        return NextResponse.json({ message: `成功删除了 ${deletedCount} 条记录` }, { status: 200 });
    } catch (error) {
        console.error("Error deleting chat logs:", error);
        return NextResponse.json({ message: "删除聊天记录失败" }, { status: 500 });
    }
}
