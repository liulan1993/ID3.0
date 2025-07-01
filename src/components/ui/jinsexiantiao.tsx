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
        // 将线条颜色改为哑光金色
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
            strokeOpacity={0.1 + Math.random() * 0.15} // 稍微增加不透明度以更好地显示金色
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
              delay: Math.random() * 5, // 随机延迟，使动画错开
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// 金色线条组件
// 该组件基于原始的 BackgroundPaths 组件，但移除了特定的文本内容，
// 使其成为一个更通用的背景动画区块。
export default function JinSeXianTiao() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-transparent">
      {/* 背景浮动路径 */}
      <div className="absolute inset-0 -z-10">
        <FloatingPaths />
      </div>
    </div>
  );
}
