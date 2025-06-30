// 文件路径: src/app/api/users/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10; // 密码哈希计算强度

// 定义用户类型
interface User {
  username: string;
  passwordHash: string;
  permission: 'full' | 'readonly';
}

// GET: 获取所有用户列表（不含密码）
export async function GET() {
  try {
    const userKeys = await kv.keys('user:*');
    if (userKeys.length === 0) {
      return NextResponse.json([]);
    }
    const usersRaw = await kv.mget(...userKeys);
    const users = usersRaw.map(user => {
      if (user && typeof user === 'object') {
        const { passwordHash, ...userWithoutPassword } = user as User;
        return userWithoutPassword;
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: '获取用户列表失败' }, { status: 500 });
  }
}

// POST: 创建一个新用户
export async function POST(req: NextRequest) {
  try {
    const { username, password, permission } = await req.json();
    if (!username || !password || !permission) {
      return NextResponse.json({ message: '缺少用户名、密码或权限' }, { status: 400 });
    }
    if (permission !== 'full' && permission !== 'readonly') {
      return NextResponse.json({ message: '无效的权限类型' }, { status: 400 });
    }

    const userKey = `user:${username}`;
    const existingUser = await kv.get(userKey);
    if (existingUser) {
      return NextResponse.json({ message: '用户名已存在' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser: User = { username, passwordHash, permission };

    await kv.set(userKey, newUser);

    const { passwordHash: _, ...userToReturn } = newUser;
    return NextResponse.json(userToReturn, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: '创建用户失败' }, { status: 500 });
  }
}

// DELETE: 删除一个用户
export async function DELETE(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ message: '缺少用户名' }, { status: 400 });
    }

    // 防止删除最后一个 full 权限用户
    if (username === 'admin') { // 假设 'admin' 是默认的超级管理员
        const allUsers = await kv.keys('user:*');
        const fullPermissionUsers = [];
        for (const key of allUsers) {
            const user = await kv.get(key) as User;
            if (user.permission === 'full') {
                fullPermissionUsers.push(user);
            }
        }
        if (fullPermissionUsers.length <= 1 && fullPermissionUsers[0].username === username) {
            return NextResponse.json({ message: '不能删除最后一个拥有完全权限的管理员' }, { status: 403 });
        }
    }

    const userKey = `user:${username}`;
    const result = await kv.del(userKey);

    if (result === 0) {
      return NextResponse.json({ message: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '用户删除成功' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: '删除用户失败' }, { status: 500 });
  }
}