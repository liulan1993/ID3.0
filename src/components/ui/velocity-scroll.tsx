// src/components/ui/velocity-scroll.tsx
"use client";

import React, { useRef } from 'react';
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
          Life is short. <br />
          {/* --- 错误已修正 --- */}
          Don't waste it. <br />
          It's time to{" "}
          {/* -------------------- */}
        </span>
        <span className={cn("inline-block -skew-x-[18deg] font-black", "text-foreground")}>
          SHIFT.
        </span>
      </h1>
    </div>
);
  
const VelocityScroll = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"] 
  });

  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 300
  });
  const skewVelocity = useTransform(smoothVelocity, [-1, 1], ["30deg", "-30deg"]);

  const translateX = useTransform(scrollYProgress, [0.2, 0.8], [0, -4500]); 
  
  const text = "Apex是一家总部位于新加坡的综合性专业服务机构。我们深刻理解全球高净值人士与出海企业所面临的机遇。";
  const textContent = ` ${text} `.repeat(5);

  return (
    <section 
      ref={containerRef} 
      className={cn("relative h-[400vh] md:h-[600vh] lg:h-[800vh] text-white")}
    >
      <div className="sticky top-0 left-0 right-0 h-screen overflow-hidden">
        <div className="absolute inset-0 flex flex-col md:flex-row w-full items-center justify-center md:justify-between gap-8 md:gap-0 px-4 sm:px-8 md:px-16 lg:px-24">
            <Title />
            <AnimatedTabs />
        </div>

        <motion.p
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