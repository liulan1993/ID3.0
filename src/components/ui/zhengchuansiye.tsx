"use client";

import React, { useRef, createContext, useContext, forwardRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  MotionValue,
} from 'framer-motion';

// 辅助函数：用于条件性地合并 CSS 类名
const cn = (...inputs: any[]) => {
  return inputs.filter(Boolean).join(' ');
};

// --- 类型定义 ---
interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}

// --- 核心滚动和动画组件 ---

const ContainerScrollContext = createContext<ContainerScrollContextValue | undefined>(undefined);

function useContainerScrollContext() {
  const context = useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext 必须在 ContainerScroll 组件内部使用"
    );
  }
  return context;
}

const ContainerScroll: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"],
  });

  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative w-full", className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};
ContainerScroll.displayName = "ContainerScroll";

const ContainerSticky = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("sticky top-0 h-screen w-full overflow-hidden", className)}
        {...props}
      />
    );
  }
);
ContainerSticky.displayName = "ContainerSticky";

// --- 页面组件 ---

const HeroPage = () => {
  const rows = new Array(150).fill(1);
  const cols = new Array(100).fill(1);
  const colors = [
    "rgb(125 211 252)", "rgb(249 168 212)", "rgb(134 239 172)",
    "rgb(253 224 71)", "rgb(252 165 165)", "rgb(216 180 254)",
    "rgb(147 197 253)", "rgb(165 180 252)", "rgb(196 181 253)",
  ];
  const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-transparent">
       <div
          style={{
            transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
          }}
          className="absolute left-1/4 top-1/4 -z-10 flex h-full w-full -translate-x-1/2 -translate-y-1/2 p-4"
        >
          {rows.map((_, i) => (
            <motion.div key={`row` + i} className="relative h-8 w-16 border-l border-slate-700">
              {cols.map((_, j) => (
                <motion.div
                  whileHover={{ backgroundColor: getRandomColor(), transition: { duration: 0 } }}
                  animate={{ transition: { duration: 2 } }}
                  key={`col` + j}
                  className="relative h-8 w-16 border-r border-t border-slate-700"
                >
                  {j % 2 === 0 && i % 2 === 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="pointer-events-none absolute -left-[22px] -top-[14px] h-6 w-10 stroke-[1px] text-slate-700">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6"/>
                    </svg>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      <div className="pointer-events-none absolute inset-0 z-20 h-full w-full bg-slate-900 [mask-image:radial-gradient(transparent,white)]" />
      <h1 className={cn("relative z-20 text-4xl text-white md:text-6xl")}>探索动态背景</h1>
      <p className="relative z-20 mt-2 text-center text-neutral-300">这是一个由 Framer Motion 驱动的交互式背景。</p>
    </div>
  );
};

const ThirdPage = () => (
    <div className="flex h-full w-full items-center justify-center bg-transparent text-white">
         <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">旅程的下一站</h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">您已成功穿越第二个层面，继续前进！</p>
        </div>
    </div>
);

const FourthPage = () => (
    <div className="flex h-full w-full items-center justify-center bg-transparent text-white">
         <div className="mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">抵达终点</h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">恭喜！您已完成整个滚动动画旅程。</p>
        </div>
    </div>
);

// --- 页面内容组合与动画逻辑 ---
const Content = () => {
  const { scrollYProgress } = useContainerScrollContext();

  // 将滚动进度分为三个主要阶段
  const firstPart = useTransform(scrollYProgress, [0, 1/3], [0, 1]);
  const secondPart = useTransform(scrollYProgress, [1/3, 2/3], [0, 1]);
  const thirdPart = useTransform(scrollYProgress, [2/3, 1], [0, 1]);

  // --- 统一的动画参数 ---
  const HOLE_CLIP_PATH = "inset(40% 40% 40% 40% round 1000px)";
  const FULL_CLIP_PATH = "inset(0% 0% 0% 0% round 0px)";
  const SCALE_RANGE = [0.8, 1];
  const TRANSITION_RANGE = [0, 0.8];

  // --- 动画逻辑重构 ---

  // Page 1 -> Page 2 Transition
  const page1ClipPath = useTransform(firstPart, TRANSITION_RANGE, [FULL_CLIP_PATH, HOLE_CLIP_PATH]);
  const page1Opacity = useTransform(firstPart, [0.8, 1], [1, 0]);
  const page2Scale = useTransform(firstPart, TRANSITION_RANGE, SCALE_RANGE);

  // Page 2 -> Page 3 Transition
  const page2ClipPath = useTransform(secondPart, TRANSITION_RANGE, [FULL_CLIP_PATH, HOLE_CLIP_PATH]);
  const page2Opacity = useTransform(secondPart, [0.8, 1], [1, 0]);
  const page3Scale = useTransform(secondPart, TRANSITION_RANGE, SCALE_RANGE);
  
  // Page 3 -> Page 4 Transition
  const page3ClipPath = useTransform(thirdPart, TRANSITION_RANGE, [FULL_CLIP_PATH, HOLE_CLIP_PATH]);
  const page3Opacity = useTransform(thirdPart, [0.8, 1], [1, 0]);
  const page4Scale = useTransform(thirdPart, TRANSITION_RANGE, SCALE_RANGE);


  return (
    <div className="relative h-screen w-screen">
      {/* 第四页: 在最底层 (z-0) */}
      <motion.div
        className="absolute inset-0 z-0 flex h-screen w-screen items-center justify-center"
        style={{ 
            background: 'linear-gradient(135deg, #1e3a8a, #4c1d95)'
        }}
      >
        <motion.div className="h-full w-full" style={{ scale: page4Scale }}>
            <FourthPage />
        </motion.div>
      </motion.div>

      {/* 第三页: 在 z-10 */}
      <motion.div
        className="absolute inset-0 z-10 h-full w-full bg-neutral-950"
        style={{
          clipPath: page3ClipPath,
          opacity: page3Opacity,
        }}
      >
        <motion.div className="h-full w-full" style={{ scale: page3Scale }}>
          <ThirdPage />
        </motion.div>
      </motion.div>

      {/* 第二页: 在 z-20 */}
      <motion.div
        className="absolute inset-0 z-20 h-full w-full bg-slate-900"
        style={{
          clipPath: page2ClipPath,
          opacity: page2Opacity,
        }}
      >
        <motion.div className="h-full w-full" style={{ scale: page2Scale }}>
          <HeroPage />
        </motion.div>
      </motion.div>

      {/* 第一页: 在最顶层 (z-30) */}
      <motion.div
        className="absolute inset-0 z-30 h-full w-full"
        style={{
          clipPath: page1ClipPath,
          opacity: page1Opacity,
        }}
      >
        <div 
          className="flex h-full w-full flex-col items-center justify-center text-center"
          style={{
            background: "radial-gradient(circle at 50% 50%, #0e19ae, #030526)",
          }}
        >
          <div className="space-y-4 text-white">
            <h1 className="text-5xl font-medium tracking-tighter md:text-6xl">Scroll & Roll</h1>
            <p className="mx-auto max-w-[42ch] opacity-80">向下滚动以穿透此层并查看下一页。</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


// --- 主应用组件 ---
export default function Zhengchuansiye() {
  return (
    <main className="bg-transparent">
      <ContainerScroll className="h-[600vh]">
        <ContainerSticky>
          <Content />
        </ContainerSticky>
      </ContainerScroll>
    </main>
  );
}
