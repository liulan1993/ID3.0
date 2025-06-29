// src/app/auth/wechat/callback/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
// --- 模拟登录修改: 不再需要 useSearchParams 和真实的服务器动作 ---
// import { useSearchParams } from 'next/navigation';
// import { loginWithWechat } from '@/app/actions';

function WechatCallbackComponent() {
  const router = useRouter();
  const [message, setMessage] = useState('正在模拟微信登录，请稍候...');
  const [error, setError] = useState('');

  // --- 模拟登录修改: 重写 useEffect 逻辑 ---
  useEffect(() => {
    // 因为是练习，我们直接模拟一个成功的登录流程
    console.log("进入模拟微信登录回调页面...");

    try {
      // 1. 创建一个虚拟的用户信息
      const mockUser = {
        name: '练习用户',
        email: 'wechat.practice.user@example.com',
      };

      // 2. 创建一个虚拟的 token
      const mockToken = 'mock-token-for-practice-purpose';
      
      // 3. 将虚拟信息存入 localStorage，与真实登录成功后的操作保持一致
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('userInfo', JSON.stringify(mockUser));
      
      // 4. 更新提示信息
      setMessage('模拟登录成功！正在跳转到主页...');
      
      // 5. 延迟跳转，让用户看到提示
      setTimeout(() => {
        router.push('/');
      }, 1500); // 延迟1.5秒

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '一个未知错误发生了';
      setError(`模拟登录时发生错误: ${errorMessage}`);
      console.error(errorMessage);
    }
    
  }, [router]);

  return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="text-center p-8 bg-gray-900 rounded-lg shadow-lg border border-gray-800">
              <h1 className="text-2xl font-bold mb-4">模拟微信登录</h1>
              {error ? (
                  <p className="text-red-400">{error}</p>
              ) : (
                  <p className="text-gray-300">{message}</p>
              )}
              <div className="mt-6">
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
              </div>
          </div>
      </div>
  );
}


// 使用 Suspense 包装以在客户端组件中使用 useSearchParams
export default function WechatCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WechatCallbackComponent />
        </Suspense>
    );
}
