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
  motion
} from "framer-motion";

// --- Start of code from chuansuo.tsx ---

// 辅助函数：创建一个带有辉光效果的圆形纹理
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
};

const Starfield = ({ speed = 2, particleCount = 1500, warpSpeedActive = false, accelerationDuration = 2, maxSpeed = 50 }) => {
  const ref = useRef<THREE.Points>(null);
  const warpStartTime = useRef(0);
  const particleTexture = useMemo(() => createGlowTexture(), []);

  const [positions] = useState(() => {
    const particles = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 10;
      particles[i * 3 + 1] = (Math.random() - 0.5) * 10;
      particles[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return particles;
  });

  useEffect(() => { if (warpSpeedActive) { warpStartTime.current = Date.now(); } }, [warpSpeedActive]);

  useFrame((state, delta) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position.array as Float32Array;
      let currentSpeed;
      if (warpSpeedActive) {
        const elapsedTime = (Date.now() - warpStartTime.current) / 1000;
        const accelerationProgress = Math.min(elapsedTime / accelerationDuration, 1);
        const easedProgress = 1 - Math.pow(1 - accelerationProgress, 3);
        currentSpeed = speed + (maxSpeed - speed) * easedProgress;
      } else { currentSpeed = speed; }
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 2] += delta * currentSpeed;
        if (positions[i * 3 + 2] > 5) {
          positions[i * 3] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
          positions[i * 3 + 2] = -5;
        }
      }
      ref.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]}/></bufferGeometry>
      <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} map={particleTexture} depthWrite={false}/>
    </points>
  );
};

const TextShineEffect = ({ text, subtitle, scanDuration = 4, onClick }: { text: string; subtitle?: string; scanDuration?: number; onClick?: () => void; }) => {
  return (
    <svg width="100%" height="100%" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="select-none cursor-pointer" onClick={onClick}>
      <defs>
        <linearGradient id="textGradient"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="25%" stopColor="#3b82f6" /><stop offset="50%" stopColor="#06b6d4" /><stop offset="75%" stopColor="#ef4444" /><stop offset="100%" stopColor="#eab308" /></linearGradient>
        <motion.radialGradient id="revealMask" gradientUnits="userSpaceOnUse" r="25%" animate={{ cx: ["-25%", "125%"] }} transition={{ duration: scanDuration, ease: "linear", repeat: Infinity, repeatType: "reverse" }}><stop offset="0%" stopColor="white" /><stop offset="100%" stopColor="black" /></motion.radialGradient>
        <mask id="textMask"><rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)"/></mask>
      </defs>
      
      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="white" className="text-6xl sm:text-7xl md:text-8xl font-black">{text}</text>
      <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" fill="url(#textGradient)" mask="url(#textMask)" className="text-6xl sm:text-7xl md:text-8xl font-black">{text}</text>
      
      {subtitle && (<>
          <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" fill="white" className="text-xl sm:text-2xl md:text-3xl font-semibold">{subtitle}</text>
          <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" fill="url(#textGradient)" mask="url(#textMask)" className="text-xl sm:text-2xl md:text-3xl font-semibold">{subtitle}</text>
      </>)}
    </svg>
  );
};

interface OpeningAnimationProps { onAnimationFinish: () => void; }

const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ onAnimationFinish }) => {
  const [animationState, setAnimationState] = useState('initial');

  const handleEnter = () => {
      if (animationState === 'initial') {
          sessionStorage.setItem('hasVisitedHomePage', 'true');
          setAnimationState('textFading'); 
          setTimeout(() => { setAnimationState('warping'); }, 1500); 
          setTimeout(() => { onAnimationFinish(); }, 3000);
      }
  };

  return (
      <motion.div
          key="animation-wrapper"
          className="fixed inset-0 z-[100] bg-black"
          exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
      >
          <motion.div className="absolute inset-0 flex items-center justify-center z-10" animate={{ opacity: animationState === 'initial' || animationState === 'textFading' ? 1 : 0, scale: animationState === 'textFading' ? 0.8 : 1 }} transition={{ duration: 1.5, ease: "easeInOut" }}>
              <div className="w-full max-w-2xl px-4">
                  <TextShineEffect text="Apex" subtitle="轻触，开启非凡" scanDuration={4} onClick={handleEnter} />
              </div>
          </motion.div>
          <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: animationState === 'warping' || animationState === 'textFading' ? 1 : 0 }} transition={{ duration: 2.0, ease: "easeIn" }}>
              <Canvas camera={{ position: [0, 0, 5], fov: 75 }}><Starfield warpSpeedActive={animationState === 'warping'} /></Canvas>
          </motion.div>
      </motion.div>
  );
}
OpeningAnimation.displayName = "OpeningAnimation";

// --- End of code from chuansuo.tsx ---


// --- Start of code from page.tsx ---

// --- Scene (3D场景) 组件 ---
const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
    // 创建一个带圆角的矩形形状
    const shape = new THREE.Shape();
    const angleStep = Math.PI * 0.5;
    const radius = 1;

    shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
    shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
    shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
    shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);

    // 定义拉伸设置
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.05,
        bevelSize: 0.05,
        bevelSegments: 20,
        curveSegments: 20
    };

    // 基于形状和设置创建几何体
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // 将几何体居中

    return (
        <mesh
            geometry={geometry}
            position={position}
            rotation={rotation}
        >
            {/* 定义物理材质，使其具有金属感和反射效果 */}
            <meshPhysicalMaterial 
                color="#232323"
                metalness={1}
                roughness={0.3}
                reflectivity={0.5}
                ior={1.5}
                emissive="#000000"
                emissiveIntensity={0}
                transparent={false}
                opacity={1.0}
                transmission={0.0}
                thickness={0.5}
                clearcoat={0.0}
                clearcoatRoughness={0.0}
                sheen={0}
                sheenRoughness={1.0}
                sheenColor="#ffffff"
                specularIntensity={1.0}
                specularColor="#ffffff"
                iridescence={1}
                iridescenceIOR={1.3}
                iridescenceThicknessRange={[100, 400]}
                flatShading={false}
            />
        </mesh>
    );
};

// 动态盒子组件，包含一组旋转的Box
const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);

    // useFrame钩子在每一帧都会调用，用于更新动画
    useFrame((state, delta) => {
        if (groupRef.current) {
            // 使整组盒子缓慢旋转
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });

    // 创建一组盒子用于渲染
    const boxes = Array.from({ length: 50 }, (_, index) => ({
        position: [(index - 25) * 0.75, 0, 0] as [number, number, number],
        rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number],
        id: index
    }));

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

// 场景组件，用于设置Canvas和光照
const Scene = () => {
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

// --- End of code from page.tsx ---


// --- Merged Page Component ---
export default function Page() {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // On mount, check if the user has already seen the animation in this session.
    if (sessionStorage.getItem('hasVisitedHomePage') === 'true') {
      setShowAnimation(false);
    }
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // Callback function to be passed to the animation component.
  const handleAnimationFinish = () => {
    setShowAnimation(false);
  };

  return (
    // 主容器，设置背景渐变和全屏样式
    <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center justify-center p-8 overflow-hidden" style={{background: 'linear-gradient(to bottom right, #000, #1A2428)'}}>
      {/* Conditionally render the OpeningAnimation as an overlay. */}
      {showAnimation && <OpeningAnimation onAnimationFinish={handleAnimationFinish} />}
      
      {/* The original Scene component is always rendered underneath. */}
      <Scene />
    </div>
  );
};
