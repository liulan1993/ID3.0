import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, RefreshCw, X } from 'lucide-react';
// 引入服务器动作
import { loginUser, registerUser, sendVerificationEmail } from "@/app/actions";

// --- 类型定义 ---
interface User {
  name: string;
  email: string;
}

interface LoginSuccessData {
  user: User;
  token: string;
}

// --- 组件定义 ---
const WechatIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M17 14.85c-.9-1.3-2.43-2.15-4.13-2.15-2.25 0-4.18 1.4-4.87 3.32" />
    <path d="M10.15 11.2a.5.5 0 1 0-.3-1 .5.5 0 0 0 .3 1Z" />
    <path d="M14.15 11.2a.5.5 0 1 0-.3-1 .5.5 0 0 0 .3 1Z" />
    <path d="M5.01 15.39c-.58 2.5-1.92 4.4-3.51 5.61.32-.13.62-.3.9-.51s.55-.45.8-.73c.25-.28.48-.6.68-.95.2-.35.36-.73.48-1.14.12-.4.2-.84.24-1.3" />
    <path d="M20.99 15.39c.58 2.5 1.92 4.4 3.51 5.61-.32-.13.62-.3-.9-.51s-.55-.45-.8-.73c.25-.28-.48-.6-.68-.95.2-.35-.36-.73-.48-1.14-.12-.4-.2-.84-.24-1.3" />
    <path d="M9.13 2.89c-5.18 1.85-8.63 7.07-8.63 12.51 0 1.93.39 3.77 1.1 5.43" />
    <path d="M14.87 2.89c5.18 1.85 8.63 7.07 8.63 12.51 0 1.93-.39 3.77-1.1 5.43" />
  </svg>
);
interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  children?: React.ReactNode;
}
const AnimatedFormField: React.FC<FormFieldProps> = ({type, placeholder, value, onChange, icon, children}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (<div className="relative group"><div className="relative overflow-hidden rounded-lg border border-gray-800 bg-black transition-all duration-300 ease-in-out" onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}><div className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">{icon}</div><input type={type} value={value} onChange={onChange} className={`w-full bg-transparent pl-10 py-3 text-white placeholder:text-gray-400 focus:outline-none ${children ? 'pr-32' : 'pr-12'}`} placeholder={placeholder} /><div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{children}</div>{isHovering && (<div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.05) 0%, transparent 70%)` }} />)}</div></div>);
};
const SocialButton: React.FC<{ icon: React.ReactNode; name: string }> = ({ icon, name }) => {
  return (<button className="relative group p-3 w-full rounded-lg border border-gray-800 bg-black hover:bg-gray-900 transition-all duration-300 ease-in-out overflow-hidden" aria-label={`使用 ${name} 登录`}><div className="relative flex justify-center text-white">{icon}</div></button>);
};


// --- 主组件 ---
interface AuthFormComponentProps {
    onClose: () => void;
    onLoginSuccess: (data: LoginSuccessData) => void; 
}

const AuthFormComponent: React.FC<AuthFormComponentProps> = ({ onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  useEffect(() => {
    if (isSignUp) {
      generateCaptcha();
    }
  }, [isSignUp]);

  const handleSendVerificationEmail = async () => {
    if (!email) {
      alert("请输入邮箱地址");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      alert("请输入有效的邮箱地址");
      return;
    }
    if (!captchaInput) {
      alert("发送邮件前，请先输入图形验证码。");
      return;
    }

    setIsSending(true);
    
    const result = await sendVerificationEmail(email, captchaInput, captcha);

    if (result.success) {
      alert('验证码已发送，请检查您的邮箱。');
      setCountdown(60);
    } else {
      alert(`发送失败: ${result.message}`);
      generateCaptcha();
      setCaptchaInput("");
    }

    setIsSending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (isSignUp) {
      const userInfo = { 
        name, 
        email, 
        phone, 
        password,
        emailVerificationCode
      };
      const result = await registerUser(userInfo);
      if (result.success) {
        alert('注册成功！现在您可以登录了。');
        toggleMode(); 
      } else {
        alert(`注册失败: ${result.message}`);
        generateCaptcha();
        setCaptchaInput('');
      }
    } else {
      const credentials = { email, password };
      const result = await loginUser(credentials);
      if (result.success && result.data) {
        onLoginSuccess(result.data);
      } else {
        alert(`登录失败: ${result.message}`);
      }
    }

    setIsSubmitting(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail(""); setPhone(""); setPassword(""); setName("");
    setShowPassword(false); setLoginMethod('email');
    setCaptchaInput(''); setEmailVerificationCode('');
    setCountdown(0); setIsSending(false);
  };

  return (
    <div className="relative w-full max-w-md bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-white/5 font-sans">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
            aria-label="关闭登录窗口"
        >
            <X size={24} />
        </button>

        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4 border border-gray-800">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{isSignUp ? '创建账户' : '欢迎回来'}</h1>
            <p className="text-gray-400">{isSignUp ? '注册以开始使用' : '登录以继续'}</p>
        </div>
        
        {!isSignUp && (
            <div className="flex justify-center bg-gray-900 rounded-lg p-1 mb-6">
              <button onClick={() => setLoginMethod('email')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'email' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}>邮箱登录</button>
              <button onClick={() => setLoginMethod('phone')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'phone' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}>手机登录</button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp ? (
            <>
              <AnimatedFormField type="text" placeholder="全名" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={18} />} />
              {/* 关键修正 1: 将发送邮件按钮放回 Email 输入框 */}
              <AnimatedFormField type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />}>
                  <button type="button" onClick={handleSendVerificationEmail} disabled={isSending || countdown > 0} className="text-xs font-semibold text-white disabled:text-gray-600 hover:text-gray-300 transition-colors whitespace-nowrap">
                      {isSending ? "发送中..." : countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
                  </button>
              </AnimatedFormField>
              <AnimatedFormField type="tel" placeholder="手机号码" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
              <AnimatedFormField type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} />
              {/* 关键修正 2: 恢复图形验证码的正确布局 */}
               <AnimatedFormField type="text" placeholder="图形验证码" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} icon={<ShieldCheck size={18} />}>
                    <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold tracking-widest text-gray-400 select-none" style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>{captcha}</span>
                        <button type="button" onClick={generateCaptcha} className="text-white hover:text-gray-300 transition-colors"><RefreshCw size={18}/></button>
                    </div>
               </AnimatedFormField>
               <AnimatedFormField type="text" placeholder="邮箱验证码" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value)} icon={<Mail size={18} />} />
            </>
        ) : (
            <>
              {loginMethod === 'email' ? 
              <AnimatedFormField type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
              : 
              <AnimatedFormField type="tel" placeholder="手机号码" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />}
               <AnimatedFormField type={showPassword ? "text" : "password"} placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />}>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </AnimatedFormField>
            </>
        )}
        
        <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 appearance-none bg-gray-800 border-gray-600 rounded-sm checked:bg-white focus:ring-white/50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition"
              />
              <span className="text-sm text-gray-400 group-hover:text-white transition">记住我</span>
            </label>
            
            {!isSignUp && (
              <button type="button" className="text-sm text-white hover:underline">
                忘记密码?
              </button>
            )}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full relative group bg-white text-black py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden">
            <span className={`transition-opacity duration-200 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>{isSignUp ? '创建账户' : '登 录'}</span>
            {isSubmitting && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /></div>}
        </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">或使用以下方式继续</span>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <div className="w-1/3 px-2">
              <SocialButton icon={<WechatIcon />} name="微信" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            {isSignUp ? '已经有账户了?' : "还没有账户?"}{' '}
            <button type="button" onClick={toggleMode} className="text-white hover:underline font-medium">{isSignUp ? '去登录' : '去注册'}</button>
          </p>
        </div>
    </div>
  );
};

export default AuthFormComponent;
