// 文件路径: src/app/my/apply/page.tsx

"use client";

import React, { useState, useMemo, useRef, FC, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { School, Briefcase, HeartPulse, User, ArrowLeft, Send, LogOut, Loader, type LucideProps, AlertTriangle } from 'lucide-react';

// --- 类型定义 ---
type ServiceCategory = '留学教育' | '企业服务' | '医疗健康' | '个人咨询';
type ApplicationStatusType = 'pending' | 'accepted' | 'completed' | 'rejected';

interface User {
  username: string;
  email: string;
}

interface Application {
    key: string;
    services: string[];
    status: ApplicationStatusType;
    submittedAt: string;
}

// --- 3D背景动画组件 ---
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
const ApplicationStatusDisplay: FC<{ status: ApplicationStatusType }> = ({ status }) => {
    const statusConfig = {
        pending: {
            orbColor: "from-amber-400 to-amber-600",
            glowShadow: "0 0 40px 10px #f59e0b, 0 0 80px 30px #b45309",
            title: "申请已提交",
            message: "我们已收到您的申请请求。处理过程通常需要3-5个工作日。请您耐心等待，我们的顾问会尽快通过邮件与您联系。"
        },
        accepted: {
            orbColor: "from-blue-500 to-blue-700",
            glowShadow: "0 0 40px 10px #3b82f6, 0 0 80px 30px #1d4ed8",
            title: "申请已受理",
            message: "您的申请已受理，正在加急处理中，请耐心等待。"
        },
        completed: {
            orbColor: "from-green-400 to-green-600",
            glowShadow: "0 0 40px 10px #4ade80, 0 0 80px 30px #16a34a",
            title: "申请已完成",
            message: "您的申请已受理，请保持电话畅通。"
        },
        rejected: {
            orbColor: "from-gray-500 to-gray-700",
            glowShadow: "0 0 40px 10px #6b7280, 0 0 80px 30px #374151",
            title: "申请未通过",
            message: "很遗憾，您的申请未通过审核。详情请查阅您的邮箱或联系客服。"
        }
    };

    const currentStatus = statusConfig[status] || statusConfig.pending;

    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
                className="relative w-32 h-32 md:w-40 md:h-40"
            >
                <div className={`w-full h-full rounded-full bg-gradient-to-br ${currentStatus.orbColor} shadow-lg`}></div>
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: currentStatus.glowShadow }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-full">
                    <motion.div
                        className="absolute -top-1/4 -left-full w-1/2 h-[150%] bg-white/40"
                        style={{ transform: 'rotate(35deg)', filter: 'blur(30px)' }}
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
                <h3 className="text-xl font-semibold text-cyan-300">{currentStatus.title}</h3>
                <p className="text-gray-300 mt-2 max-w-sm">{currentStatus.message}</p>
            </motion.div>
        </div>
    );
};


// --- 主页面组件 ---
export default function ApplyPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const fetchStatus = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token || !user) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch('/api/my-application-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const newApplications = Array.isArray(data) ? data : (data && Array.isArray(data.submissions) ? data.submissions : []);
                setApplications(newApplications);
            } else {
                setApplications([]);
            }
        } catch (err) {
            console.error("获取申请状态失败:", err);
            setApplications([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;
        
        fetchStatus();
        const intervalId = setInterval(fetchStatus, 30000);
        return () => clearInterval(intervalId);
    }, [user, fetchStatus]);


    const services: { name: ServiceCategory; icon: React.FC<LucideProps> }[] = [
        { name: '留学教育', icon: School },
        { name: '企业服务', icon: Briefcase },
        { name: '医疗健康', icon: HeartPulse },
        { name: '个人咨询', icon: User },
    ];

    const handleApply = async () => {
        if (!selectedService) {
            alert("请先选择一个服务类别。");
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        const token = localStorage.getItem('authToken');
        if (!token) {
            setError("登录会话已过期，请重新登录。");
            setIsSubmitting(false);
            setTimeout(() => handleLogout(), 3000);
            return;
        }

        try {
            const response = await fetch('/api/submit-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    service: selectedService,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '申请提交失败，请稍后重试。');
            }
            
            await fetchStatus();
            setSelectedService(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : '发生未知网络错误。');
        } finally {
            setIsSubmitting(false);
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
                
                {/* --- 现有申请列表 --- */}
                <div className="w-full max-w-5xl">
                    <h2 className="text-3xl font-bold text-center text-gray-100 mb-8">我的申请</h2>
                    {isLoading ? (
                        <div className="flex justify-center mt-8">
                            <Loader className="animate-spin h-12 w-12 text-cyan-400" />
                        </div>
                    ) : applications.length > 0 ? (
                        <motion.div 
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12"
                        >
                            <AnimatePresence>
                                {applications.map((app) => (
                                    <motion.div
                                        key={app.key}
                                        layout
                                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                    >
                                        <ApplicationStatusDisplay status={app.status} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    ) : (
                        <div className="text-center text-gray-400 mt-8">
                            <p>您当前没有正在处理的申请。</p>
                        </div>
                    )}
                </div>

                {/* --- 分割线 --- */}
                <div className="w-full max-w-4xl my-16">
                    <div className="h-px bg-gray-500/30"></div>
                </div>
                
                {/* --- 申请表单 --- */}
                <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20"
                        >
                            <AlertTriangle size={20} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <motion.button
                        onClick={handleApply}
                        disabled={!selectedService || isSubmitting}
                        className="flex items-center justify-center gap-3 px-10 py-4 font-bold text-lg text-white bg-cyan-600 rounded-full shadow-lg shadow-cyan-500/30 transition-all duration-300 disabled:bg-gray-600 disabled:shadow-none disabled:cursor-not-allowed hover:bg-cyan-500 hover:shadow-xl hover:shadow-cyan-500/40"
                        whileTap={{ scale: 0.95 }}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader className="animate-spin h-5 w-5" />
                                <span>提交中...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                <span>申 请</span>
                            </>
                        )}
                    </motion.button>
                </motion.div>

            </main>
        </div>
    );
}
