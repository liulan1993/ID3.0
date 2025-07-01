// src/components/ui/footer.tsx
"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
// --- 路径已修正 ---
// --------------------

function StackedCircularFooter() {
  return (
    <footer className="bg-transparent py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          
          <div className="mb-8 flex w-full max-w-[300px] sm:max-w-[400px] flex-col items-center justify-center rounded-lg p-6">
            <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white">官方公众号</h2>
            <div className="flex-grow flex items-center justify-center">
                <Image 
                  src="https://zh.apex-elite-service.com/wenjian/weixingongzhonghao.png" 
                  alt="官方公众号二维码" 
                  width={300} 
                  height={300}
                  className="rounded-md w-full h-auto max-w-[250px] sm:max-w-[300px]"
                />
            </div>
          </div>

          <nav className="mb-8 flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-sm sm:text-base">
            <Link href="/" className="text-gray-400 hover:text-white">Apex</Link>
            <Link href="/" className="text-gray-400 hover:text-white">留学</Link>
            <Link href="/" className="text-gray-400 hover:text-white">医疗</Link>
            <Link href="/" className="text-gray-400 hover:text-white">企业服务</Link>
            <Link href="/" className="text-gray-400 hover:text-white">敬请期待</Link>
          </nav>
          
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              © 2024 Your Company. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default StackedCircularFooter;
