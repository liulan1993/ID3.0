// src/components/ui/velocity-scroll.tsx
"use client";

import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useVelocity,
  useSpring
} from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedTabs from './animated-tabs';

const Title = () => (
    <div className="px-4 text-center md:text-left">
      <h1 className="text-4xl font-bold sm:text-5xl md:text-7xl">
        <span className="text-muted-foreground">
          {/* --- 错误已通过字符串字面量修正 --- */}
          {"关键的第一步."} <br />
          {"价值远超流程本身."} <br />
          {"在一切开始之前 "}
          {/* ------------------------------------ */}
        </span>
        {/* 指令 1: 修改这个代码中Apex，在手机端的字体也要是亮白色。 */}
        <span className={cn("inline-block -skew-x-[18deg] font-black", "text-white")}>
          {"Apex."}
        </span>
      </h1>
    </div>
);

const VelocityScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null); // 为滚动文本创建 ref
  const [textWidth, setTextWidth] = useState(0); // 用于存储文本宽度的 state

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // 指令 2: 手机端最下面那一行字滚动的长度太长了。要保持和电脑端一致，只能滚动完一句话。并前后都留有20%的空白滚动容量。
  // 使用 useEffect 动态测量文本宽度，以实现响应式滚动
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const measureWidth = () => {
        // 使用 scrollWidth 来获取包括溢出部分在内的完整内容宽度
        setTextWidth(el.scrollWidth);
    };

    measureWidth(); // 组件挂载后进行初次测量
    window.addEventListener('resize', measureWidth); // 在窗口大小变化时重新测量

    // 组件卸载时移除事件监听器
    return () => {
        window.removeEventListener('resize', measureWidth);
    };
  }, []); // 空依赖数组确保此 effect 仅在挂载时运行一次

  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 300
  });
  const skewVelocity = useTransform(smoothVelocity, [-1, 1], ["30deg", "-30deg"]);

  // 使用动态测量的宽度来计算滚动的距离
  // 因为文本内容重复了两次，所以我们滚动总宽度的一半，以实现滚动一个句子长度的效果
  const translateX = useTransform(scrollYProgress, [0.2, 0.8], [0, -textWidth / 2]);

  const text = "Apex是设立新加坡公司为全球战略，非流程代办。我们以顶层视角构建稳固合规的商业基石，为未来护航。";
  // 将文本重复两次，这是创建无缝滚动效果的标准技巧
  const textContent = ` ${text} `.repeat(2);

  return (
    <section
      ref={containerRef}
      className={cn("relative h-[400vh] md:h-[600vh] lg:h-[800vh] text-white")}
    >
      <div className="sticky top-0 left-0 right-0 h-screen overflow-hidden">
        <div className="absolute inset-0 flex flex-col md:flex-row w-full items-center justify-center gap-8 md:gap-16 px-4 sm:px-8 md:px-16 lg:px-24">
            <Title />
            <AnimatedTabs />
        </div>

        <motion.p
          ref={textRef} // 将 ref 附加到 p 元素
          style={{
            x: translateX,
            skewX: skewVelocity,
          }}
          className={cn(
            "absolute bottom-0 left-0",
            "origin-bottom-left whitespace-nowrap text-5xl sm:text-7xl font-black uppercase leading-[0.85] md:text-9xl md:leading-[0.85]",
            "text-white"
          )}
        >
          {textContent}
        </motion.p>
      </div>
    </section>
  );
};

export default VelocityScroll;
