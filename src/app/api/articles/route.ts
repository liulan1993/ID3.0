// 文件路径: src/app/api/articles/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：从 Markdown 中解析标题和第一张图片作为备用封面
const parseMarkdown = (content: string) => {
    const titleMatch = content.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '无标题';
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    return { title, imageUrl };
};

// GET: 获取所有文章 (无改动)
export async function GET() {
    try {
        const articleKeys = await kv.keys('article:*');
        if (articleKeys.length === 0) return NextResponse.json([]);
        const articles = await kv.mget(...articleKeys);
        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error fetching articles:", error);
        return NextResponse.json({ message: "获取文章失败" }, { status: 500 });
    }
}

// POST: 创建一篇新文章 (已整合封面图逻辑)
export async function POST(req: NextRequest) {
    try {
        const { markdownContent, authorEmail, coverImageUrl } = await req.json(); // 接收从前端传来的 coverImageUrl
        if (!markdownContent || !authorEmail) {
            return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
        }

        const { title, imageUrl: parsedImageUrl } = parseMarkdown(markdownContent);
        
        // 关键逻辑：优先使用用户上传的封面图(coverImageUrl)，如果没有，再自动从文章内容里找第一张图(parsedImageUrl)
        const finalCoverImageUrl = coverImageUrl || parsedImageUrl;

        const uniqueId = crypto.randomUUID();
        const articleKey = `article:${uniqueId}`;
        const newArticle = {
            id: uniqueId,
            title,
            markdownContent,
            coverImageUrl: finalCoverImageUrl, // 保存最终的封面图URL
            authorEmail,
            createdAt: new Date().toISOString()
        };

        await kv.set(articleKey, JSON.stringify(newArticle));
        return NextResponse.json(newArticle, { status: 201 });

    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json({ message: "创建文章失败" }, { status: 500 });
    }
}

// PUT: 更新一篇文章 (已整合封面图逻辑)
export async function PUT(req: NextRequest) {
    try {
        const { id, markdownContent, authorEmail, coverImageUrl } = await req.json(); // 接收新的 coverImageUrl
        if (!id || !markdownContent || !authorEmail) {
            return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
        }

        const articleKey = `article:${id}`;
        const existingArticleRaw = await kv.get(articleKey);
        if (!existingArticleRaw) {
            return NextResponse.json({ message: "文章不存在" }, { status: 404 });
        }
        
        const existingArticle = typeof existingArticleRaw === 'string' ? JSON.parse(existingArticleRaw) : existingArticleRaw;
        const { title, imageUrl: parsedImageUrl } = parseMarkdown(markdownContent);

        // 关键逻辑：优先使用用户上传的新封面图
        const finalCoverImageUrl = coverImageUrl || parsedImageUrl;

        const updatedArticle = {
            ...existingArticle,
            title,
            markdownContent,
            authorEmail,
            coverImageUrl: finalCoverImageUrl, // 更新封面图URL
            updatedAt: new Date().toISOString()
        };

        await kv.set(articleKey, JSON.stringify(updatedArticle));
        return NextResponse.json(updatedArticle, { status: 200 });

    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ message: "更新文章失败" }, { status: 500 });
    }
}

// DELETE: 删除一篇文章 (无改动)
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ message: "缺少文章ID" }, { status: 400 });
        
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
