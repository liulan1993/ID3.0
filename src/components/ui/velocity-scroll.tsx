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
          {/* --- 错误已通过字符串字面量修正 --- */}
          {"关键的第一步."} <br />
          {"价值远超流程本身."} <br />
          {"在一切开始之前 "}
          {/* ------------------------------------ */}
        </span>
        <span className={cn("inline-block -skew-x-[18deg] font-black", "text-foreground")}>
          {"Apex."}
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
  
  const text = "Apex是设立新加坡公司为全球战略，非流程代办。我们以顶层视角构建稳固合规的商业基石，为未来护航。";
  const textContent = ` ${text} `.repeat(5);

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
