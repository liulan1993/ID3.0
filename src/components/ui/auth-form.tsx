import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, RefreshCw, X } from 'lucide-react';

// --- 依赖说明 ---
// 这个组件依赖 "lucide-react" 库来显示图标。
// 如果您尚未安装，请运行:
// npm install lucide-react

// --- 自定义微信图标 ---
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

// --- 动画输入框组件 ---
interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const AnimatedFormField: React.FC<FormFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  icon,
  children
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="relative group">
      <div
        className="relative overflow-hidden rounded-lg border border-gray-700 bg-gray-900 transition-all duration-300 ease-in-out"
        onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-400">
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full bg-transparent pl-10 py-3 text-white placeholder:text-gray-500 focus:outline-none ${children ? 'pr-32' : 'pr-12'}`}
          placeholder=""
        />
        <label className={`absolute left-10 transition-all duration-200 ease-in-out pointer-events-none ${isFocused || value ? 'top-2 text-xs text-blue-400 font-medium' : 'top-1/2 -translate-y-1/2 text-base text-gray-400'}`}>
          {placeholder}
        </label>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {children}
        </div>
        {isHovering && (
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.1) 0%, transparent 70%)` }} />
        )}
      </div>
    </div>
  );
};

// --- 社交媒体登录按钮 ---
const SocialButton: React.FC<{ icon: React.ReactNode; name: string }> = ({ icon, name }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="relative group p-3 w-full rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`使用 ${name} 登录`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-green-500/20 via-teal-500/20 to-blue-500/20 transition-transform duration-500 ${
        isHovered ? 'translate-x-0' : '-translate-x-full'
      }`} />
      <div className="relative flex justify-center text-white group-hover:text-green-400 transition-colors">
        {icon}
      </div>
    </button>
  );
};

// --- 主组件: 登录/注册表单 ---
interface AuthFormComponentProps {
    onClose: () => void;
}

const AuthFormComponent: React.FC<AuthFormComponentProps> = ({ onClose }) => {
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

    setIsSending(true);
    setCountdown(60);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      console.log(`(模拟) 已向 ${email} 发送验证码`);
    } catch (error) {
      console.error(error);
      alert("验证码发送失败，请稍后再试。");
      setCountdown(0);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isSignUp) {
      if (captcha.toLowerCase() !== captchaInput.toLowerCase()) {
        alert('图形验证码不正确!');
        generateCaptcha();
        setCaptchaInput('');
        return;
      }
      if (emailVerificationCode !== '123456') { 
         alert('邮箱验证码不正确!');
         return;
      }
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const submittedData = isSignUp 
      ? { mode: '注册', name, email, phone, password, rememberMe }
      : { mode: '登录', loginMethod, email: loginMethod === 'email' ? email : undefined, phone: loginMethod === 'phone' ? phone : undefined, password, rememberMe };

    console.log('表单已提交:', submittedData);
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
    <div className="relative w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-700 rounded-2xl p-8 shadow-2xl shadow-blue-500/10 font-sans">
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20"
            aria-label="关闭登录窗口"
        >
            <X size={24} />
        </button>

        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4 border border-blue-500/20">
            <User className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{isSignUp ? '创建账户' : '欢迎回来'}</h1>
            <p className="text-gray-400">{isSignUp ? '注册以开始使用' : '登录以继续'}</p>
        </div>
        
        {!isSignUp && (
        <div className="flex justify-center bg-gray-800/50 rounded-lg p-1 mb-6">
            <button onClick={() => setLoginMethod('email')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'email' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>邮箱登录</button>
            <button onClick={() => setLoginMethod('phone')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'phone' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>手机登录</button>
        </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        {isSignUp ? (
            <>
            <AnimatedFormField type="text" placeholder="全名" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={18} />} />
            <AnimatedFormField type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />}>
                <button type="button" onClick={handleSendVerificationEmail} disabled={isSending || countdown > 0} className="text-xs font-semibold text-blue-400 disabled:text-gray-500 disabled:cursor-not-allowed hover:text-white transition-colors whitespace-nowrap">
                    {isSending ? "发送中..." : countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
                </button>
            </AnimatedFormField>
            <AnimatedFormField type="tel" placeholder="手机号码" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
            </>
        ) : (
            loginMethod === 'email' ? 
            <AnimatedFormField type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} />
            : 
            <AnimatedFormField type="tel" placeholder="手机号码" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} />
        )}

        <AnimatedFormField type={showPassword ? "text" : "password"} placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />}>
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-white transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </AnimatedFormField>
        
        {isSignUp && (
            <>
                <AnimatedFormField type="text" placeholder="图形验证码" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} icon={<ShieldCheck size={18} />}>
                    <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold tracking-widest text-gray-400 select-none" style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>{captcha}</span>
                        <button type="button" onClick={generateCaptcha} className="text-gray-400 hover:text-white transition-colors"><RefreshCw size={18}/></button>
                    </div>
                </AnimatedFormField>
                <AnimatedFormField type="text" placeholder="邮箱验证码" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value)} icon={<Mail size={18} />} />
            </>
        )}

        <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
            <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 appearance-none bg-gray-800 border-gray-600 rounded-sm checked:bg-blue-500 checked:border-transparent focus:ring-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
            />
            <span className="text-sm text-gray-400 group-hover:text-white transition">记住我</span>
            </label>
            
            {!isSignUp && (
            <button
                type="button"
                className="text-sm text-blue-400 hover:underline"
            >
                忘记密码?
            </button>
            )}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full relative group bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden">
            <span className={`transition-opacity duration-200 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>{isSignUp ? '创建账户' : '登 录'}</span>
            {isSubmitting && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-500 ease-in-out group-hover:left-full" />
        </button>
        </form>

        <div className="mt-8">
        <div className="relative">
            <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-900 text-gray-400">或使用以下方式继续</span>
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
            <button type="button" onClick={toggleMode} className="text-blue-400 hover:underline font-medium">{isSignUp ? '去登录' : '去注册'}</button>
        </p>
        </div>
    </div>
  );
};

export default AuthFormComponent;
