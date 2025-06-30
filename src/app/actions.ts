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
        
        const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
        const beijingISOString = beijingTime.toISOString().replace('Z', '+08:00');
        
        await kv.set(key, JSON.stringify({ email: email, subscribedAt: beijingISOString }));
        return { success: true };
    } catch (error) {
        console.error("写入订阅邮箱到 Redis 时出错:", error);
        return { success: false, error: error instanceof Error ? error.message : '一个未知错误发生了' };
    }
}


export async function sendVerificationEmail(
    email: string,
    graphicalCaptchaInput: string,
    graphicalCaptchaAnswer: string,
    phone?: string // phone 参数仅在注册流程中传递
) {
  if (graphicalCaptchaAnswer.toLowerCase() !== graphicalCaptchaInput.toLowerCase()) {
    return { success: false, message: '图形验证码不正确。' };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isSignupAttempt = phone !== undefined;

  // 关键修正: 在发送邮件前执行所有存在性检查
  if (isSignupAttempt) {
    const userKeyByEmail = `user:${normalizedEmail}`;
    const existingUserByEmail = await kv.get(userKeyByEmail);
    if (existingUserByEmail) {
        return { success: false, message: '该邮箱地址已被注册。' };
    }
    
    if (phone && phone.trim()) {
        const trimmedPhone = phone.trim();
        const phoneIndexKey = `phone:${trimmedPhone}`;
        const existingEmailForPhone = await kv.get(phoneIndexKey);
        if (existingEmailForPhone) {
            return { success: false, message: '该手机号码已被注册。' };
        }
    }
  } else { // 忘记密码流程
    const userKeyByEmail = `user:${normalizedEmail}`;
    const existingUserByEmail = await kv.get(userKeyByEmail);
    if (!existingUserByEmail) {
      return { success: false, message: '该邮箱地址未注册。' };
    }
  }

  // --- 发送邮件逻辑 ---
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.error('SendGrid API Key 或发件人邮箱 (SENDGRID_FROM_EMAIL) 未配置。');
    return { success: false, message: '邮件服务暂时不可用。' };
  }
  sgMail.setApiKey(apiKey);

  const code = Math.floor(100000 + Math.random() * 900000).toString();
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
    
    // 验证码校验
    const storedCode = await kv.get<string | number | null>(verificationKey);
    if (storedCode === null || storedCode === undefined) {
      throw new Error('邮箱验证码已过期或不存在，请重新发送。');
    }
    if (storedCode.toString() !== emailVerificationCode.trim()) {
      throw new Error('您输入的邮箱验证码与系统记录不符。');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const beijingTime = new Date(new Date().getTime() + (8 * 60 * 60 * 1000));
    const beijingISOString = beijingTime.toISOString().replace('Z', '+08:00');

    const newUser = {
      name,
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      hashedPassword,
      createdAt: beijingISOString,
    };
    
    // 存储用户数据和手机号索引
    const userKeyByEmail = `user:${normalizedEmail}`;
    await kv.set(userKeyByEmail, JSON.stringify(newUser));
    if (phone && phone.trim()) {
        const phoneIndexKey = `phone:${phone.trim()}`;
        await kv.set(phoneIndexKey, normalizedEmail);
    }
    
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

export async function resetPassword(info: ResetPasswordInfo) {
    try {
        const { email, emailVerificationCode, newPassword } = info;
        const normalizedEmail = email.trim().toLowerCase();
        
        const userKey = `user:${normalizedEmail}`;
        const storedUserJSON = await kv.get(userKey);
        if (!storedUserJSON) {
            throw new Error('该邮箱地址未注册。');
        }
        const storedUser = storedUserJSON as { name: string; email: string; hashedPassword: string; };

        const verificationKey = `verification:${normalizedEmail}`;
        const storedCode = await kv.get<string | number | null>(verificationKey);
        
        if (storedCode === null || storedCode === undefined) {
            throw new Error('邮箱验证码已过期或不存在，请重新发送。');
        }
        if (storedCode.toString() !== emailVerificationCode.trim()) {
            throw new Error('您输入的邮箱验证码与系统记录不符。');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const updatedUser = {
            ...storedUser,
            hashedPassword,
        };

        await kv.set(userKey, JSON.stringify(updatedUser));
        
        await kv.del(verificationKey);

        return { success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
        console.error(`重置密码时出错: ${errorMessage}`);
        return { success: false, message: errorMessage };
    }
}
