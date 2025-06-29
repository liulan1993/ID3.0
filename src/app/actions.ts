/*
 * 文件: src/app/actions.ts
 * 描述: 服务器动作文件，已修正验证逻辑并增加详细日志。
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
  password:string;
}

// --- 原有函数 ---
export async function saveContactToRedis(formData: ContactFormData) {
  try {
    const key = `contact:${formData.name}:${formData.email}`; 
    if (!formData.name) {
      throw new Error("姓名不能为空，无法作为主键保存。");
    }
    await kv.set(key, JSON.stringify(formData));
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
        return { success: true };
    } catch (error) {
        console.error("写入订阅邮箱到 Redis 时出错:", error);
        return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
    }
}


// --- 邮件发送函数 ---
export async function sendVerificationEmail(email: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.error('SendGrid API Key 或发件人邮箱 (SENDGRID_FROM_EMAIL) 未配置。');
    return { success: false, message: '邮件服务暂时不可用。' };
  }
  sgMail.setApiKey(apiKey);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const normalizedEmail = email.trim().toLowerCase();
  const verificationKey = `verification:${normalizedEmail}`;

  try {
    // 关键：设置一个稍长的有效期（例如15分钟），以应对可能的延迟
    await kv.set(verificationKey, code, { ex: 900 }); 

    const msg = {
      to: email,
      from: fromEmail,
      subject: '您的验证码 - Apex',
      text: `您的 Apex 网站验证码是: ${code}。该验证码将在15分钟后失效。`,
      html: `<strong>您的 Apex 网站验证码是: ${code}</strong>。该验证码将在15分钟后失效。`,
    };

    await sgMail.send(msg);
    console.log(`[调试] 验证码已存入 Key: ${verificationKey}，值为: ${code}`);
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
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // 修正第一点: 首先验证图形验证码
    if (graphicalCaptchaAnswer.toLowerCase() !== graphicalCaptchaInput.toLowerCase()) {
      console.log(`[调试] 图形验证码失败。正确答案: "${graphicalCaptchaAnswer}", 用户输入: "${graphicalCaptchaInput}"`);
      throw new Error('图形验证码不正确。');
    }

    // 修正第二点: 在验证邮箱码之前添加更详细的日志
    const verificationKey = `verification:${normalizedEmail}`;
    console.log(`[调试] 正在验证 Key: "${verificationKey}"`);
    const storedCode = await kv.get<string>(verificationKey);
    
    console.log(`[调试] 用户输入的邮箱验证码: "${emailVerificationCode}"`);
    console.log(`[调试] KV 数据库中存储的验证码: "${storedCode}"`);

    if (!storedCode) {
      throw new Error('邮箱验证码已过期或不存在，请重新发送。');
    }
    if (storedCode !== emailVerificationCode) {
      throw new Error('您输入的邮箱验证码与系统记录不符。');
    }

    const userKey = `user:${normalizedEmail}`;
    const existingUser = await kv.get(userKey);
    if (existingUser) {
      throw new Error('该邮箱地址已被注册。');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = {
      name,
      email: normalizedEmail,
      phone: phone || '',
      hashedPassword,
      createdAt: new Date().toISOString(),
    };
    await kv.set(userKey, JSON.stringify(newUser));
    await kv.del(verificationKey);

    console.log(`[成功] 新用户已注册: ${normalizedEmail}`);
    return { success: true };

  } catch (error) {
    // 修正第三点: 在错误日志中包含更具体的信息
    const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
    console.error(`注册用户时出错: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }
}

// --- 登录函数 ---
export async function loginUser(credentials: UserCredentials) {
  try {
    const { email, password } = credentials;
    const normalizedEmail = email.trim().toLowerCase();
    const userKey = `user:${normalizedEmail}`;
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

    return { 
        success: true, 
        data: { 
            user: userToReturn, 
            token: 'mock-jwt-token-for-demo-purpose' 
        } 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
    console.error(`用户登录时出错: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }
}
