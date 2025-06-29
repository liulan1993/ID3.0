"use client";

import React, { 
    useRef, 
    useEffect, 
    useState,
    useMemo
} from 'react';
import Image from "next/image"; // 为 testimonials 组件添加
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  AnimatePresence,
} from "framer-motion";
import { Transition } from "@headlessui/react"; // 为 testimonials 组件添加

// ============================================================================
// 1. 开场动画组件 (已按要求修改)
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
  const [isReady, setIsReady] = useState(false); // 修复卡顿：添加就绪状态

  useEffect(() => {
    // 修复卡顿：延迟显示以等待资源加载
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
        animate={{ opacity: isReady ? 1 : 0 }} // 修复卡顿：准备好后淡入
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

// 首页标题组件 (无修改)
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
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // A
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // P
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // E
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // X
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // ，
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // E
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // N
      "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // G
      "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // I
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", // N
      "https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"  // E
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

// 用户评价组件 (已按要求修改)
interface Testimonial {
  img: string;
  quote: string;
  role: string;
}

const testimonialsData: Testimonial[] = [
    {
      img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      quote: "这个引擎的",
      role: '首席美术师',
    },
    {
      img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      quote: "无与伦比的性",
      role: '技术总监',
    },
    {
      img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      quote: "工具链非常",
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
    <div className="w-full max-w-3xl mx-auto text-center">
      <div className="relative h-28">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[480px] pointer-events-none">
          <div className="h-40 [mask-image:_linear-gradient(0deg,transparent,theme(colors.white)_20%,theme(colors.white))]">
            {testimonialsData.map((testimonial, index) => (
              <Transition
                as="div"
                key={index}
                show={active === index}
                className="absolute inset-0 -z-10 h-full"
                enter="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700 order-first"
                enterFrom="opacity-0 -rotate-[60deg]"
                enterTo="opacity-100 rotate-0"
                leave="transition ease-[cubic-bezier(0.68,-0.3,0.32,1)] duration-700"
                leaveFrom="opacity-100 rotate-0"
                leaveTo="opacity-0 rotate-[60deg]"
              >
                <Image
                  className="relative left-1/2 top-8 -translate-x-1/2 rounded-full"
                  src={testimonial.img}
                  width={80}
                  height={80}
                  alt={testimonial.role}
                />
              </Transition>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-5">
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
              <div className="text-xl text-slate-200">
                {testimonial.quote}
              </div>
            </Transition>
          ))}
        </div>
      </div>
      {/* 指令1: 修改字体大小和格式 */}
      <div className="flex flex-wrap justify-center">
        {testimonialsData.map((testimonial, index) => (
          <button
            key={index}
            className={`m-4 cursor-pointer text-xl transition-colors duration-150 focus-visible:outline-none ${
              active === index
                ? "text-white"
                : "text-slate-500 hover:text-white"
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
// 3. 主页面组件 (无修改)
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
        <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center overflow-hidden">
            
            <AnimatePresence>
                {isClient && !mainContentVisible &&
                    <OpeningAnimation onAnimationFinish={handleAnimationFinish} />
                }
            </AnimatePresence>
            
            <motion.main 
                className="absolute inset-0 z-0 w-full h-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: mainContentVisible ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {isClient && (
                    <div className='relative w-full h-full'>
                        <MainScene />
                        <div className="absolute inset-0 z-10 grid grid-rows-[50vh_50vh] pointer-events-auto">
                            <div className="flex items-end justify-center pb-8">
                                <HomePageTitle />
                            </div>
                            <div className="flex items-start justify-center pt-8">
                                <Testimonials />
                            </div>
                        </div>
                    </div>
                )}
            </motion.main>
        </div>
    );
}
