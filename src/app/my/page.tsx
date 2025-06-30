// 文件路径: src/app/my/page.tsx

"use client";

import React, { useState, useEffect, useMemo, useRef, FC } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import { LogOut, Loader, ServerCrash, FileDown, X, FileText, ClipboardList, MessageSquare, Trash2 } from 'lucide-react';
import { PutBlobResult } from '@vercel/blob';

// --- 类型定义 ---
interface User {
  name: string;
  email: string;
}

interface UserSubmission {
    key: string;
    userName: string;
    userEmail: string;
    services: string[];
    formData: Record<string, { question: string, answer: unknown }>;
    submittedAt: string;
}

interface QuestionnaireSubmission {
  key: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
  answers: {
    qId: string;
    question: string;
    answer: string | string[];
  }[];
}

interface FeedbackSubmission {
    key: string;
    userName: string;
    userEmail: string;
    content: string;
    fileUrls: string[];
    submittedAt: string;
}

type Tab = 'submissions' | 'questionnaires' | 'feedback';
type SelectedItem = UserSubmission | QuestionnaireSubmission | FeedbackSubmission;

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
const Header: FC<{ user: User | null; onLogout: () => void; }> = ({ user, onLogout }) => (
    <header className="w-full z-10 absolute top-0 left-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20 border-b border-gray-500/20">
                <h1 className="text-3xl font-bold text-white">Apex</h1>
                {user && (
                    <div className="flex items-center gap-4">
                        <span className="text-gray-300 hidden sm:block">欢迎, {user.name}</span>
                        <button onClick={onLogout} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                            <LogOut size={18} /><span>退出</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    </header>
);

// --- 详情弹窗组件 ---
const DetailsModal: FC<{ item: SelectedItem | null; onClose: () => void; type: Tab | null }> = ({ item, onClose, type }) => {
    if (!item) return null;

    const renderAnswer = (answer: unknown): React.ReactElement => {
        if (Array.isArray(answer)) {
            const fileBlobs: PutBlobResult[] = answer.filter((file): file is PutBlobResult => typeof file === 'object' && file !== null && 'url' in file);
            const otherItems = answer.filter(other => typeof other !== 'object' || other === null || !('url' in other));
            return (
                <div>
                    {otherItems.length > 0 && <p className="text-gray-300">{otherItems.join(', ')}</p>}
                    <div className="space-y-2 mt-2">
                        {fileBlobs.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-md">
                                <span className="truncate text-sm text-gray-300 mr-4">{file.pathname.split('/').pop()}</span>
                                <a href={file.url} download target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                    <FileDown size={14} /> 下载
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        if (typeof answer === 'object' && answer !== null) {
            return <div className="pl-4 border-l-2 border-neutral-700 mt-2">{renderFormData(answer as Record<string, { question: string; answer: unknown }>)}</div>;
        }
        return <p className="text-gray-300">{String(answer)}</p>;
    };

    const renderFormData = (formData: Record<string, { question: string, answer: unknown }>): React.ReactElement[] => {
        return Object.entries(formData).map(([key, value]) => (
            <div key={key} className="mt-3">
                <p className="font-semibold text-gray-200">{value.question || key}</p>
                <div className="text-gray-400 pl-4 mt-1">{renderAnswer(value.answer)}</div>
            </div>
        ));
    };

    const renderContent = () => {
        switch (type) {
            case 'submissions': {
                const sub = item as UserSubmission;
                return renderFormData(sub.formData);
            }
            case 'questionnaires': {
                const sub = item as QuestionnaireSubmission;
                return sub.answers.map((qa, index) => (
                    <div key={qa.qId || index} className="mt-3">
                        <p className="font-semibold text-gray-200">{qa.question}</p>
                        <p className="text-gray-300 pl-4 mt-1">{Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer}</p>
                    </div>
                ));
            }
            case 'feedback': {
                const sub = item as FeedbackSubmission;
                return (
                    <>
                        <p className="text-gray-300 whitespace-pre-wrap">{sub.content}</p>
                        {sub.fileUrls && sub.fileUrls.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-200 mb-2">附件:</h4>
                                <div className="space-y-2">
                                    {sub.fileUrls.map((url, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-gray-700/50 rounded-md">
                                            <span className="truncate text-sm text-gray-300 mr-4">{url.split('/').pop()?.split('?')[0]}</span>
                                             <a href={url} download target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                                                <FileDown size={14} /> 下载
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            }
            default: return null;
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-neutral-700">
                    <h2 className="text-xl font-bold text-cyan-400">详情</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <p className="text-sm text-gray-400"><b>用户:</b> {item.userEmail} ({item.userName})</p>
                    {'services' in item && <p className="text-sm text-gray-400"><b>申请服务:</b> {(item as UserSubmission).services.join(', ')}</p>}
                    <p className="text-xs text-gray-500 mb-4"><b>提交于:</b> {new Date(item.submittedAt).toLocaleString()}</p>
                    <div className="space-y-4 mt-4 border-t border-neutral-700 pt-4">{renderContent()}</div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- 主页面组件 ---
export default function MyProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('submissions');
    const [allData, setAllData] = useState<{ submissions: UserSubmission[], questionnaires: QuestionnaireSubmission[], feedback: FeedbackSubmission[] }>({ submissions: [], questionnaires: [], feedback: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
    const router = useRouter();

    const fetchAllData = async () => {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('/api/my-data', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('获取资料失败，请重新登录。');
            const data = await response.json();
            setAllData({
                submissions: data.submissions.sort((a: UserSubmission, b: UserSubmission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
                questionnaires: data.questionnaires.sort((a: QuestionnaireSubmission, b: QuestionnaireSubmission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
                feedback: data.feedback.sort((a: FeedbackSubmission, b: FeedbackSubmission) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '发生未知错误');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo'); // **FIX**: Also check for userInfo
        
        if (token && userInfo) { // **FIX**: Check for both token and userInfo
            try {
                const parsedUser = JSON.parse(userInfo); // **FIX**: Parse userInfo from localStorage
                setUser(parsedUser);
            } catch (e) {
                console.error("解析用户信息失败:", e);
                router.push('/');
            }
        } else {
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        if (user) {
            fetchAllData();
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        setUser(null);
        router.push('/');
    };

    const handleDelete = async (key: string) => {
        if (!window.confirm("确定要删除此项记录吗？此操作不可撤销。")) return;
        
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch('/api/my-data', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ keyToDelete: key }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || '删除失败');
            }
            
            // 从本地状态中移除已删除的项目
            setAllData(prevData => ({
                submissions: prevData.submissions.filter(item => item.key !== key),
                questionnaires: prevData.questionnaires.filter(item => item.key !== key),
                feedback: prevData.feedback.filter(item => item.key !== key),
            }));

        } catch (err) {
            alert(err instanceof Error ? err.message : '删除时发生错误');
        }
    };

    const tabs: { id: Tab; label: string; icon: FC<{ size?: number | string }> }[] = [
        { id: 'submissions', label: '表单资料', icon: FileText },
        { id: 'questionnaires', label: '问卷调查', icon: ClipboardList },
        { id: 'feedback', label: '客户反馈', icon: MessageSquare },
    ];

    const renderContent = () => {
        if (isLoading) return <div className="flex flex-col items-center justify-center text-center"><Loader className="animate-spin h-12 w-12 text-cyan-400" /><p className="mt-4 text-lg text-gray-300">正在加载您的资料...</p></div>;
        if (error) return <div className="flex flex-col items-center justify-center text-center bg-red-500/10 border border-red-500/30 p-8 rounded-lg"><ServerCrash className="h-12 w-12 text-red-400" /><p className="mt-4 text-lg text-red-300">加载出错</p><p className="text-sm text-red-400">{error}</p></div>;
        
        const currentData = allData[activeTab];

        if (currentData.length === 0) return <div className="text-center mt-10"><h2 className="text-2xl font-semibold text-gray-300">暂无记录</h2><p className="mt-2 text-gray-400">您在此分类下还没有任何提交。</p></div>;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentData.map((item) => (
                    <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-black/30 backdrop-blur-md border border-gray-500/20 rounded-xl shadow-lg flex flex-col overflow-hidden group">
                        <div className="p-6 flex-grow">
                            <h3 className="font-bold text-lg text-cyan-300 truncate">
                                {activeTab === 'submissions' ? (item as UserSubmission).services.join(', ') : activeTab === 'questionnaires' ? '问卷调查' : '客户反馈'}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">提交于: {new Date(item.submittedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center px-6 py-4 bg-gray-500/10">
                            <button onClick={() => setSelectedItem(item)} className="font-semibold text-white hover:text-cyan-300 transition-colors">查看详情</button>
                            <button onClick={() => handleDelete(item.key)} className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    if (!user) return <div className="min-h-screen w-full flex items-center justify-center bg-black"><Loader className="animate-spin h-12 w-12 text-cyan-400" /></div>;

    return (
        <div className="relative min-h-screen w-full bg-[#000] text-white flex flex-col items-center p-4 sm:p-8 overflow-hidden">
            <Scene />
            <Header user={user} onLogout={handleLogout} />
            <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 mt-24 w-full">
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-100">我的资料</h1>
                <div className="flex justify-center mb-8 border-b border-gray-500/20">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${activeTab === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'}`}>
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                {renderContent()}
            </main>
            <AnimatePresence>
                {selectedItem && <DetailsModal item={selectedItem} onClose={() => setSelectedItem(null)} type={activeTab} />}
            </AnimatePresence>
        </div>
    );
}
