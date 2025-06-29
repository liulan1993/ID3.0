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
// ------------------------------------

export default function Page() {
    const [mainContentVisible, setMainContentVisible] = useState(false);
    const [isClient, setIsClient] = useState(false);
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

    const handleLoginClick = () => {
        setIsLoginModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsLoginModalOpen(false);
    };

    const handleProtectedLinkClick = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => {
        e.preventDefault();
        console.log(`Protected link to ${href} clicked`);
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
                            onLoginClick={handleLoginClick}
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
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
