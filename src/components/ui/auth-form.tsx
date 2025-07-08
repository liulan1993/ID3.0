// --- START OF FILE auth-form.tsx ---

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, RefreshCw, X, Edit3, ArrowLeft } from 'lucide-react';
// 引入服务器动作
import { loginUser, registerUser, sendVerificationEmail, resetPassword } from "@/app/actions";

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
interface FormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}
const AnimatedFormField: React.FC<FormFieldProps> = ({type, placeholder, value, onChange, icon, autoComplete, children, disabled = false}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };
  return (<div className="relative group"><div className={`relative overflow-hidden rounded-lg border border-gray-800 bg-black transition-all duration-300 ease-in-out ${disabled ? 'opacity-60' : ''}`} onMouseMove={handleMouseMove} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}><div className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">{icon}</div>
  <input type={type} value={value} onChange={onChange} disabled={disabled} autoComplete={autoComplete} className={`w-full bg-transparent pl-10 py-3 text-white placeholder:text-gray-400 focus:outline-none ${disabled ? 'cursor-not-allowed' : ''} ${children ? 'pr-32' : 'pr-12'}`} placeholder={placeholder} />
  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">{children}</div>{isHovering && !disabled && (<div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.05) 0%, transparent 70%)` }} />)}</div></div>);
};

// --- 主组件 ---
interface AuthFormComponentProps {
    onClose: () => void;
    onLoginSuccess: (data: LoginSuccessData) => void; 
}

const AuthFormComponent: React.FC<AuthFormComponentProps> = ({ onClose, onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>('login');
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 忘记密码流程的状态
  const [resetStep, setResetStep] = useState(1);


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
    if (view === 'signup' || (view === 'forgotPassword' && resetStep === 1)) {
      generateCaptcha();
    }
  }, [view, resetStep]);

  const clearFormState = () => {
      setEmail(""); setPhone(""); setPassword(""); setConfirmPassword(""); setName("");
      setShowPassword(false); setRememberMe(false);
      setCaptchaInput(''); setEmailVerificationCode('');
      setCountdown(0); setIsSending(false);
      setIsEmailLocked(false);
      setErrorMessage(null); setSuccessMessage(null);
  }

  const handleSwitchView = (newView: 'login' | 'signup' | 'forgotPassword') => {
      setView(newView);
      clearFormState();
      if (newView === 'forgotPassword') {
          setResetStep(1);
      }
  };

  const handleSendVerificationEmail = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email) {
      setErrorMessage("请输入邮箱地址");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMessage("请输入有效的邮箱地址");
      return;
    }
    if (view === 'signup' && !phone) {
      setErrorMessage("请输入手机号码");
      return;
    }
    if (!captchaInput) {
      setErrorMessage("发送邮件前，请先输入图形验证码。");
      return;
    }

    setIsSending(true);
    
    let result;
    if (view === 'signup') {
        result = await sendVerificationEmail(email, captchaInput, captcha, phone);
    } else { // 'forgotPassword' view
        result = await sendVerificationEmail(email, captchaInput, captcha);
    }
    
    setIsSending(false);

    if (result.success) {
      setSuccessMessage('验证码已发送，请检查您的邮箱。');
      setCountdown(60);
      setIsEmailLocked(true);
      if (view === 'forgotPassword') {
          setResetStep(2); 
          setSuccessMessage(null);
      }
    } else {
      setErrorMessage(`发送失败: ${result.message}`);
      generateCaptcha();
      setCaptchaInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (view === 'signup') {
      const userInfo = { name, email, phone, password, emailVerificationCode };
      const result = await registerUser(userInfo);
      if (result.success) {
        setSuccessMessage('注册成功！现在您可以登录了。');
        setTimeout(() => handleSwitchView('login'), 2000);
      } else {
        setErrorMessage(`注册失败: ${result.message}`);
        generateCaptcha();
        setCaptchaInput('');
      }
    } else if (view === 'login') {
      if (loginMethod === 'phone') {
        if (!/^\d{11}$/.test(phone)) {
          setErrorMessage("请输入有效的11位手机号码。");
          setIsSubmitting(false);
          return;
        }
      } else { // email login
        if (!/\S+@\S+\.\S+/.test(email)) {
          setErrorMessage("请输入有效的邮箱地址。");
          setIsSubmitting(false);
          return;
        }
      }
      
      const identifier = loginMethod === 'email' ? email : phone;
      if (!identifier || !password) {
        setErrorMessage("账号和密码不能为空");
        setIsSubmitting(false);
        return;
      }

      // [最终修复] 恢复此处的代码，使用 'email' 字段来传递登录标识符。
      // 这将解决 TypeScript 编译错误，因为 `loginUser` 函数的类型定义期望接收 'email' 属性。
      const result = await loginUser({ email: identifier, password });

      if (result.success && result.data) {
        onLoginSuccess(result.data);
      } else {
        setErrorMessage(`登录失败: ${result.message || '未知错误'}`);
      }
    } else if (view === 'forgotPassword') {
        if (password !== confirmPassword) {
            setErrorMessage("两次输入的密码不一致。");
            setIsSubmitting(false);
            return;
        }
        const resetInfo = { email, emailVerificationCode, newPassword: password };
        const result = await resetPassword(resetInfo);
        if (result.success) {
            setSuccessMessage("密码重置成功！即将返回登录界面。");
            setTimeout(() => {
                handleSwitchView('login');
            }, 2000);
        } else {
            setErrorMessage(`密码重置失败: ${result.message}`);
        }
    }

    setIsSubmitting(false);
  };

  const renderTitle = () => {
      switch(view) {
          case 'login': return '欢迎回来';
          case 'signup': return '创建账户';
          case 'forgotPassword': return '重置密码';
      }
  }

  const renderSubtitle = () => {
    switch(view) {
        case 'login': return '登录以继续';
        case 'signup': return '请完善您的注册信息';
        case 'forgotPassword': return '请根据提示完成密码重置';
    }
  }

  return (
    <div className="relative w-full max-w-md bg-black border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-white/5 font-sans">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-20" aria-label="关闭登录窗口"><X size={24} /></button>
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-full mb-4 border border-gray-800"><User className="w-8 h-8 text-white" /></div>
            <h1 className="text-3xl font-bold text-white mb-2">{renderTitle()}</h1>
            <p className="text-gray-400">{renderSubtitle()}</p>
        </div>
        
        {view === 'login' && (
            <div className="flex justify-center bg-gray-900 rounded-lg p-1 mb-6">
              <button onClick={() => setLoginMethod('email')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'email' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}>邮箱登录</button>
              <button onClick={() => setLoginMethod('phone')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors duration-300 ${loginMethod === 'phone' ? 'bg-white text-black' : 'text-gray-400 hover:bg-gray-800'}`}>手机登录</button>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
        {view === 'login' && (
            <>
              {loginMethod === 'email' ? 
              <AnimatedFormField type="email" placeholder="邮箱地址" value={email} onChange={(e) => setEmail(e.target.value)} icon={<Mail size={18} />} autoComplete="email" />
              : 
              <AnimatedFormField type="tel" placeholder="手机号码" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={18} />} autoComplete="tel" />}
               <AnimatedFormField type={showPassword ? "text" : "password"} placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="current-password">
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white hover:text-gray-300 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </AnimatedFormField>
            </>
        )}
        {view === 'signup' && (
            <>
              <AnimatedFormField type="text" placeholder="全名" value={name} onChange={(e) => setName(e.target.value)} icon={<User size={18} />} autoComplete="name" />
              <AnimatedFormField 
                  type="email" 
                  placeholder="邮箱地址" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  icon={<Mail size={18} />}
                  autoComplete="email"
                  disabled={isEmailLocked}
              >
                  {isEmailLocked ? (
                      <button type="button" onClick={() => { setIsEmailLocked(false); setCountdown(0); }} className="flex items-center space-x-1 text-xs font-semibold text-white hover:text-gray-300 transition-colors">
                          <Edit3 size={12} />
                          <span>更改</span>
                      </button>
                  ) : (
                      <button type="button" onClick={handleSendVerificationEmail} disabled={isSending || countdown > 0} className="text-xs font-semibold text-white disabled:text-gray-600 hover:text-gray-300 transition-colors whitespace-nowrap">
                          {isSending ? "发送中..." : countdown > 0 ? `${countdown}s 后重发` : "发送验证码"}
                      </button>
                  )}
              </AnimatedFormField>
              <AnimatedFormField 
                  type="tel" 
                  placeholder="手机号码" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  icon={<Phone size={18} />} 
                  autoComplete="tel"
              />
              <AnimatedFormField type="password" placeholder="设置密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="new-password" />
               <AnimatedFormField type="text" placeholder="图形验证码" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} icon={<ShieldCheck size={18} />} autoComplete="off">
                    <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold tracking-widest text-gray-400 select-none" style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>{captcha}</span>
                        <button type="button" onClick={generateCaptcha} className="text-white hover:text-gray-300 transition-colors"><RefreshCw size={18}/></button>
                    </div>
               </AnimatedFormField>
               <AnimatedFormField type="text" placeholder="邮箱验证码" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value)} icon={<Mail size={18} />} autoComplete="one-time-code" />
            </>
        )}

        {view === 'forgotPassword' && (
             <>
              <AnimatedFormField 
                  type="email" 
                  placeholder="请输入您注册的邮箱地址" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  icon={<Mail size={18} />}
                  autoComplete="email"
                  disabled={isEmailLocked}
              />
              {resetStep === 1 && (
                <AnimatedFormField type="text" placeholder="图形验证码" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)} icon={<ShieldCheck size={18} />} autoComplete="off">
                      <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold tracking-widest text-gray-400 select-none" style={{ fontFamily: 'monospace', letterSpacing: '0.2em' }}>{captcha}</span>
                          <button type="button" onClick={generateCaptcha} className="text-white hover:text-gray-300 transition-colors"><RefreshCw size={18}/></button>
                      </div>
                 </AnimatedFormField>
              )}
              {resetStep === 2 && (
                   <>
                      <AnimatedFormField type="text" placeholder="邮箱验证码" value={emailVerificationCode} onChange={(e) => setEmailVerificationCode(e.target.value)} icon={<ShieldCheck size={18} />} autoComplete="one-time-code" />
                      <AnimatedFormField type={showPassword ? "text" : "password"} placeholder="设置新密码" value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="new-password">
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white hover:text-gray-300 transition-colors">
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </AnimatedFormField>
                      <AnimatedFormField type="password" placeholder="确认新密码" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock size={18} />} autoComplete="new-password" />
                   </>
              )}
            </>
        )}

        {errorMessage && (
          <div className="text-red-500 text-sm text-center p-2 bg-red-500/10 rounded-lg">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="text-green-500 text-sm text-center p-2 bg-green-500/10 rounded-lg">
            {successMessage}
          </div>
        )}

        {view === 'login' && (
            <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 appearance-none bg-gray-800 border-gray-600 rounded-sm checked:bg-white focus:ring-white/50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition" />
                  <span className="text-sm text-gray-400 group-hover:text-white transition">记住我</span>
                </label>
                <button type="button" onClick={() => handleSwitchView('forgotPassword')} className="text-sm text-white hover:underline">忘记密码?</button>
            </div>
        )}

        {view !== 'forgotPassword' || resetStep === 2 ? (
            <button type="submit" disabled={isSubmitting} className="w-full relative group bg-white text-black py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden">
                <span className={`transition-opacity duration-200 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>{view === 'login' ? '登 录' : view === 'signup' ? '创建账户' : '确认重置'}</span>
                {isSubmitting && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /></div>}
            </button>
        ) : (
            <button type="button" onClick={handleSendVerificationEmail} disabled={isSending || countdown > 0} className="w-full relative group bg-white text-black py-3 px-4 rounded-lg font-semibold transition-all duration-300 ease-in-out hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden">
                 <span className={`transition-opacity duration-200 ${isSending ? 'opacity-0' : 'opacity-100'}`}>{countdown > 0 ? `${countdown}s 后可重发` : "发送验证码"}</span>
                {(isSending || countdown > 0) && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /></div>}
            </button>
        )}
        </form>

        <div className="mt-8 text-center">
            {view === 'login' && (
              <p className="text-sm text-gray-400">
                还没有账户?{' '}
                <button type="button" onClick={() => handleSwitchView('signup')} className="text-white hover:underline font-medium">去注册</button>
              </p>
            )}
            {view === 'signup' && (
              <p className="text-sm text-gray-400">
                已经有账户了?{' '}
                <button type="button" onClick={() => handleSwitchView('login')} className="text-white hover:underline font-medium">去登录</button>
              </p>
            )}
             {view === 'forgotPassword' && (
              <p className="text-sm text-gray-400">
                <button type="button" onClick={() => handleSwitchView('login')} className="text-white hover:underline font-medium flex items-center justify-center gap-2 w-full">
                    <ArrowLeft size={16} />
                    <span>返回登录</span>
                </button>
              </p>
            )}
        </div>
    </div>
  );
};

export default AuthFormComponent;