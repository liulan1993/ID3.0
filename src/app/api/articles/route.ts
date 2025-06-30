// 文件路径: src/app/api/articles/route.ts

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
            return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
        }

        const { title, imageUrl } = parseMarkdown(markdownContent);
        
        // (关键修正) 使用 crypto.randomUUID() 生成唯一ID
        const uniqueId = crypto.randomUUID();
        const articleId = `article_${uniqueId}`;
        const createdAt = new Date().toISOString();

        const newArticle = {
            id: uniqueId, // 直接使用UUID作为文章的唯一标识
            title,
            markdownContent,
            coverImageUrl: imageUrl,
            authorEmail,
            createdAt
        };

        // 使用生成的唯一文章ID作为key
        await kv.set(articleId, JSON.stringify(newArticle));
        return NextResponse.json(newArticle, { status: 201 });

    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json({ message: "创建文章失败" }, { status: 500 });
    }
}

// PUT: 更新一篇文章
export async function PUT(req: NextRequest) {
    try {
        const { id, markdownContent, authorEmail } = await req.json();
        if (!id || !markdownContent || !authorEmail) {
            return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
        }
        
        // (关键修正) 直接使用文章ID构造key
        const articleKey = `article:${id}`;
        const existingArticleRaw = await kv.get(articleKey);
        if (!existingArticleRaw) {
            return NextResponse.json({ message: "文章不存在" }, { status: 404 });
        }
        
        const existingArticle = typeof existingArticleRaw === 'string' ? JSON.parse(existingArticleRaw) : existingArticleRaw;
        const { title, imageUrl } = parseMarkdown(markdownContent);

        const updatedArticle = {
            ...existingArticle,
            title,
            markdownContent,
            coverImageUrl: imageUrl,
            authorEmail,
            updatedAt: new Date().toISOString()
        };

        await kv.set(articleKey, JSON.stringify(updatedArticle));
        return NextResponse.json(updatedArticle, { status: 200 });

    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ message: "更新文章失败" }, { status: 500 });
    }
}

// DELETE: 删除一篇文章
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ message: "缺少文章ID" }, { status: 400 });
        }

        // (关键修正) 直接使用文章ID构造key
        const articleKey = `article:${id}`;
        const result = await kv.del(articleKey);

        if (result === 0) {
            return NextResponse.json({ message: "文章不存在或已被删除" }, { status: 404 });
        }

        return NextResponse.json({ message: "文章删除成功" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ message: "删除文章失败" }, { status: 500 });
    }
}
