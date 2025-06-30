/*
 * 文件: src/app/actions.ts
 * 描述: 生产版本的服务器动作。
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
  name:string;
  email: string;
  phone?: string;
  password: string;
  emailVerificationCode: string;
}

interface UserCredentials {
  email: string;
  password:string;
}

// 新增：密码重置信息接口
interface ResetPasswordInfo {
    email: string;
    emailVerificationCode: string;
    newPassword: string;
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


export async function sendVerificationEmail(email: string, graphicalCaptchaInput: string, graphicalCaptchaAnswer: string) {
  if (graphicalCaptchaAnswer.toLowerCase() !== graphicalCaptchaInput.toLowerCase()) {
    return { success: false, message: '图形验证码不正确。' };
  }

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
    await kv.set(verificationKey, code, { ex: 900 }); 

    const msg = {
      to: email,
      from: fromEmail,
      subject: '您的验证码 - Apex',
      text: `您的 Apex 网站验证码是: ${code}。该验证码将在15分钟后失效。`,
      html: `<strong>您的 Apex 网站验证码是: ${code}</strong>。该验证码将在15分钟后失效。`,
    };

    await sgMail.send(msg);
    return { success: true };

  } catch (error) {
    console.error("发送验证邮件时出错:", error);
    return { success: false, message: '发送验证码失败，请稍后再试。' };
  }
}


export async function registerUser(userInfo: RegistrationInfo) {
  try {
    const { email, password, name, phone, emailVerificationCode } = userInfo;
    
    const normalizedEmail = email.trim().toLowerCase();
    const verificationKey = `verification:${normalizedEmail}`;
    
    const storedCode = await kv.get<string | number | null>(verificationKey);
    
    if (storedCode === null || storedCode === undefined) {
      throw new Error('邮箱验证码已过期或不存在，请重新发送。');
    }
    
    if (storedCode.toString() !== emailVerificationCode.trim()) {
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

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
    console.error(`注册用户时出错: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }
}

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

// --- 新增：重置密码的服务器动作 ---
export async function resetPassword(info: ResetPasswordInfo) {
    try {
        const { email, emailVerificationCode, newPassword } = info;
        const normalizedEmail = email.trim().toLowerCase();
        
        // 1. 检查用户是否存在
        const userKey = `user:${normalizedEmail}`;
        const storedUserJSON = await kv.get(userKey);
        if (!storedUserJSON) {
            throw new Error('该邮箱地址未注册。');
        }
        const storedUser = storedUserJSON as { name: string; email: string; hashedPassword: string; };

        // 2. 验证邮箱验证码
        const verificationKey = `verification:${normalizedEmail}`;
        const storedCode = await kv.get<string | number | null>(verificationKey);
        
        if (storedCode === null || storedCode === undefined) {
            throw new Error('邮箱验证码已过期或不存在，请重新发送。');
        }
        if (storedCode.toString() !== emailVerificationCode.trim()) {
            throw new Error('您输入的邮箱验证码与系统记录不符。');
        }

        // 3. 更新密码
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const updatedUser = {
            ...storedUser,
            hashedPassword,
        };

        await kv.set(userKey, JSON.stringify(updatedUser));
        
        // 4. 删除已使用的验证码
        await kv.del(verificationKey);

        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
        console.error(`重置密码时出错: ${errorMessage}`);
        return { success: false, message: errorMessage };
    }
}
