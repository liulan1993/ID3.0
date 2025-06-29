/*
 * 文件: src/app/actions.ts
 * 描述: 【特殊诊断版本】此版本的代码不是为了修复问题，而是为了获取决定性的调试信息。
 *      它会中断正常的注册流程，并通过弹窗将服务器端看到的所有关键数据返回给前端。
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
export async function sendVerificationEmail(email: string, graphicalCaptchaInput: string, graphicalCaptchaAnswer: string) {
  // 关键修正 1: 发送邮件前，必须先验证图形验证码
  if (graphicalCaptchaAnswer.toLowerCase() !== graphicalCaptchaInput.toLowerCase()) {
    console.log(`[调试] 发送邮件前图形验证码失败。正确答案: "${graphicalCaptchaAnswer}", 用户输入: "${graphicalCaptchaInput}"`);
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
    console.log(`[调试] 验证码已存入 Key: ${verificationKey}，值为: ${code}`);
    return { success: true };

  } catch (error) {
    console.error("发送验证邮件时出错:", error);
    return { success: false, message: '发送验证码失败，请稍后再试。' };
  }
}


// --- 注册函数 (已修改为诊断模式) ---
export async function registerUser(userInfo: RegistrationInfo) {
  try {
    const { email, emailVerificationCode } = userInfo;
    
    const normalizedEmailFromUser = email.trim().toLowerCase();
    const verificationKey = `verification:${normalizedEmailFromUser}`;
    
    const storedCode = await kv.get<string>(verificationKey);

    // =================================================================
    // 【诊断核心】
    // 我们将在这里中断程序，并构建一个详细的诊断信息字符串。
    // 这个字符串将作为错误消息返回，并显示在前端的 alert() 中。
    // =================================================================
    
    // 将字符串转换为十六进制编码，这可以暴露任何不可见字符
    const toHex = (str: string | null | undefined) => {
        if (str === null || str === undefined) return 'null or undefined';
        return [...str].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    };

    const diagnosticMessage = `
    --- VERCEL KV 服务器端诊断报告 ---

    [1] 邮箱信息:
    - 前端传入的邮箱 (处理后): "${normalizedEmailFromUser}"
    - 用于查询 KV 的 Key: "${verificationKey}"

    [2] 查询结果:
    - KV.get() 是否找到记录: ${storedCode ? '是' : '否'}
    - 从 KV 中取出的验证码 (原始值): "${storedCode}"

    [3] 验证码详细比对:
    - (服务器端) 存储的验证码:
      - 值: [${storedCode}]
      - 类型: ${typeof storedCode}
      - 长度: ${storedCode?.length ?? 'N/A'}
      - 十六进制: ${toHex(storedCode)}

    - (浏览器端) 用户输入的验证码:
      - 值: [${emailVerificationCode}]
      - 类型: ${typeof emailVerificationCode}
      - 长度: ${emailVerificationCode?.length ?? 'N/A'}
      - 十六进制: ${toHex(emailVerificationCode)}
    `;

    // 直接返回诊断信息，让前端弹窗显示
    return { success: false, message: diagnosticMessage };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
    console.error(`诊断过程中捕获到意外错误: ${errorMessage}`);
    return { success: false, message: `诊断过程中捕获到意外错误: ${errorMessage}` };
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