"use client";

import React from 'react';
import { motion } from 'framer-motion';

// 浮动路径动画子组件
function FloatingPaths() {
  // SVG 视图盒子尺寸
  const viewBoxWidth = 800;
  const viewBoxHeight = 600;

  // 创建一组 SVG 路径数据，使其从顶部流向底部中心
  const paths = Array.from({ length: 40 }, (_, i) => {
    const startX = Math.random() * viewBoxWidth;
    const startY = -20; // 从视图上方开始
    const endX = viewBoxWidth / 2; // 结束于中心
    const endY = viewBoxHeight + 20; // 结束于视图下方
    
    // 使用二次贝塞尔曲线创建弧形路径
    const controlX = Math.random() * viewBoxWidth;
    const controlY = Math.random() * viewBoxHeight;

    return {
        id: i,
        d: `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`,
        width: 1 + Math.random() * 1,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full text-amber-600"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Flowing Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + Math.random() * 0.15}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// --- 新增: 定义组件的 Props 类型 ---
interface JinSeXianTiaoProps {
  title?: string;
  description?: string;
}

// 金色线条组件 (已更新)
export default function JinSeXianTiao({ 
  title = "Your Title Here", 
  description = "Your description goes here. Customize it as you see fit." 
}: JinSeXianTiaoProps) {
  const words = title.split(' ');

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-transparent">
      {/* 背景浮动路径 */}
      <div className="absolute inset-0 -z-10">
        <FloatingPaths />
      </div>

      {/* --- 新增: 前景内容 --- */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          {/* 动态标题文本 */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split('').map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: 'spring',
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-white"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          {/* 描述性文字 */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="max-w-2xl mx-auto text-lg text-white/80"
          >
            {description}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
