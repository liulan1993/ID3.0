// 文件路径: src/app/api/articles/route.ts

import { kv } from '@vercel/kv';
import { del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, errors } from 'jose'; // --- 新增导入 ---

// --- 新增：JWT 密钥和验证函数 ---
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyAdminToken(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
        throw new errors.JOSEError('未提供管理员凭证');
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // 确保是管理员（有 permission 字段）
    if (!payload.permission) {
        throw new errors.JOSEError('无效的管理员凭证');
    }
    return payload as { username: string; permission: 'full' | 'readonly' };
}
// --- 结束新增 ---

// 辅助函数：从 Markdown 中解析标题和第一张图片作为备用封面
const parseMarkdown = (content: string) => {
    const titleMatch = content.match(/^#\s+(.*)/m);
    const title = titleMatch ? titleMatch[1] : '无标题';
    const imageMatch = content.match(/!\[.*?\]\((.*?)\)/);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    return { title, imageUrl };
};

// GET: 获取所有文章 (已添加安全验证)
export async function GET(req: NextRequest) {
    try {
        await verifyAdminToken(req); // --- 新增：验证管理员身份 ---
        const articleKeys = await kv.keys('article:*');
        if (articleKeys.length === 0) return NextResponse.json([]);
        const articles = await kv.mget(...articleKeys);
        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error fetching articles:", error);
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ message: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ message: "获取文章失败" }, { status: 500 });
    }
}

// POST: 创建一篇新文章 (已添加安全验证)
export async function POST(req: NextRequest) {
    try {
        const payload = await verifyAdminToken(req); // --- 新增：验证管理员身份 ---
        if (payload.permission === 'readonly') {
            return NextResponse.json({ message: "只读权限，禁止创建文章" }, { status: 403 });
        }

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
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ message: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ message: "创建文章失败" }, { status: 500 });
    }
}

// PUT: 更新一篇文章 (已添加安全验证)
export async function PUT(req: NextRequest) {
    try {
        const payload = await verifyAdminToken(req); // --- 新增：验证管理员身份 ---
        if (payload.permission === 'readonly') {
            return NextResponse.json({ message: "只读权限，禁止更新文章" }, { status: 403 });
        }

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
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ message: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ message: "更新文章失败" }, { status: 500 });
    }
}

// DELETE: 删除一篇文章及其关联图片 (已添加安全验证)
export async function DELETE(req: NextRequest) {
    try {
        const payload = await verifyAdminToken(req); // --- 新增：验证管理员身份 ---
        if (payload.permission === 'readonly') {
            return NextResponse.json({ message: "只读权限，禁止删除文章" }, { status: 403 });
        }

        const { id } = await req.json();
        if (!id) return NextResponse.json({ message: "缺少文章ID" }, { status: 400 });
        
        const articleKey = `article:${id}`;
        
        const articleRaw = await kv.get(articleKey);
        if (!articleRaw) {
            return NextResponse.json({ message: "文章不存在或已被删除" }, { status: 404 });
        }
        const article = typeof articleRaw === 'string' ? JSON.parse(articleRaw) : articleRaw;

        const urlsToDelete: string[] = [];
        if (article.coverImageUrl) {
            urlsToDelete.push(article.coverImageUrl);
        }
        const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
        let match;
        while ((match = markdownImageRegex.exec(article.markdownContent)) !== null) {
            if (match[1]) {
                urlsToDelete.push(match[1]);
            }
        }

        const uniqueUrls = [...new Set(urlsToDelete)];
        if (uniqueUrls.length > 0) {
            await del(uniqueUrls, { token: process.env.BLOB_READ_WRITE_TOKEN });
        }

        await kv.del(articleKey);
        
        return NextResponse.json({ message: "文章及关联图片删除成功" }, { status: 200 });

    } catch (error) {
        console.error("Error deleting article:", error);
        if (error instanceof errors.JOSEError) {
            return NextResponse.json({ message: `身份验证失败: ${error.code}` }, { status: 401 });
        }
        return NextResponse.json({ message: "删除文章失败" }, { status: 500 });
    }
}
