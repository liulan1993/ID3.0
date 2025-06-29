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

// --- 真实的微信登录逻辑 (保留) ---
export async function loginWithWechat(code: string) {
  try {
    // !! 重要: 请替换为您的真实 AppID 和 AppSecret
    const appId = process.env.WECHAT_APPID;
    const appSecret = process.env.WECHAT_APPSECRET;

    if (!appId || !appSecret) {
      throw new Error("微信登录服务配置不完整。");
    }

    // 步骤 1: 使用 code 换取 access_token 和 openid
    // 注意: fetch 需要在 Node.js 18+ 环境下才可用。
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    
    if (tokenData.errcode) {
      throw new Error(`获取 access_token 失败: ${tokenData.errmsg}`);
    }

    const { access_token, openid, unionid } = tokenData;
    // 优先使用 unionid作为唯一标识。如果应用未获取 unionid 权限，则使用 openid。
    const wechatUniqueId = unionid || openid;

    // 步骤 2: 使用 wechatUniqueId 在您的数据库中查找用户
    const userKey = `wechat_user:${wechatUniqueId}`;
    let storedUser = await kv.get(userKey) as { name: string; email: string; avatar: string; } | null;
    
    // 步骤 3: 如果用户不存在，则获取用户信息并创建新用户
    if (!storedUser) {
      const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
      const userInfoRes = await fetch(userInfoUrl);
      const wechatUserInfo = await userInfoRes.json();

      if (wechatUserInfo.errcode) {
        throw new Error(`获取用户信息失败: ${wechatUserInfo.errmsg}`);
      }

      const newUser = {
        name: wechatUserInfo.nickname,
        email: `${wechatUniqueId}@wechat.user`, // 构造一个虚拟邮箱
        avatar: wechatUserInfo.headimgurl,
        createdAt: new Date().toISOString(),
      };
      await kv.set(userKey, JSON.stringify(newUser));
      storedUser = newUser;
    }

    const userToReturn = {
      name: storedUser.name,
      email: storedUser.email,
    };
    
    // 步骤 4: 返回成功信息和用户信息
    return {
      success: true,
      data: {
        user: userToReturn,
        token: 'mock-jwt-token-for-wechat-login'
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '一个未知错误发生了';
    console.error(`微信登录时出错: ${errorMessage}`);
    return { success: false, message: errorMessage };
  }
}

// --- 新增: 模拟检查微信用户是否已注册 ---
export async function checkWechatUser() {
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 为了练习，我们用 50% 的概率随机决定用户是否存在
    // 在真实场景中，这里应该是查询数据库的逻辑
    const userExists = Math.random() > 0.5;

    if (userExists) {
      // 如果用户存在，返回一个模拟的用户数据和 token
      console.log("模拟微信用户检查：用户已存在，将直接登录。");
      return {
        success: true,
        exists: true,
        data: {
          user: { name: '已注册的微信用户', email: 'existing.wechat.user@example.com' },
          token: 'mock-token-for-existing-wechat-user'
        }
      };
    } else {
      // 如果用户不存在，告诉前端需要注册
      console.log("模拟微信用户检查：用户不存在，将引导注册。");
      return {
        success: true,
        exists: false,
        data: null
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '检查微信用户时发生未知错误';
    return { success: false, exists: false, message: errorMessage, data: null };
  }
}
