// 文件路径: src/app/api/articles/route.ts

import { kv } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：从 Markdown 中解析标题和第一张图片作为备用封面
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
        if (articleKeys.length === 0) return NextResponse.json([]);
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
        const { markdownContent, authorEmail, coverImageUrl } = await req.json();
        if (!markdownContent || !authorEmail) {
            return NextResponse.json({ message: "缺少必要参数" }, { status: 400 });
        }

        const { title, imageUrl: parsedImageUrl } = parseMarkdown(markdownContent);
        const finalCoverImageUrl = coverImageUrl || parsedImageUrl;

        const uniqueId = crypto.randomUUID();
        const articleKey = `article:${uniqueId}`;
        const newArticle = {
            id: uniqueId,
            title,
            markdownContent,
            coverImageUrl: finalCoverImageUrl,
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

// PUT: 更新一篇文章
export async function PUT(req: NextRequest) {
    try {
        const { id, markdownContent, authorEmail, coverImageUrl } = await req.json();
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
        const finalCoverImageUrl = coverImageUrl || parsedImageUrl;

        const updatedArticle = {
            ...existingArticle,
            title,
            markdownContent,
            authorEmail,
            coverImageUrl: finalCoverImageUrl,
            updatedAt: new Date().toISOString()
        };

        await kv.set(articleKey, JSON.stringify(updatedArticle));
        return NextResponse.json(updatedArticle, { status: 200 });

    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ message: "更新文章失败" }, { status: 500 });
    }
}

// DELETE: 删除一篇文章及其关联图片
export async function DELETE(req: NextRequest) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ message: "缺少文章ID" }, { status: 400 });
        
        const articleKey = `article:${id}`;
        
        // 1. 从 KV 获取文章数据
        const articleRaw = await kv.get(articleKey);
        if (!articleRaw) {
            return NextResponse.json({ message: "文章不存在或已被删除" }, { status: 404 });
        }
        const article = typeof articleRaw === 'string' ? JSON.parse(articleRaw) : articleRaw;

        // 2. 收集所有需要删除的图片 URL
        const urlsToDelete: string[] = [];
        // 添加封面图
        if (article.coverImageUrl) {
            urlsToDelete.push(article.coverImageUrl);
        }
        // 从 Markdown 内容中提取所有图片 URL
        const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = markdownImageRegex.exec(article.markdownContent)) !== null) {
            if (match[1]) {
                urlsToDelete.push(match[1]);
            }
        }

        // 3. 从 Vercel Blob 中删除图片 (去重后)
        const uniqueUrls = [...new Set(urlsToDelete)];
        if (uniqueUrls.length > 0) {
            await del(uniqueUrls);
        }

        // 4. 从 KV 中删除文章记录
        await kv.del(articleKey);
        
        return NextResponse.json({ message: "文章及关联图片删除成功" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ message: "删除文章失败" }, { status: 500 });
    }
}
