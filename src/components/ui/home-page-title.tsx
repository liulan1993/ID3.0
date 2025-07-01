// src/components/home-page-title.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";

const HomePageTitle = () => {
    const text = "为您而来，不止于此";
    const subtitle = "融通事业与家庭，成为您最信赖的成长伙伴。";
    const overlayColor = "text-amber-400";
    const textColor = "text-black";
    const letterDelay = 0.08;
    const overlayDelay = 0.05;
    const overlayDuration = 0.4;
    const springDuration = 600;
    const letterImages = [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
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