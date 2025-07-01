// 文件路径: src/app/my/apply/page.tsx

"use client";

import React, { useState, useMemo, useRef, FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Briefcase, HeartPulse, User, ArrowLeft, Send, LogOut, Loader, type LucideProps } from 'lucide-react';

// --- 类型定义 ---
type ServiceCategory = '留学教育' | '企业服务' | '医疗健康' | '个人咨询';

// 用户信息接口，基于您的 login API
interface User {
  username: string;
  email: string;
}

// --- 3D背景动画组件 (复用自 my/page.tsx 以保持风格统一) ---
const AnimatedBoxes = React.memo(() => {
    const groupRef = useRef<THREE.Group>(null!);
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const numBoxes = 50;
    const dummy = useMemo(() => new THREE.Object3D(), []);

    const [geometry, material] = useMemo(() => {
        const shape = new THREE.Shape();
        const r = 0.8;
        shape.absarc(0, 0, r, 0, Math.PI * 2, false);
        const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        const mat = new THREE.MeshPhysicalMaterial({ color: "#222222", metalness: 1, roughness: 0.2, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [100, 600] });
        return [geom, mat];
    }, []);

    useEffect(() => {
        if (!meshRef.current) return;
        let i = 0;
        for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) for (let z = 0; z < 2; z++) {
            dummy.position.set(5 - x * 2, 5 - y * 2, -5 + z * 5);
            dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i++, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    }, [dummy]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05;
            groupRef.current.rotation.x += delta * 0.02;
        }
    });

    return <group ref={groupRef}><instancedMesh ref={meshRef} args={[geometry, material, numBoxes]} /></group>;
});
AnimatedBoxes.displayName = "AnimatedBoxes";

const Scene = React.memo(() => (
    <div className="absolute inset-0 w-full h-full z-0 opacity-50">
        <Canvas camera={{ position: [0, 0, 18], fov: 35 }}>
            <ambientLight intensity={10} />
            <directionalLight position={[15, 15, 15]} intensity={10} />
            <AnimatedBoxes />
        </Canvas>
    </div>
));
Scene.displayName = "Scene";


// --- 头部导航栏组件 ---
const Header: FC<{ user: User | null; onBack: () => void; onLogout: () => void; }> = ({ user, onBack, onLogout }) => (
    <header className="w-full z-10 absolute top-0 left-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20 border-b border-gray-500/20">
                <h1 className="text-3xl font-bold text-white">Apex</h1>
                <div className="flex items-center gap-4">
                     {user && (
                        <span className="text-gray-300 hidden sm:block">欢迎, {user.username}</span>
                    )}
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline">返回</span>
                    </button>
                    {user && (
                        <button onClick={onLogout} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                            <LogOut size={18} />
                            <span className="hidden sm:inline">退出</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    </header>
);

// --- 光球和文本框组件 ---
const ApplicationStatus: FC = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-8 mt-16">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                className="relative w-32 h-32 md:w-40 md:h-40"
            >
                {/* 哑光金球体 */}
                <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg"></div>
                
                {/* 辉光效果 */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                        boxShadow: '0 0 40px 10px #f59e0b, 0 0 80px 30px #b45309'
                    }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* 闪光效果 */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-full">
                    <motion.div
                        className="absolute -top-1/4 -left-full w-1/2 h-[150%] bg-white/40"
                        style={{
                            transform: 'rotate(35deg)',
                            filter: 'blur(30px)',
                        }}
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="p-6 bg-black/30 backdrop-blur-md border border-gray-500/20 rounded-xl text-center"
            >
                <h3 className="text-xl font-semibold text-cyan-300">申请已提交</h3>
                <p className="text-gray-300 mt-2 max-w-sm">
                    我们已收到您的申请请求。处理过程通常需要3-5个工作日。请您耐心等待，我们的顾问会尽快通过邮件与您联系。
                </p>
            </motion.div>
        </div>
    );
};


// --- 主页面组件 ---
export default function ApplyPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setUser(null);
        router.push('/');
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');
        
        if (token && userInfo) {
            try {
                const parsedUser = JSON.parse(userInfo);
                setUser(parsedUser);
            } catch (e) {
                console.error("解析用户信息失败:", e);
                handleLogout();
            }
        } else {
            router.push('/');
        }
    }, [router]);

    const services: { name: ServiceCategory; icon: React.FC<LucideProps> }[] = [
        { name: '留学教育', icon: School },
        { name: '企业服务', icon: Briefcase },
        { name: '医疗健康', icon: HeartPulse },
        { name: '个人咨询', icon: User },
    ];

    const handleApply = () => {
        if (selectedService) {
            setIsSubmitted(true);
        } else {
            alert("请先选择一个服务类别。");
        }
    };

    if (!user) {
        return (
            <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
                <Scene />
                <Loader className="animate-spin h-12 w-12 text-cyan-400 z-10" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center p-4 sm:p-8 overflow-hidden">
            <Scene />
            <Header user={user} onBack={() => router.back()} onLogout={handleLogout} />
            
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 mt-24 w-full flex flex-col items-center">
                <AnimatePresence mode="wait">
                    {!isSubmitted ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="w-full max-w-4xl flex flex-col items-center"
                        >
                            <h1 className="text-4xl font-bold mb-4 text-center text-gray-100">申请新服务</h1>
                            <p className="text-gray-400 mb-10 text-center">请选择您需要申请的服务，然后点击申请按钮。</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full mb-12">
                                {services.map((service) => {
                                    const Icon = service.icon;
                                    const isSelected = selectedService === service.name;
                                    return (
                                        <motion.div
                                            key={service.name}
                                            onClick={() => setSelectedService(service.name)}
                                            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 bg-black/30 backdrop-blur-md ${isSelected ? 'border-cyan-400 shadow-cyan-500/20 shadow-lg' : 'border-gray-500/30 hover:border-cyan-400/50'}`}
                                            whileHover={{ y: -5 }}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-4 text-center">
                                                <Icon size={36} className={isSelected ? 'text-cyan-400' : 'text-gray-300'} />
                                                <h3 className={`font-semibold text-base md:text-lg ${isSelected ? 'text-white' : 'text-gray-300'}`}>{service.name}</h3>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.button
                                onClick={handleApply}
                                disabled={!selectedService}
                                className="flex items-center gap-3 px-10 py-4 font-bold text-lg text-white bg-cyan-600 rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed hover:bg-cyan-500 hover:shadow-xl hover:shadow-cyan-500/40"
                                whileTap={{ scale: 0.95 }}
                            >
                                <Send size={20} />
                                申 请
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="status"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.7 }}
                            className="w-full"
                        >
                            <ApplicationStatus />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
