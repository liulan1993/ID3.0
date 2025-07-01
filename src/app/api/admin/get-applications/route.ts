// 文件路径: src/app/api/admin/get-applications/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'a-very-strong-secret-key-that-is-at-least-32-bytes-long'
);

interface AdminJwtPayload extends JWTPayload {
    permission: 'full' | 'readonly';
}

// Helper to verify admin token
async function verifyAdmin(request: NextRequest): Promise<{ payload?: AdminJwtPayload; error?: string; status?: number }> {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: '未授权', status: 401 };
    }
    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await jwtVerify(token, secret);
        const decodedPayload = payload as AdminJwtPayload;
        if (decodedPayload.permission !== 'full' && decodedPayload.permission !== 'readonly') {
             return { error: '非管理员凭证', status: 403 };
        }
        return { payload: decodedPayload };
    } catch {
        return { error: '无效的凭证', status: 401 };
    }
}

// GET method for admin to fetch all submissions
export async function GET(request: NextRequest) {
    const verification = await verifyAdmin(request);
    if (verification.error || !verification.payload) {
        return NextResponse.json({ error: verification.error || '验证失败' }, { status: verification.status || 401 });
    }

    try {
        const keys = await kv.keys('submission:*');
        if (keys.length === 0) {
            return NextResponse.json([], { status: 200 });
        }
        const submissions = await kv.mget(...keys);
        
        const parsedSubmissions = submissions.map(sub => {
            if (!sub) return null;
            if (typeof sub === 'string') {
                try {
                    return JSON.parse(sub);
                } catch {
                    return null; 
                }
            }
            return sub; 
        }).filter(Boolean);

        return NextResponse.json(parsedSubmissions, { status: 200 });
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        return NextResponse.json({ error: '获取用户资料失败' }, { status: 500 });
    }
}

// DELETE method for admin to delete submissions
export async function DELETE(request: NextRequest) {
    const verification = await verifyAdmin(request);
    // 修复: 增加对 payload 的存在性检查
    if (verification.error || !verification.payload) {
        return NextResponse.json({ error: verification.error || '验证失败' }, { status: verification.status || 401 });
    }
    
    if (verification.payload.permission !== 'full') {
        return NextResponse.json({ error: '权限不足' }, { status: 403 });
    }

    try {
        const { keys } = await request.json();
        if (!keys || !Array.isArray(keys) || keys.length === 0) {
            return NextResponse.json({ error: '未提供要删除的键' }, { status: 400 });
        }
        await kv.del(...keys);
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Error deleting submissions:', error);
        return NextResponse.json({ error: '删除失败' }, { status: 500 });
    }
}
