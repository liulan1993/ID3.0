"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRouter } from 'next/navigation'; // 导入 useRouter

// --- 辅助工具函数 ---
function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// --- 税务计算逻辑 ---
function calculateChinaTax(income: number): number {
  if (income <= 0) return 0;
  const brackets = [
    { threshold: 960000, rate: 0.45, deduction: 181920 },
    { threshold: 660000, rate: 0.35, deduction: 85920 },
    { threshold: 420000, rate: 0.30, deduction: 52920 },
    { threshold: 300000, rate: 0.25, deduction: 31920 },
    { threshold: 144000, rate: 0.20, deduction: 16920 },
    { threshold: 36000, rate: 0.10, deduction: 2520 },
    { threshold: 0, rate: 0.03, deduction: 0 },
  ];
  for (const bracket of brackets) {
    if (income > bracket.threshold) {
      return income * bracket.rate - bracket.deduction;
    }
  }
  return 0;
}

function calculateSingaporeTax(income: number): number {
    if (income <= 20000) return 0;
    let tax = 0;
    const brackets = [
        { cap: 20000, rate: 0, base: 0 },
        { cap: 30000, rate: 0.02, base: 0 },
        { cap: 40000, rate: 0.035, base: 200 },
        { cap: 80000, rate: 0.07, base: 550 },
        { cap: 120000, rate: 0.115, base: 3350 },
        { cap: 160000, rate: 0.15, base: 7950 },
        { cap: 200000, rate: 0.18, base: 13950 },
        { cap: 240000, rate: 0.19, base: 21150 },
        { cap: 280000, rate: 0.195, base: 28750 },
        { cap: 320000, rate: 0.20, base: 36550 },
        { cap: 500000, rate: 0.22, base: 44550 },
        { cap: 1000000, rate: 0.23, base: 199150 },
        { cap: Infinity, rate: 0.24, base: 199150 },
    ];
    for (let i = 1; i < brackets.length; i++) {
        const prevCap = brackets[i - 1].cap;
        const currentCap = brackets[i].cap;
        if (income <= currentCap) {
            tax = brackets[i-1].base + (income - prevCap) * brackets[i].rate;
            return tax;
        }
    }
    return tax;
}

// --- 个人税务计算器UI组件 ---
function TaxCalculator() {
  const [country, setCountry] = useState<'china' | 'singapore'>('china');
  const [income, setIncome] = useState<string>('');
  const [tax, setTax] = useState<number>(0);
  const router = useRouter(); // 初始化 router

  useEffect(() => {
    const incomeValue = parseFloat(income);
    if (isNaN(incomeValue) || incomeValue < 0) {
        setTax(0);
        return;
    }
    let calculatedTax = 0;
    if (country === 'china') {
      calculatedTax = calculateChinaTax(incomeValue);
    } else {
      calculatedTax = calculateSingaporeTax(incomeValue);
    }
    setTax(calculatedTax);
  }, [income, country]);

  const currency = country === 'china' ? 'CNY' : 'SGD';

  return (
    <div className="flex flex-col items-center">
        <div className="w-full max-w-lg mx-auto p-4 sm:p-6 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">个人所得税计算器</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
                <button 
                  onClick={() => setCountry('china')}
                  className={cn('px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300', country === 'china' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100')}
                >
                  中国 (China)
                </button>
                <button 
                  onClick={() => setCountry('singapore')}
                  className={cn('px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300', country === 'singapore' ? 'bg-gray-800 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100')}
                >
                  新加坡 (Singapore)
                </button>
            </div>
            <div className="relative mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {country === 'china' ? '年度应纳税所得额' : 'Chargeable Annual Income'}
                </label>
                <div className="relative">
                  <input 
                      type="number"
                      value={income}
                      onChange={(e) => setIncome(e.target.value)}
                      placeholder="在此输入年收入"
                      className="w-full px-4 py-3 pr-16 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-all placeholder-gray-500"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 font-semibold">{currency}</span>
                </div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">应纳税额 (Tax Payable)</p>
                <p className="text-3xl font-bold text-gray-800">
                  {tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-lg ml-2">{currency}</span>
                </p>
            </div>
        </div>
        {/* 修改: 使用 router.push('/') 来返回主页 */}
        <button 
            onClick={() => router.push('/')}
            className="mt-6 px-8 py-2 rounded-full text-sm font-semibold text-white bg-black/30 hover:bg-black/50 transition-all duration-300 backdrop-blur-sm"
        >
            返回主页
        </button>
    </div>
  );
}

// --- 3D背景组件 ---
const AnimatedBoxes = () => {
    const groupRef = useRef<THREE.Group>(null!);
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.x += delta * 0.05;
            groupRef.current.rotation.y += delta * 0.05;
        }
    });
    const boxes = Array.from({ length: 50 }, (_, index) => {
        const shape = new THREE.Shape();
        const angleStep = Math.PI * 0.5;
        const radius = 1;
        shape.absarc(2, 2, radius, angleStep * 0, angleStep * 1, false);
        shape.absarc(-2, 2, radius, angleStep * 1, angleStep * 2, false);
        shape.absarc(-2, -2, radius, angleStep * 2, angleStep * 3, false);
        shape.absarc(2, -2, radius, angleStep * 3, angleStep * 4, false);
        const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 20, curveSegments: 20 };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.center();
        return (
            <mesh
                key={index}
                geometry={geometry}
                position={[(index - 25) * 0.75, 0, 0]}
                rotation={[(index - 10) * 0.1, Math.PI / 2, 0]}
            >
                <meshPhysicalMaterial color="#232323" metalness={1} roughness={0.3} reflectivity={0.5} ior={1.5} iridescence={1} iridescenceIOR={1.3} iridescenceThicknessRange={[100, 400]} />
            </mesh>
        );
    });
    return <group ref={groupRef}>{boxes}</group>;
};

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

// --- 页面主组件 ---
function TaxCalculatorPage({ title = "个人税务计算器" }: { title?: string }) {
    const words = title.split(" ");
    return (
        // 修改: 移除内联样式，使用 bg-black 类实现纯黑背景
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden text-white p-4 bg-black">
            <Scene />
            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center flex flex-col items-center justify-center h-full">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl w-full mx-auto"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: wordIndex * 0.1 + letterIndex * 0.03, type: "spring", stiffness: 150, damping: 25 }}
                                        className="inline-block"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>
                </motion.div>
                <div className="w-full mt-4">
                    <TaxCalculator />
                </div>
            </div>
        </div>
    );
}

// --- 页面主入口 ---
export default function Page() {
    return <TaxCalculatorPage />;
}
