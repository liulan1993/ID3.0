// src/app/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

// --- 工具函数 ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// -----------------

// --- 新增: 定义共享类型 ---
export interface User {
  name: string;
  email: string;
}

export interface LoginSuccessData {
  user: User;
  token: string;
}
// ----------------------------


// ============================================================================
// 1. 从 old-page.tsx 迁移过来的 ProjectShowcase 组件及其依赖
// ============================================================================

// Testimonial 类型定义
type Testimonial = {
  name: string; 
  buttonLabel: string; 
  quote: string; 
  designation: string; 
  src: string; 
  link?: string;
};

// HalomotButton 按钮组件
interface HalomotButtonProps {
  gradient?: string; 
  inscription: string; 
  onClick: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  fillWidth?: boolean; 
  fixedWidth?: string; 
  href?: string; 
  backgroundColor?: string;
  icon?: React.ReactElement; 
  borderWidth?: string; 
  padding?: string;
  outerBorderRadius?: string; 
  innerBorderRadius?: string; 
  textColor?: string;
  hoverTextColor?: string;
}

const HalomotButton: React.FC<HalomotButtonProps> = ({
  gradient = "linear-gradient(135deg, #4776cb, #a19fe5, #6cc606)",
  inscription, 
  onClick, 
  fillWidth = false, 
  fixedWidth, 
  href,
  backgroundColor = "#000", 
  icon, 
  borderWidth = "1px", 
  padding,
  outerBorderRadius = "6.34px", 
  innerBorderRadius = "6px",
  textColor = "#fff", 
  hoverTextColor,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerStyle: React.CSSProperties = fixedWidth ? { width: fixedWidth, display: "inline-block" } : {};
  const buttonStyle: React.CSSProperties = { padding: borderWidth, background: gradient, borderRadius: outerBorderRadius, width: fillWidth || fixedWidth ? "100%" : "fit-content", border: "0", display: "flex", justifyContent: "center", alignItems: "center", textDecoration: "none", userSelect: "none", whiteSpace: "nowrap", transition: "all .3s", boxSizing: "border-box", };
  const spanStyle: React.CSSProperties = { background: isHovered ? "none" : backgroundColor, padding: padding ?? (fillWidth || fixedWidth ? "1rem 0" : "1rem 4rem"), borderRadius: innerBorderRadius, width: "100%", height: "100%", transition: "color 0.3s, background 300ms", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: isHovered && hoverTextColor ? hoverTextColor : textColor, whiteSpace: "nowrap", fontFamily: "inherit", fontSize: "1rem", gap: icon ? "0.5em" : "0", boxSizing: "border-box", cursor: "pointer", };
  const iconStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", height: "1em", width: "1em", fontSize: "1.1em", verticalAlign: "middle", flexShrink: 0, };
  const ButtonContent = <span style={spanStyle}>{icon && <span style={iconStyle}>{icon}</span>}{inscription}</span>;
  
  const commonProps = {
    style: buttonStyle,
    onClick: onClick,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  const ButtonElement = href ? (
    <a href={href} {...commonProps} rel="noopener noreferrer">{ButtonContent}</a>
  ) : (
    <button type="button" {...commonProps}>{ButtonContent}</button>
  );
  return fixedWidth ? <div style={containerStyle}>{ButtonElement}</div> : ButtonElement;
};
HalomotButton.displayName = "HalomotButton";


// ImageContainer 图片容器组件
const ImageContainer = ({ src, alt }: { src: string; alt: string; }) => (
  <div className="relative h-full w-full rounded-2xl overflow-hidden p-px bg-zinc-800">
    <Image 
      src={src} 
      alt={alt} 
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover object-center rounded-[15px]" 
      priority
    />
  </div>
);
ImageContainer.displayName = 'ImageContainer';

// projectShowcaseData 静态数据
const projectShowcaseData: Testimonial[] = [
  {
    name: "教育路径规划",
    buttonLabel: "教育蓝图",
    quote: '我们提供超越择校咨询的长期教育路径规划。通过深度评估家庭理念与孩子特质，为您量身定制从当前到世界名校的清晰成长路线图。',
    designation: "Next.js 项目",
    src: "https://zh.apex-elite-service.com/wenjian/5-1.jpg",
    link: "https://plum-cave.netlify.app/",
  },
  {
    name: "学校申请支持",
    buttonLabel: "名校起航",
    quote: "精准、高效的全流程申请支持，关注的不仅是文书与面试技巧，更是如何将您孩子最独特的闪光点呈现给招生官，赢得理想的录取通知。",
    designation: "Next.js 项目",
    src: "https://zh.apex-elite-service.com/wenjian/6-1.jpg",
    link: "https://namer-ui.netlify.app/",
  },
  {
    name: "长期成长陪伴",
    buttonLabel: "全程护航",
    quote: "作为您与学校间的沟通桥梁，我们协助处理从家长会到升学指导的各项事务，确保孩子无缝融入并持续进步。",
    designation: "Vue 项目",
    src: "https://zh.apex-elite-service.com/wenjian/7.jpg",
    link: "https://namer-ui-for-vue.netlify.app/",
  },
];

// ProjectShowcase 组件
const ProjectShowcase = ({ testimonials, onProtectedLinkClick }: { testimonials: Testimonial[], onProtectedLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => void; }) => {
  const [active, setActive] = useState(0);
  
  return (
    <div className="w-full mx-auto font-[Helvetica] py-20 text-white">
      <div className="mb-12 text-right">
        <h2 className="mb-4 text-white text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
          留学教育
          <br />
          Study Abroad Education
        </h2>
        <p className="text-neutral-300 ml-auto max-w-lg text-base md:text-lg">
          我们为客户提供卓越的服务，以实现教育目标并取得成功。
        </p>
      </div>
      
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="w-full relative aspect-[1.37/1]">
          <AnimatePresence mode="sync">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.src}
                initial={{ opacity: 0, scale: 0.9, z: -100, rotate: Math.floor(Math.random() * 21) - 10 }}
                animate={{
                  opacity: index === active ? 1 : 0.7,
                  scale: index === active ? 1 : 0.95,
                  z: index === active ? 0 : -100,
                  rotate: index === active ? 0 : Math.floor(Math.random() * 21) - 10,
                  zIndex: index === active ? 999 : testimonials.length - index,
                  y: index === active ? [0, -40, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, z: 100, rotate: Math.floor(Math.random() * 21) - 10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="absolute inset-0 origin-bottom"
              >
                <ImageContainer src={testimonial.src} alt={testimonial.name} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="flex flex-col justify-between py-4 w-full h-full">
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className='flex flex-col justify-center space-y-4'
          >
            <h3 className="text-white text-2xl md:text-3xl font-semibold">
              {testimonials[active].name}
            </h3>
            
            <motion.p className="text-neutral-200 leading-relaxed text-base md:text-lg">
              {testimonials[active].quote}
            </motion.p>
          </motion.div>
          <div className="flex flex-wrap items-center gap-3 pt-12 w-full">
            {testimonials.map((testimonial, index) => (
              <HalomotButton
                key={testimonial.name}
                inscription={testimonial.buttonLabel}
                onClick={() => setActive(index)}
                padding="0.6rem 1.2rem"
                backgroundColor={active === index ? '#4a148c' : '#161616'}
                hoverTextColor='#fff'
                gradient='linear-gradient(to right, #603dec, #a123f4)'
                fixedWidth="120px"
              />
            ))}
            <HalomotButton 
              inscription="了解更多" 
              onClick={(e) => onProtectedLinkClick(e, testimonials[active].link || 'https://www.apex-elite-service.com/')} 
              href={testimonials[active].link || '#'}
              padding="0.6rem 1.2rem"
              backgroundColor='#161616' 
              hoverTextColor='#fff' 
              gradient='linear-gradient(to right, #603dec, #a123f4)'
              fixedWidth="120px"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
ProjectShowcase.displayName = "ProjectShowcase";

// ============================================================================
// 2. 主页面组件
// ============================================================================

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

                            {/* 在这里插入 ProjectShowcase 组件 */}
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <ProjectShowcase 
                                    testimonials={projectShowcaseData}
                                    onProtectedLinkClick={handleProtectedLinkClick}
                                />
                            </div>

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
