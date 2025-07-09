// src/components/home-page-title.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";

const HomePageTitle = () => {
    const text = "为您而来，不止于此";
    const subtitle = "融汇全球洞察，为您成就事业与家庭的非凡格局。";
    const overlayColor = "text-amber-400";
    const textColor = "text-black";
    const letterDelay = 0.08;
    const overlayDelay = 0.05;
    const overlayDuration = 0.4;
    const springDuration = 600;
    const letterImages = [
      "https://zh.apex-elite-service.com/wenjian/20250708-1.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-2.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-3.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-4.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-5.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-6.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-7.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-8.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-9.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-10.jpg",
      "https://zh.apex-elite-service.com/wenjian/20250708-11.jpg",
    ];
  
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [showOverlay, setShowOverlay] = useState(false);
    const [isAnimated, setIsAnimated] = useState(false);
  
    useEffect(() => {
      const lastLetterDelay = (text.length - 1) * letterDelay;
      const totalDelay = (lastLetterDelay * 1000) + springDuration;
      
      const timer = setTimeout(() => {
        setShowOverlay(true);
        setIsAnimated(true);
      }, totalDelay);
      
      return () => clearTimeout(timer);
    }, [text.length, letterDelay, springDuration]);
  
    return (
        <div className="flex flex-col items-center justify-center relative select-none px-4">
            <div className="flex">
              {text.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="font-black tracking-tight cursor-pointer relative overflow-hidden text-4xl sm:text-5xl md:text-8xl lg:text-9xl"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    delay: index * letterDelay,
                    type: "spring",
                    damping: 8,
                    stiffness: 200,
                    mass: 0.8,
                  }}
                >
                  <motion.span 
                    className={`absolute inset-0 text-white`}
                    animate={{ opacity: hoveredIndex === index ? 0 : 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                  
                  <motion.span
                    className="text-transparent bg-clip-text bg-cover bg-no-repeat"
                    animate={{ 
                      opacity: hoveredIndex === index ? 1 : 0,
                      backgroundPosition: hoveredIndex === index ? "10% center" : "0% center"
                    }}
                    transition={{ 
                      opacity: { duration: 0.1 },
                      backgroundPosition: { duration: 3, ease: "easeInOut" }
                    }}
                    style={{
                      backgroundImage: `url('${letterImages[index % letterImages.length]}')`,
                      WebkitBackgroundClip: "text",
                      color: "transparent", 
                    }}
                  >
                    {letter === " " ? "\u00A0" : letter}
                  </motion.span>
                  
                  {showOverlay && (
                    <motion.span
                      className={`absolute inset-0 ${textColor} pointer-events-none`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 1, 0] }}
                      transition={{
                        delay: index * overlayDelay,
                        duration: overlayDuration,
                        times: [0, 0.1, 0.7, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 5
                      }}
                    >
                      <span className={`${overlayColor}`}>{letter === " " ? "\u00A0" : letter}</span>
                    </motion.span>
                  )}
                </motion.span>
              ))}
            </div>

            <motion.p 
              className="text-base sm:text-lg md:text-2xl text-white mt-4 tracking-widest text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: isAnimated ? 1 : 0 }}
              transition={{ duration: 1.0, ease: "easeInOut"}}
            >
              {subtitle}
            </motion.p>
        </div>
    );
};

export default HomePageTitle;