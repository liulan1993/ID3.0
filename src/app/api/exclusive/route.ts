import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';

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

// 模拟外部 AI API 调用并返回流
async function callDeepSeekAPI(body: object) {
    // 警告: 此处为模拟代码。在生产环境中，您应使用 'node-fetch' 或其他 HTTP 客户端库。
    // 您需要将 'YOUR_DEEPSEEK_API_KEY' 替换为您真实有效的 API 密钥，并确保它已配置在 Vercel 的环境变量中。
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

    if (!DEEPSEEK_API_KEY) {
        throw new Error("DeepSeek API key is not configured on the server.");
    }

    const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(body),
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        console.error("DeepSeek API Error:", errorBody);
        throw new Error(`DeepSeek API request failed with status ${response.status}: ${errorBody}`);
    }

    return response.body; // 返回可读流
}


// 主处理函数，处理 POST 请求
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

        // (可选) 如果有文件内容, 将其附加到用户消息中
        let finalUserContent = userMessage.content;
        if (options.fileContent) {
            finalUserContent += `\n\n--- 附带文件内容 ---\n${options.fileContent}`;
        }
        
        const messagesForAI = [
             ...messages.slice(0, -1),
             { role: 'user', content: finalUserContent }
        ];

        // 2. 调用外部 AI 服务
        const apiPayload = {
            model: options.model,
            messages: messagesForAI,
            stream: true, // 必须为流式输出
            // 根据需要传递其他参数, 例如 max_tokens, temperature 等
        };
        const stream = await callDeepSeekAPI(apiPayload);

        // 3. 将 AI 服务的流式响应转发给客户端
        const transformStream = new TransformStream({
            transform(chunk, controller) {
                // 直接将 AI 的响应数据块传递给客户端
                controller.enqueue(chunk);
            },
            async flush(controller) {
                // 流结束时, 执行保存用户问题的操作
                try {
                    // 创建只包含用户问题的记录
                    const questionRecord = {
                        user: userEmail,
                        timestamp: new Date().toISOString(),
                        model: options.model,
                        question: finalUserContent, // 只保存最终的用户问题内容
                    };
                    
                    // 使用 user-email 和 timestamp 创建一个唯一的 key
                    const key = `chat:${userEmail}:${questionRecord.timestamp}`;
                    
                    // 将问题记录保存到 Vercel KV
                    await kv.set(key, JSON.stringify(questionRecord));
                    console.log(`Question from ${userEmail} saved to KV with key: ${key}`);

                } catch (kvError) {
                    console.error("Failed to save question to Vercel KV:", kvError);
                    // 注意: 此处的错误不会发送给客户端，因为它发生在流结束之后
                }
                controller.terminate();
            }
        });

        if (!stream) {
             throw new Error("The AI service did not return a readable stream.");
        }

        return new Response(stream.pipeThrough(transformStream), {
            headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
        });

    } catch (error) {
        console.error('[API /api/exclusive Error]:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
    }
}
