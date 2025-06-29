/*
 * 文件: src/app/actions.ts
 * 描述: 这是您的服务器动作文件。
 * 它包含与数据库交互的逻辑，并且只在服务器上运行。
 */
'use server';

import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs'; // 用于安全地哈希密码

// --- 原有接口 ---
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

// --- 新增: 用户认证相关接口 ---
interface UserInfo {
  name: string;
  email: string;
  phone?: string;
  password: string; // 从表单接收的明文密码
}

interface UserCredentials {
  email: string;
  password: string;
}


// --- 原有函数 ---

/**
 * 将主联系表单的数据保存到 Redis。
 * @param formData - 包含用户联系信息的对象。
 * @returns 一个表示操作成功或失败的对象。
 */
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

/**
 * 将页脚订阅的邮箱地址保存到 Redis。
 * @param emailData - 包含用户邮箱的对象。
 * @returns 一个表示操作成功或失败的对象。
 */
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


// --- 新增: 用户认证函数 ---

/**
 * 注册新用户并将其安全地存储在 Vercel KV 中。
 * @param userInfo 包含用户注册信息的对象。
 * @returns 一个表示操作成功或失败的对象。
 */
export async function registerUser(userInfo: UserInfo) {
  try {
    const { email, password, name, phone } = userInfo;
    const userKey = `user:${email}`;

    // 步骤 1: 检查用户是否已存在
    const existingUser = await kv.get(userKey);
    if (existingUser) {
      throw new Error('该邮箱地址已被注册。');
    }

    // 步骤 2: 对密码进行哈希处理，增加安全性
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 步骤 3: 准备要存储的用户数据
    const newUser = {
      name,
      email,
      phone: phone || '',
      hashedPassword,
      createdAt: new Date().toISOString(),
    };

    // 步骤 4: 将新用户信息存入 Vercel KV
    await kv.set(userKey, JSON.stringify(newUser));

    console.log(`新用户已成功注册: ${email}`);
    return { success: true };
  } catch (error) {
    console.error("注册用户时出错:", error);
    return { success: false, message: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}

/**
 * 根据邮箱和密码验证用户身份。
 * @param credentials 包含用户登录凭据（邮箱和密码）的对象。
 * @returns 成功时返回用户信息，失败时返回错误信息。
 */
export async function loginUser(credentials: UserCredentials) {
  try {
    const { email, password } = credentials;
    const userKey = `user:${email}`;

    // 步骤 1: 从 Vercel KV 中获取用户信息
    const storedUser = await kv.get(userKey) as { name: string; email: string; hashedPassword: string; } | null;

    if (!storedUser) {
      throw new Error('该用户不存在。');
    }

    // 步骤 2: 验证提交的密码和存储的哈希密码是否匹配
    const isPasswordValid = await bcrypt.compare(password, storedUser.hashedPassword);

    if (!isPasswordValid) {
      throw new Error('密码不正确。');
    }
    
    // 步骤 3: 登录成功，准备返回给客户端的用户数据（不包含哈希密码）
    const { hashedPassword, ...userToReturn } = storedUser;

    console.log(`用户登录成功: ${email}`);
    
    // 在实际生产环境中，您会在这里生成一个JWT (JSON Web Token)
    // 为了简化，我们这里返回一个模拟的 token 和用户信息
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
