// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X } from 'lucide-react'; // 引入 X 图标用于关闭按钮

// --- 组件路径 ---
import AppNavigationBar from '@/components/ui/header';
import OpeningAnimation from '@/components/ui/opening-animation';
import MainScene from '@/components/ui/main-scene';
import HomePageTitle from '@/components/ui/home-page-title';
import Testimonials from '@/components/ui/testimonials';
import VelocityScroll from '@/components/ui/velocity-scroll';
import StackedCircularFooter from '@/components/ui/footer';
// --- 新增: 引入登录/注册表单组件 ---
import AuthFormComponent from '@/components/ui/auth-form'; 
// ------------------------------------

export default function Page() {
    const [mainContentVisible, setMainContentVisible] = useState(false);
    const [isClient, setIsClient] = useState(false);
    // --- 新增: 控制登录模态框显示的状态 ---
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (sessionStorage.getItem('hasVisitedHomePage')) {
            setMainContentVisible(true);
        }
    }, []);

    const handleAnimationFinish = () => {
        setMainContentVisible(true);
    };

    // --- 修改: handleLoginClick 现在会打开模态框 ---
    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };
    
    // --- 新增: 关闭模态框的处理函数 ---
    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        console.log(`Protected link to ${href} clicked`);
        // 如果未登录，则打开登录模态框
        // if (!isAuthenticated) {
        //   handleLoginClick();
        // } else {
        //   window.location.href = href;
        // }
    };

    return (
        <div className="relative w-full bg-black text-white">
            <AnimatePresence>
                {isClient && !mainContentVisible &&
                    <OpeningAnimation onAnimationFinish={handleAnimationFinish} />
                }
            </AnimatePresence>
            
            <motion.div 
                className="relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: mainContentVisible ? 1 : 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {isClient && (
                    <>
                        {/* Layer 0: Header - onLoginClick会触发模态框 */}
                        <AppNavigationBar 
                            onLoginClick={handleLoginClick}
                            onProtectedLinkClick={handleProtectedLinkClick}
                        />

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

            {/* --- 新增: 登录/注册模态框 --- */}
            <AnimatePresence>
                {isLoginModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        // 点击背景关闭模态框
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            // 阻止点击模态框内容时关闭
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <AuthFormComponent onClose={handleCloseModal} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
