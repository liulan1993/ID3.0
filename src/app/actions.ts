/*
 * 文件: src/app/actions.ts
 * 描述: 服务器动作文件，已集成 SendGrid 和验证逻辑。
 */
'use server';

import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';

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

interface RegistrationInfo {
  name: string;
  email: string;
  phone?: string;
  password: string;
  graphicalCaptchaAnswer: string;
  graphicalCaptchaInput: string;
  emailVerificationCode: string;
}

interface UserCredentials {
  email: string;
  password: string;
}

// --- 原有函数 ---
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


// --- 邮件发送函数 ---
export async function sendVerificationEmail(email: string) {
  // 从环境变量中获取 SendGrid 配置
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  // 检查环境变量是否都已配置
  if (!apiKey || !fromEmail) {
    console.error('SendGrid API Key 或发件人邮箱 (SENDGRID_FROM_EMAIL) 未配置。');
    return { success: false, message: '邮件服务暂时不可用。' };
  }
  sgMail.setApiKey(apiKey);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationKey = `verification:${email}`;

  try {
    // 将验证码存入 KV，有效期10分钟
    await kv.set(verificationKey, code, { ex: 600 }); 

    const msg = {
      to: email,
      from: fromEmail, // 使用环境变量作为发件人
      subject: '您的验证码 - Apex',
      text: `您的 Apex 网站验证码是: ${code}。该验证码将在10分钟后失效。`,
      html: `<strong>您的 Apex 网站验证码是: ${code}</strong>。该验证码将在10分钟后失效。`,
    };

    await sgMail.send(msg);

    console.log(`验证码邮件已发送至: ${email}`);
    return { success: true };

  } catch (error) {
    console.error("发送验证邮件时出错:", error);
    return { success: false, message: '发送验证码失败，请稍后再试。' };
  }
}


// --- 注册函数 ---
export async function registerUser(userInfo: RegistrationInfo) {
  try {
    const { 
      email, password, name, phone, 
      graphicalCaptchaAnswer, graphicalCaptchaInput, emailVerificationCode 
    } = userInfo;
    
    // 验证图形验证码
    if (graphicalCaptchaAnswer.toLowerCase() !== graphicalCaptchaInput.toLowerCase()) {
      throw new Error('图形验证码不正确。');
    }

    // 验证邮箱验证码
    const verificationKey = `verification:${email}`;
    const storedCode = await kv.get<string>(verificationKey);
    if (!storedCode) {
      throw new Error('邮箱验证码已过期，请重新发送。');
    }
    if (storedCode !== emailVerificationCode) {
      throw new Error('邮箱验证码不正确。');
    }

    // 检查用户是否已存在
    const userKey = `user:${email}`;
    const existingUser = await kv.get(userKey);
    if (existingUser) {
      throw new Error('该邮箱地址已被注册。');
    }

    // 创建用户
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
    await kv.del(verificationKey); // 删除已用过的验证码

    console.log(`新用户已成功注册并验证: ${email}`);
    return { success: true };

  } catch (error) {
    console.error("注册用户时出错:", error);
    return { success: false, message: error instanceof Error ? error.message : '一个未知错误发生了' };
  }
}

// --- 登录函数 ---
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
