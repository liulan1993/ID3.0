/*
 * 文件: src/app/actions.ts
 * 描述: 这是您的服务器动作文件。
 * 它包含与数据库交互的逻辑，并且只在服务器上运行。
 */
'use server';

import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

// --- 类型定义 ---
interface ContactFormData {
  name: string;
  serviceArea: string;
  email: string;
  countryKey: string;
  phone: string;
  state: string;
}

interface FooterEmailData {
    email: string;
}

interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

interface UserCredentials {
  email: string;
  password: string;
}

// --- 函数 ---

export async function saveContactToRedis(formData: ContactFormData) {
  try {
    const key = `contact:${formData.name}:${formData.email}`; 
    if (!formData.name) {
      throw new Error("姓名不能为空，无法作为主键保存。");
    }
    await kv.set(key, JSON.stringify(formData));
    console.log(`联系资料已成功写入 Redis，Key 为: ${key}`);
    return { success: true };
  } catch (error) {
    console.error("写入联系资料到 Redis 时出错:", error);
    return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}

export async function saveFooterEmailToRedis(emailData: FooterEmailData) {
    try {
        const email = emailData.email;
        if(!email) {
            throw new Error("邮箱地址不能为空。");
        }
        const key = `subscription:${email}`;
        await kv.set(key, JSON.stringify({ email: email, subscribedAt: new Date().toISOString() }));
        console.log(`订阅邮箱已成功写入 Redis，Key 为: ${key}`);
        return { success: true };
    } catch (error) {
        console.error("写入订阅邮箱到 Redis 时出错:", error);
        return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
    }
}

export async function registerUser(userInfo: UserInfo) {
  try {
    const { email, password, name, phone } = userInfo;
    const userKey = `user:${email}`;

    const existingUser = await kv.get(userKey);
    if (existingUser) {
      throw new Error('该邮箱地址已被注册。');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      name,
      email,
      phone: phone || '',
      hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await kv.set(userKey, JSON.stringify(newUser));

    console.log(`新用户已成功注册: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("注册用户时出错:", error);
    return { success: false, message: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}

export async function loginUser(credentials: UserCredentials) {
  try {
    const { email, password } = credentials;
    const userKey = `user:${email}`;

    const storedUser = await kv.get(userKey) as { name: string; email: string; hashedPassword: string; } | null;

    if (!storedUser) {
      throw new Error('该用户不存在。');
    }

    const isPasswordValid = await bcrypt.compare(password, storedUser.hashedPassword);

    if (!isPasswordValid) {
      throw new Error('密码不正确。');
    }
    
    // 修正: 创建一个不包含哈希密码的新对象，以避免 'no-unused-vars' 错误
    const userToReturn = {
      name: storedUser.name,
      email: storedUser.email,
    };

    console.log(`用户登录成功: ${email}`);
    
    return { 
        success: true, 
        data: { 
            user: userToReturn, 
            token: 'mock-jwt-token-for-demo-purpose' 
        } 
    };

  } catch (error) {
    console.error("用户登录时出错:", error);
    return { success: false, message: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}
