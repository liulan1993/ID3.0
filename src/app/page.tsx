// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

// --- 组件路径 ---
import AppNavigationBar from '@/components/ui/header';
import OpeningAnimation from '@/components/ui/opening-animation';
import MainScene from '@/components/ui/main-scene';
import HomePageTitle from '@/components/ui/home-page-title';
import Testimonials from '@/components/ui/testimonials';
import VelocityScroll from '@/components/ui/velocity-scroll';
import StackedCircularFooter from '@/components/ui/footer';
import AuthFormComponent from '@/components/ui/auth-form'; 
import JinSeXianTiao from '@/components/ui/jinsexiantiao';
import SmoothScrollHero from '@/components/ui/smooth-scroll-hero'; // <-- 新增的引用
// ------------------------------------

// --- 定义共享类型 ---
export interface User {
  name: string;
  email: string;
}

export interface LoginSuccessData {
  user: User;
  token: string;
}
// ----------------------------

export default function Page() {
    const [mainContentVisible, setMainContentVisible] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        setIsClient(true);
        const token = localStorage.getItem('authToken');
        if (token) {
            setIsAuthenticated(true);
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsedUser: User = JSON.parse(userInfo);
                setUser(parsedUser);
            }
        }
        if (sessionStorage.getItem('hasVisitedHomePage')) {
            setMainContentVisible(true);
        }
    }, []);

    useEffect(() => {
        if (isLoginModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isLoginModalOpen]);

    const handleAnimationFinish = () => {
        setMainContentVisible(true);
    };

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleLoginSuccess = (data: LoginSuccessData) => {
        setIsAuthenticated(true);
        setUser(data.user);
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));

        handleCloseModal();
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
    };

    const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        if (!isAuthenticated) {
            handleLoginClick();
        } else {
            window.location.href = href;
        }
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
                        <AppNavigationBar 
                            isAuthenticated={isAuthenticated}
                            user={user}
                            onLoginClick={handleLoginClick}
                            onLogoutClick={handleLogout}
                            onProtectedLinkClick={handleProtectedLinkClick}
                        />

                        <div className="fixed inset-0 z-0">
                           <MainScene />
                        </div>

                        <div className="relative z-10">
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
                            
                            <VelocityScroll />

                            <JinSeXianTiao />

                            {/* --- 新增的组件调用 --- */}
                            <SmoothScrollHero />
                            {/* -------------------- */}

                            <StackedCircularFooter />
                        </div>
                    </>
                )}
            </motion.div>

            <AnimatePresence>
                {isLoginModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-8 md:pt-16"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative"
                        >
                            <AuthFormComponent onClose={handleCloseModal} onLoginSuccess={handleLoginSuccess} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}