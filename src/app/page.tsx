"use client";

import React, { 
    useRef, 
    useEffect, 
    useState,
    useMemo
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  AnimatePresence,
  useScroll, 
  useTransform, 
  useVelocity, 
  useSpring
} from "framer-motion";
import { Transition } from "@headlessui/react";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Slot } from "@radix-ui/react-slot"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";


// ============================================================================
// 辅助函数 (新增)
// ============================================================================
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// 1. 开场动画组件 (无修改)
// ============================================================================

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


const Starfield = ({
  speed = 1,
  particleCount = 2000,
  warpSpeedActive = false,
  accelerationDuration = 1.5,
  maxSpeed = 40,
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
                        subtitle="轻触，开启非凡"
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


// ============================================================================
// 2. 主场景组件 (无修改)
// ============================================================================

const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const angleStep = Math.PI * 0.5;
        const radius = 1;
        s.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
        s.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
        s.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
        s.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);
        return s;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    }), []);

    const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, extrudeSettings), [shape, extrudeSettings]);
    
    useEffect(() => {
        geometry.center();
        return () => {
            geometry.dispose();
        }
    }, [geometry]);

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            <meshPhysicalMaterial 
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
            />
        </mesh>
    );
};

const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    const boxes = useMemo(() => Array.from({ length: 50 }, (_, index) => ({
        position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
        rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number],
        id: index
    })), []);

    return (
        <group ref={groupRef}>
            {boxes.map((box) => (
                <Box
                    key={box.id}
                    position={box.position}
                    rotation={box.rotation}
                />
            ))}
        </group>
    );
};

const MainScene = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}>
                <ambientLight intensity={15} />
                <directionalLight position={[10, 10, 5]} intensity={15} />
                <AnimatedBoxes />
            </Canvas>
        </div>
    );
};

const HomePageTitle = () => {
    const text = "为您而来，不止于此";
    const subtitle = "次世代实时渲染引擎";
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
        <div className="flex flex-col items-center justify-center relative select-none">
            <div className="flex">
              {text.split("").map((letter, index) => (
                <motion.span
                  key={index}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="font-black tracking-tight cursor-pointer relative overflow-hidden text-5xl md:text-8xl lg:text-9xl"
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
              className="text-lg md:text-2xl text-white mt-4 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: isAnimated ? 1 : 0 }}
              transition={{ duration: 1.0, ease: "easeInOut"}}
            >
              {subtitle}
            </motion.p>
        </div>
    );
};

interface Testimonial {
  img: string;
  quote: string;
  role: string;
}

const testimonialsData: Testimonial[] = [
    {
      img: '',
      quote: "这个引擎的渲染效果令人惊叹，极大地提升了我们项目的视觉品质。",
      role: '首席美术师',
    },
    {
      img: '',
      quote: "无与伦比的性能和稳定性，让开发过程如丝般顺滑。",
      role: '技术总监',
    },
    {
      img: '',
      quote: "工具链非常完善且易于上手，文档清晰，节省了大量的学习成本。",
      role: '独立开发者',
    },
];

const Testimonials = () => {
  const [active, setActive] = useState<number>(0);
  const [autorotate, setAutorotate] = useState<boolean>(true);
  const autorotateTiming: number = 7000;

  useEffect(() => {
    if (!autorotate) return;
    const interval = setInterval(() => {
      setActive(
        active + 1 === testimonialsData.length ? 0 : (active) => active + 1,
      );
    }, autorotateTiming);
    return () => clearInterval(interval);
  }, [active, autorotate]);

  return (
    <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
      <div className="mb-8">
        <div className="relative w-28 h-28 flex items-center justify-center">
             <motion.div
                className="absolute w-full h-full rounded-full border-2 border-amber-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
            />
            <div className="absolute w-24 h-24 rounded-full border-2 border-amber-600/50"></div>
            <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
                <div className="absolute w-24 h-24 rounded-full"
                     style={{
                        background: 'conic-gradient(from 0deg, transparent 0% 70%, #FDE68A 95%, transparent 100%)'
                     }}
                ></div>
            </motion.div>
            <div className="absolute w-20 h-20 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.5)]"></div>
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 animate-pulse"></div>
        </div>
      </div>
      <div className="mb-5 w-full">
        <div className="relative grid min-h-[6rem] items-center">
          {testimonialsData.map((testimonial, index) => (
            <Transition
              as="div"
              key={index}
              show={active === index}
              className="[grid-area:1/1]"
              enter="transition ease-in-out duration-500 delay-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="text-lg md:text-2xl text-slate-200 px-4">
                {testimonial.quote}
              </div>
            </Transition>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center">
        {testimonialsData.map((testimonial, index) => (
          <button
            key={index}
            className={`m-2 px-6 py-2 rounded-full text-base font-medium transition-all duration-300 focus-visible:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-sky-500 ${
              active === index
                ? "bg-white text-black shadow-md"
                : "bg-transparent text-white hover:bg-white hover:text-black"
            }`}
            onClick={() => {
              setActive(index);
              setAutorotate(false);
            }}
          >
            <span>{testimonial.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 3. 第二页组件 (已修改)
// ============================================================================

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const defaultTabs: Tab[] = [
  {
    id: "tab1",
    label: "教育留学板块",
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1493552152660-f915ab47ae9d?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 1"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Tab 1
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab2",
    label: "Tab 2",
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 2"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Tab 2
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab3",
    label: "Tab 3",
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 2"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Tab 3
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab4",
    label: "Tab 4",
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 2"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Tab 4
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab5",
    label: "Tab 5",
    content: (
      <div className="grid grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 5"
          className="rounded-lg w-full h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-2xl font-bold mb-0 text-white mt-0 !m-0">
            Tab 5
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam,
            quos.
          </p>
        </div>
      </div>
    ),
  },
];

const AnimatedTabs = ({
  tabs = defaultTabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full max-w-lg flex flex-col gap-y-1", className)}>
      <div className="flex gap-2 flex-wrap bg-[#11111198] bg-opacity-50 backdrop-blur-sm p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-3 py-1.5 text-sm font-medium rounded-lg text-white outline-none transition-colors"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[#111111d1] bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm !rounded-lg"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="p-4 bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] text-white bg-opacity-50 backdrop-blur-sm rounded-xl border min-h-60 h-full">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{
                  opacity: 0,
                  scale: 0.95,
                  x: -10,
                  filter: "blur(10px)",
                }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, x: -10, filter: "blur(10px)" }}
                transition={{
                  duration: 0.5,
                  ease: "circInOut",
                  type: "spring",
                }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
};

const Header = () => null;

const Title = () => (
    <div className="px-4"> 
      <h1 className="text-left text-3xl font-bold sm:text-5xl md:text-7xl">
        <span className="text-muted-foreground">
          Life is short. <br />
          Don&apos;t waste it. <br />
          It&apos;s time to{" "}
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
      className={cn("relative h-[800vh] text-white")}
    >
      <div className="sticky top-0 left-0 right-0 h-screen overflow-hidden">
        {/* 指令修改: 移除这里的 MainScene */}
        <Header />
        
        <div className="absolute inset-0 flex w-full items-center justify-between px-8 md:px-16 lg:px-24">
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
            "origin-bottom-left whitespace-nowrap text-7xl font-black uppercase leading-[0.85] md:text-9xl md:leading-[0.85]",
            "text-white"
          )}
        >
          {textContent}
        </motion.p>
      </div>
    </section>
  );
};

// ============================================================================
// 4. 页脚组件 (新增)
// ============================================================================

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"


export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"


const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName


function StackedCircularFooter() {
  return (
    <footer className="bg-transparent py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          
          <div className="mb-8 flex h-[400px] w-[400px] flex-col items-center justify-center rounded-lg p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">官方公众号</h2>
            <div className="flex-grow flex items-center justify-center">
                <Image 
                  src="https://zh.apex-elite-service.com/wenjian/weixingongzhonghao.png" 
                  alt="官方公众号二维码" 
                  width={300} 
                  height={300}
                  className="rounded-md"
                />
            </div>
          </div>

          <nav className="mb-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/" className="text-gray-400 hover:text-white">Apex</Link>
            <Link href="/about" className="text-gray-400 hover:text-white">留学</Link>
            <Link href="/projects" className="text-gray-400 hover:text-white">医疗</Link>
            <Link href="/services" className="text-gray-400 hover:text-white">企业服务</Link>
            <Link href="/contact" className="text-gray-400 hover:text-white">敬请期待</Link>
          </nav>
          
          <div className="mb-8 flex space-x-4">
            <Button variant="outline" size="icon" className="rounded-full bg-transparent text-gray-400 hover:bg-white/10 hover:text-white border-gray-600">
              <Facebook className="h-4 w-4" />
              <span className="sr-only">Facebook</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent text-gray-400 hover:bg-white/10 hover:text-white border-gray-600">
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent text-gray-400 hover:bg-white/10 hover:text-white border-gray-600">
              <Instagram className="h-4 w-4" />
              <span className="sr-only">Instagram</span>
            </Button>
            <Button variant="outline" size="icon" className="rounded-full bg-transparent text-gray-400 hover:bg-white/10 hover:text-white border-gray-600">
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Button>
          </div>
          
          <div className="mb-8 w-full max-w-md">
            <form className="flex space-x-2">
              <div className="flex-grow">
                <Label htmlFor="email" className="sr-only">Email</Label>
                <Input 
                  id="email" 
                  placeholder="输入您的邮箱" 
                  type="email" 
                  className="rounded-full bg-black/50 border-gray-600 text-white placeholder-gray-400 focus:ring-white" 
                />
              </div>
              <Button type="submit" className="rounded-full bg-white text-black hover:bg-gray-200">提交</Button>
            </form>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 Your Company. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// 5. 主页面组件 (已修改)
// ============================================================================

export default function Page() {
    const [mainContentVisible, setMainContentVisible] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (sessionStorage.getItem('hasVisitedHomePage')) {
            setMainContentVisible(true);
        }
    }, []);

    const handleAnimationFinish = () => {
        setMainContentVisible(true);
    };

    return (
        <div className="relative w-full bg-black text-white">
            <AnimatePresence>
                {isClient && !mainContentVisible &&
                    <OpeningAnimation onAnimationFinish={handleAnimationFinish} />
                }
            </AnimatePresence>
            
            <motion.div 
                className="relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: mainContentVisible ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {isClient && (
                    <>
                        {/* Layer 1: Fixed Background */}
                        <div className="fixed inset-0 z-0">
                           <MainScene />
                        </div>

                        {/* Layer 2: Scrollable Content */}
                        <div className="relative z-10">
                            {/* Section 1: Initial Viewport */}
                            <div className='relative w-full h-screen'>
                                <div className="absolute inset-0 grid grid-rows-[50vh_50vh] pointer-events-auto">
                                    <div className="flex items-end justify-center pb-8">
                                        <HomePageTitle />
                                    </div>
                                    <div className="flex items-start justify-center pt-8">
                                        <Testimonials />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Section 2: Velocity Scroll part */}
                            <VelocityScroll />

                            {/* Section 3: Footer */}
                            <StackedCircularFooter />
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    )；
}