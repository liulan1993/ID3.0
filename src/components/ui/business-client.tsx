"use client";

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link'; // (修正) 引入 Link 组件
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- (新增) 导出类型定义，以便服务器组件可以复用 ---
export interface Article {
    id: string;
    title: string;
    markdownContent: string;
    coverImageUrl?: string;
    createdAt: string;
    authorEmail: string;
}

// --- 3D背景组件 (无改动) ---
const Box = ({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) => {
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
        <mesh geometry={geometry} position={position} rotation={rotation}>
            <meshPhysicalMaterial color="#232323" metalness={1} roughness={0.3} reflectivity={0.5} ior={1.5} emissive="#000000" emissiveIntensity={0} transparent={false} opacity={1.0} transmission={0.0} thickness={0.5} clearcoat={0.0} clearcoatRoughness={0.0} sheen={0} sheenRoughness={1.0} sheenColor="#ffffff" specularIntensity={1.0} specularColor="#ffffff" iridescence={1} iridescenceIOR={1.3} iridescenceThicknessRange={[100, 400]} flatShading={false} />
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
    const boxes = Array.from({ length: 50 }, (_, index) => ({ position: [(index - 25) * 0.75, 0, 0] as [number, number, number], rotation: [ (index - 10) * 0.1, Math.PI / 2, 0 ] as [number, number, number], id: index }));
    return (<group ref={groupRef}>{boxes.map((box) => (<Box key={box.id} position={box.position} rotation={box.rotation} />))}</group>);
};
const Scene = () => {
    return (
        <div className="absolute inset-0 w-full h-full z-0">
            <Canvas camera={{ position: [0, 0, 15], fov: 40 }}><ambientLight intensity={15} /><directionalLight position={[10, 10, 5]} intensity={15} /><AnimatedBoxes /></Canvas>
        </div>
    );
};

// --- 文章卡片组件 ---
const ArticleCard = ({ article, onClick }: { article: Article, onClick: () => void }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-md rounded-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 border border-gray-700/50 flex flex-col" onClick={onClick}>
            <div className="w-full h-48 bg-cover bg-center" style={{ backgroundImage: `url(${article.coverImageUrl || 'https://placehold.co/600x400/1A2428/FFFFFF?text=Article'})` }} />
            <div className="p-4">
                <h3 className="text-xl font-bold text-white truncate">{article.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{new Date(article.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
    );
};

// --- 文章模态框 (Modal) 组件 ---
const ArticleModal = ({ article, onClose }: { article: Article, onClose: () => void }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1C2529] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 border border-gray-700/80 relative animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl z-10" aria-label="关闭文章">&times;</button>
                <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg prose-headings:text-white">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        img: (props) => {
                            if (typeof props.src === 'string' && (props.src.endsWith('.mp4') || props.src.endsWith('.webm') || props.src.endsWith('.ogg'))) {
                                return (<div className="w-full aspect-video my-6"><video src={props.src} controls preload="metadata" className="w-full h-full rounded-lg">您的浏览器不支持播放该视频。</video></div>);
                            }
                            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                            return <img {...props} />;
                        },
                    }}>{article.markdownContent}</ReactMarkdown>
                </article>
            </div>
        </div>
    );
};

// --- 主要的客户端页面组件 ---
export default function BusinessClient({ articles }: { articles: Article[] }) {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    useEffect(() => {
        document.body.style.overflow = selectedArticle ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [selectedArticle]);

    return (
        <div className="relative min-h-screen w-full bg-[#000] text-white" style={{ background: 'linear-gradient(to bottom right, #000, #1A2428)' }}>
            <Scene />
            <main className="relative z-10 p-8 md:p-16">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">商业洞察</h1>
                    <p className="text-gray-400 mt-2">点击卡片阅读全文</p>
                    <div className="mt-4">
                        {/* (修正) 使用 Link 组件代替 a 标签 */}
                        <Link href="/" className="inline-block bg-sky-500/80 text-white font-bold py-2 px-6 rounded-lg hover:bg-sky-600/80 transition-colors duration-300">返回主页</Link>
                    </div>
                </header>

                {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {articles.map(article => (
                            <ArticleCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400">暂无文章。</div>
                )}
            </main>

            {selectedArticle && (<ArticleModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />)}

            <style jsx global>{`
                .prose { --tw-prose-body: #d1d5db; --tw-prose-headings: #ffffff; --tw-prose-lead: #a1a1aa; --tw-prose-links: #93c5fd; --tw-prose-bold: #ffffff; --tw-prose-counters: #a1a1aa; --tw-prose-bullets: #a1a1aa; --tw-prose-hr: #4b5563; --tw-prose-quotes: #e5e7eb; --tw-prose-quote-borders: #4b5563; --tw-prose-captions: #a1a1aa; --tw-prose-code: #f3f4f6; --tw-prose-pre-code: #e5e7eb; --tw-prose-pre-bg: #1f2937; --tw-prose-th-borders: #4b5563; --tw-prose-td-borders: #4b5563; }
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
}
