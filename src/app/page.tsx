// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

// --- 路径已根据您正确的目录结构修正 ---
import AppNavigationBar from '@/components/ui/header';
import OpeningAnimation from '@/components/ui/opening-animation';
import MainScene from '@/components/ui/main-scene';
import HomePageTitle from '@/components/ui/home-page-title';
import Testimonials from '@/components/ui/testimonials';
import VelocityScroll from '@/components/ui/velocity-scroll';
import StackedCircularFooter from '@/components/ui/footer';
// ------------------------------------

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

    const handleLoginClick = () => {
        // 在此处处理登录逻辑
        console.log("Login button clicked");
    };

    const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        // 在此处处理受保护链接的点击逻辑
        e.preventDefault();
        console.log(`Protected link to ${href} clicked`);
        // 示例: 检查认证状态，如果未登录则跳转登录页
        // if (!isAuthenticated) {
        //   router.push('/login');
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
                        {/* Layer 0: Header */}
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
        </div>
    );
}