"use client";

import React, { 
    useRef, 
    useEffect, 
    useState,
    useMemo
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  motion,
  AnimatePresence,
} from "framer-motion";

// ============================================================================
// 1. 核心动画组件 (有修改)
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
        className="font-[Helvetica] text-6xl sm:text-7xl md:text-8xl font-bold"
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
        className="font-[Helvetica] text-6xl sm:text-7xl md:text-8xl font-bold"
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
            className="font-[Helvetica] text-xl sm:text-2xl md:text-3xl font-semibold"
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
            className="font-[Helvetica] text-xl sm:text-2xl md:text-3xl font-semibold"
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

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedHomePage');
    if (hasVisited) {
      setAnimationState('finished');
      setIsAnimationVisible(false);
      onAnimationFinish();
    }
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
        exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
    >
        {/* 指令2: 修复 pointerEvents 类型 Bug */}
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
    </motion.div>
  );
}
OpeningAnimation.displayName = "OpeningAnimation";


// ============================================================================
// 2. 主场景内容 (无修改)
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


// ============================================================================
// 3. 主页面组件 (逻辑修改)
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
        // 指令1: 主页背景主题色换成黑色
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
                {isClient && <MainScene />}
            </motion.main>
        </div>
    );
}
