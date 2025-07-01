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
        className="w-full h-full text-yellow-400"
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <title>Flowing Background Paths with Glow</title>
        <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.2 + Math.random() * 0.2}
            filter="url(#glow)"
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

// --- 组件 Props 类型 ---
interface JinSeXianTiaoProps {
  title?: string;
  description?: string;
}

// 金色线条组件 (已更新)
export default function JinSeXianTiao({ 
  title = "留学教育\nStudy Abroad Education", // [已修改] 支持多行标题
  description = "我们为客户提供卓越的服务，以实现教育目标并取得成功。" 
}: JinSeXianTiaoProps) {
  // [已修改] 按换行符分割标题以支持多行
  const titleLines = title.split('\n');

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-transparent">
      {/* 背景浮动路径 */}
      <div className="absolute inset-0 -z-10">
        <FloatingPaths />
      </div>

      {/* 前景内容 */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          {/* [已修改] 动态标题文本支持换行 */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-6 tracking-tighter">
            {titleLines.map((line, lineIndex) => (
              <div key={lineIndex} className="block"> {/* 每行是一个独立的块 */}
                {line.split(' ').map((word, wordIndex) => (
                  <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                    {word.split('').map((letter, letterIndex) => (
                      <motion.span
                        key={`${lineIndex}-${wordIndex}-${letterIndex}`}
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                          delay: (lineIndex * 0.5) + (wordIndex * 0.1) + (letterIndex * 0.03),
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
              </div>
            ))}
          </h1>

          {/* [已修改] 描述性文字支持换行 */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1.5 }}
            className="max-w-2xl mx-auto text-lg text-white/80 whitespace-pre-line" // 使用 whitespace-pre-line 来处理换行符
          >
            {description}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
