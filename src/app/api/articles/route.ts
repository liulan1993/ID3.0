import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：从 Markdown 中解析需要的信息
const parseMarkdown = (content: string) => {
    const titleMatch = content.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '无标题';
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    return { title, imageUrl };
};

// GET: 获取所有文章
export async function GET() {
    try {
        const articleKeys = await kv.keys('article:*');
        if (articleKeys.length === 0) {
            return NextResponse.json([]);
        }
        const articles = await kv.mget(...articleKeys);
        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error fetching articles:", error);
        return NextResponse.json({ message: "获取文章失败" }, { status: 500 });
    }
}

// POST: 创建一篇新文章
export async function POST(req: NextRequest) {
    try {
        const { markdownContent, authorEmail } = await req.json();

        if (!markdownContent || !authorEmail) {
            return NextResponse.json({ message: "缺少必要参数: markdownContent 或 authorEmail" }, { status: 400 });
        }

        const { title, imageUrl } = parseMarkdown(markdownContent);
        const articleId = `article_${Date.now()}`;
        const createdAt = new Date().toISOString();

        const newArticle = {
            id: articleId,
            title,
            markdownContent,
            coverImageUrl: imageUrl,
            authorEmail,
            createdAt
        };

        await kv.set(`article:${articleId}`, JSON.stringify(newArticle));

        return NextResponse.json(newArticle, { status: 201 });

    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json({ message: "创建文章失败" }, { status: 500 });
    }
}
