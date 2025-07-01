// src/components/opening-animation.tsx
"use client";

import React, {
    useRef,
    useEffect,
    useState,
    useMemo
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from "framer-motion";

// Helper function to create glow texture
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
        return new THREE.Texture();
    }

    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(200,200,255,0.3)');
    gradient.addColorStop(1, 'rgba(200,200,255,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
};

// Starfield Component
const Starfield = ({
  speed = 1,
  particleCount = 2000,
  warpSpeedActive = false,
  accelerationDuration = 1.5,
  maxSpeed = 40,
}: {
  speed?: number;
  particleCount?: number;
  warpSpeedActive?: boolean;
  accelerationDuration?: number;
  maxSpeed?: number;
}) => {
  const ref = useRef<THREE.Points>(null);
  const warpStartTime = useRef(0);
  const glowTexture = useMemo(() => createGlowTexture(), []);
  const positions = useMemo(() => {
    const particles = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 15;
      particles[i * 3 + 1] = (Math.random() - 0.5) * 15;
      particles[i * 3 + 2] = (Math.random() - 1) * 10;
    }
    return particles;
  }, [particleCount]);

  useEffect(() => {
    if (warpSpeedActive) {
      warpStartTime.current = Date.now();
    }
  }, [warpSpeedActive]);

  useFrame((state, delta) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      
      let currentSpeed;
      if (warpSpeedActive) {
        const elapsedTime = (Date.now() - warpStartTime.current) / 1000;
        const accelerationProgress = Math.min(elapsedTime / accelerationDuration, 1);
        const easedProgress = 1 - Math.pow(1 - accelerationProgress, 3); 
        currentSpeed = speed + (maxSpeed - speed) * easedProgress;
      } else {
        currentSpeed = speed;
      }

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] += delta * currentSpeed;

        if (positions[i * 3 + 2] > 5) {
          positions[i * 3] = (Math.random() - 0.5) * 15;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
          positions[i * 3 + 2] = -10;
        }
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture}
        size={0.15}
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
Starfield.displayName = "Starfield";

// TextShineEffect Component
const TextShineEffect = ({
  text,
  subtitle,
  scanDuration = 4,
  onClick
}: {
  text: string;
  subtitle?: string;
  scanDuration?: number;
  onClick?: () => void;
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 400 200"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none cursor-pointer"
      onClick={onClick}
    >
      <defs>
        <linearGradient id="textGradient">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="25%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="75%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="25%"
          animate={{ cx: ["-25%", "125%"] }}
          transition={{
            duration: scanDuration,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>

      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        className="font-black text-6xl sm:text-7xl md:text-8xl"
      >
        {text}
      </text>
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="url(#textGradient)"
        mask="url(#textMask)"
        className="font-black text-6xl sm:text-7xl md:text-8xl"
      >
        {text}
      </text>

      {subtitle && (
        <>
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            className="font-black text-xl sm:text-2xl md:text-3xl"
          >
            {subtitle}
          </text>
          <text
            x="50%"
            y="70%"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="url(#textGradient)"
            mask="url(#textMask)"
            className="font-black text-xl sm:text-2xl md:text-3xl"
          >
            {subtitle}
          </text>
        </>
      )}
    </svg>
  );
};
TextShineEffect.displayName = "TextShineEffect";

// Main OpeningAnimation Component
const OpeningAnimation = ({ onAnimationFinish }: { onAnimationFinish: () => void; }) => {
  const [animationState, setAnimationState] = useState('initial');
  const [isAnimationVisible, setIsAnimationVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => setIsReady(true), 100);
    const hasVisited = sessionStorage.getItem('hasVisitedHomePage');
    if (hasVisited) {
      setAnimationState('finished');
      setIsAnimationVisible(false);
      onAnimationFinish();
    }
    return () => clearTimeout(readyTimer);
  }, [onAnimationFinish]);

  const handleEnter = () => {
      if (animationState === 'initial') {
          sessionStorage.setItem('hasVisitedHomePage', 'true');
          setAnimationState('warping'); 
          
          setTimeout(() => {
              onAnimationFinish();
              setIsAnimationVisible(false); 
          }, 1500); 
      }
  };
  
  if (!isAnimationVisible) {
      return null;
  }

  return (
    <motion.div
        key="animation-wrapper"
        className="fixed inset-0 z-[100] bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: isReady ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
    >
       {isReady && <>
            <motion.div
                className={`absolute inset-0 flex items-center justify-center z-20 ${animationState === 'initial' ? 'pointer-events-auto' : 'pointer-events-none'}`}
                animate={{
                    opacity: animationState === 'initial' ? 1 : 0,
                    scale: animationState === 'warping' ? 0.8 : 1,
                }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                <div className="w-full max-w-2xl px-4">
                    <TextShineEffect 
                        text="Apex" 
                        subtitle="轻触 ，开启非凡"
                        scanDuration={4} 
                        onClick={handleEnter} 
                    />
                </div>
            </motion.div>
            
            <div
                className="absolute inset-0 z-10 pointer-events-none"
            >
                <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
                    <Starfield 
                        warpSpeedActive={animationState === 'warping'} 
                        accelerationDuration={1.5} 
                    />
                </Canvas>
            </div>
       </>}
    </motion.div>
  );
}
OpeningAnimation.displayName = "OpeningAnimation";

export default OpeningAnimation;