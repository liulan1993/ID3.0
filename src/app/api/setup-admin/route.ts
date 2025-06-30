// 文件路径: src/app/api/setup-admin/route.ts

import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function GET() {
  try {
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // 这是一个临时密码，请登录后立即修改或创建新账户
    const adminKey = `user:${adminUsername}`;

    // 检查管理员是否已存在
    const existingAdmin = await kv.get(adminKey);
    if (existingAdmin) {
      return NextResponse.json({ message: '管理员账户已存在，无需重复设置。' }, { status: 200 });
    }

    // 创建新的管理员账户
    const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    const adminUser = {
      username: adminUsername,
      passwordHash: passwordHash,
      permission: 'full', // 给予完全权限
    };

    await kv.set(adminKey, adminUser);

    return NextResponse.json({ message: `成功创建管理员账户 '${adminUsername}'。请使用此账户登录。` }, { status: 201 });

  } catch (error) {
    console.error('Error setting up admin user:', error);
    return NextResponse.json({ message: '设置管理员时发生错误' }, { status: 500 });
  }
}