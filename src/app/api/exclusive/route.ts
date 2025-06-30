import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// 定义从客户端接收的数据结构
interface RequestBody {
    userEmail: string;
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
    options: {
        model: string;
        enableWebSearch?: boolean;
        enableDeepSearch?: boolean;
        enableMarkdownOutput?: boolean;
        fileContent?: string;
    };
}

// 主处理函数
export async function POST(req: NextRequest) {
    try {
        const { userEmail, messages, options }: RequestBody = await req.json();

        // 1. 输入验证
        if (!userEmail || !messages || messages.length === 0) {
            return new Response(JSON.stringify({ error: '无效的请求参数: 缺少 userEmail 或 messages。' }), { status: 400 });
        }
        
        const userMessage = messages[messages.length - 1];
        if (userMessage.role !== 'user') {
            return new Response(JSON.stringify({ error: '无效的请求: 最后一则消息必须来自用户。' }), { status: 400 });
        }

        let finalUserContent = userMessage.content;
        if (options.fileContent) {
            finalUserContent += `\n\n--- 附带文件内容 ---\n${options.fileContent}`;
        }
        
        const messagesForAI = [...messages.slice(0, -1), { role: 'user', content: finalUserContent }];

        // 2. 调用外部 AI 服务
        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

        if (!DEEPSEEK_API_KEY) {
            throw new Error("DeepSeek API key is not configured on the server.");
        }

        const apiPayload = {
            model: options.model,
            messages: messagesForAI,
            stream: true,
        };
        
        const apiResponse = await fetch(DEEPSEEK_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
            body: JSON.stringify(apiPayload),
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`DeepSeek API request failed with status ${apiResponse.status}: ${errorBody}`);
        }
        
        if (!apiResponse.body) {
             throw new Error("The AI service did not return a readable stream.");
        }

        // 3. 创建一个新的可读流来转换和转发数据
        const customStream = new ReadableStream({
            async start(controller) {
                const reader = apiResponse.body!.getReader();
                
                // 在流开始时，立即保存用户问题
                try {
                    const questionRecord = { user: userEmail, timestamp: new Date().toISOString(), model: options.model, question: finalUserContent };
                    const key = `chat:${userEmail}:${questionRecord.timestamp}`;
                    await kv.set(key, JSON.stringify(questionRecord));
                    console.log(`Question from ${userEmail} saved to KV with key: ${key}`);
                } catch (kvError) {
                    console.error("Failed to save question to Vercel KV:", kvError);
                }

                // 循环读取和转发数据
                async function push() {
                    const { done, value } = await reader.read();
                    if (done) {
                        controller.close();
                        return;
                    }
                    // 将收到的数据块直接转发给客户端
                    controller.enqueue(value);
                    push();
                }
                push();
            }
        });

        return new Response(customStream, {
            headers: { 
                'Content-Type': 'text/event-stream; charset=utf-8', 
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('[API /api/exclusive Error]:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
