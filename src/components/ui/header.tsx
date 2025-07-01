// src/components/ui/header.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, MoveRight, X } from "lucide-react";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- 共享类型定义 (与 page.tsx 保持一致) ---
interface User {
  name: string;
  email: string;
}

// --- Props 类型定义 ---
interface AppNavigationBarProps {
    isAuthenticated: boolean;
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onProtectedLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => void;
}

const AppNavigationBar = ({ isAuthenticated, user, onLoginClick, onLogoutClick, onProtectedLinkClick }: AppNavigationBarProps) => {
    const navigationItems = [
        { title: "主页", href: "/", description: "" },
        {
            title: "客户支持", description: "拥抱数字化转型，提升客户体验。",
            items: [
                { title: "问卷调查", href: "/questionnaire" },
                { title: "资料上传", href: "/upload" },
                { title: "客户反馈", href: "/customer" },
                { title: "活动报名", href: "/activity" },
            ],
        },
        {
            title: "AI赋能", description: "AI驱动的智能，提升业务效率。",
            items: [
                { title: "实时汇率", href: "/exchange" },
                { title: "个税计算器", href: "/tax" },
                { title: "专属AI", href: "/exclusive" },
                { title: "敬请期待", href: "#" },
            ],
        },
    ];

    const [isOpen, setOpen] = useState(false);
    // --- 修改: 用于控制自定义下拉菜单的状态 ---
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    // --- 新增: 用于获取下拉菜单容器的引用 ---
    const dropdownRef = useRef<HTMLDivElement>(null);

    // --- 新增: 处理点击菜单外部关闭菜单的逻辑 ---
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);


    return (
        <header className="w-full z-50 fixed top-0 left-0 bg-black/50 backdrop-blur-sm">
            <div className="container relative mx-auto min-h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center px-4 md:px-8">
                <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    {item.href ? (
                                        <NavigationMenuLink asChild>
                                            <Link href={item.href} className={cn(navigationMenuTriggerStyle(), "text-base md:text-lg")}>
                                                {item.title}
                                            </Link>
                                        </NavigationMenuLink>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="text-base md:text-lg">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="!w-[450px] p-4">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="font-semibold text-base md:text-lg">{item.title}</p>
                                                            <p className="text-neutral-400 text-base md:text-lg">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <Link href="/admin">
                                                            <Button size="sm" className="mt-10 text-base md:text-lg" variant="outline">
                                                                管理员
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                    <div className="flex flex-col text-base md:text-lg h-full justify-end">
                                                        {item.items?.map((subItem) => (
                                                          <NavigationMenuLink asChild key={subItem.title}>
                                                              <Link
                                                                  href={subItem.href}
                                                                  onClick={(e) => onProtectedLinkClick(e, subItem.href)}
                                                                  className="flex flex-row justify-between items-center hover:bg-slate-800 py-2 px-4 rounded"
                                                              >
                                                                  <span>{subItem.title}</span>
                                                                  <MoveRight className="w-4 h-4 text-neutral-400" />
                                                              </Link>
                                                          </NavigationMenuLink>
                                                        ))}
                                                    </div>
                                                </div>
                                            </NavigationMenuContent>
                                        </>
                                    )}
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="flex lg:justify-center">
                    <Link href="/" className="text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                      Apex
                    </Link>
                </div>
                {/* --- 根据登录状态显示不同内容 (已修改为点击触发) --- */}
                <div className="flex justify-end w-full gap-2 md:gap-4 items-center">
                    {isAuthenticated && user ? (
                        <>
                            {/* --- 手动实现的下拉菜单 (点击触发) --- */}
                            <div ref={dropdownRef} className="relative hidden md:inline-block">
                                <Button 
                                    variant="ghost" 
                                    className="text-base md:text-lg hover:bg-slate-800"
                                    onClick={() => setDropdownOpen(!isDropdownOpen)}
                                >
                                    欢迎, {user.name}!
                                </Button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-black border border-slate-700 rounded-md shadow-lg py-2 z-50">
                                        <Link href="/my" className="block w-full text-left px-4 py-3 text-base md:text-lg text-white hover:bg-slate-800 transition-colors duration-200">
                                            我的资料
                                        </Link>
                                        <Link href="/my/apply" className="block w-full text-left px-4 py-3 text-base md:text-lg text-white hover:bg-slate-800 transition-colors duration-200">
                                            申请进度
                                        </Link>
                                        <div className="border-t border-slate-700 my-2"></div>
                                        <button
                                            onClick={() => { onLogoutClick(); setDropdownOpen(false); }}
                                            className="block w-full text-left px-4 py-3 text-base md:text-lg text-white hover:bg-slate-800 transition-colors duration-200"
                                        >
                                            退出
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <Link href="/business">
                                <Button variant="default" className="text-base md:text-lg">商业洞察</Button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onLoginClick} className="text-base md:text-lg">
                                登录
                            </Button>
                            <Link href="/business">
                                <Button variant="default" className="text-base md:text-lg">商业洞察</Button>
                            </Link>
                        </>
                    )}
                </div>
                {/* --- 移动端菜单 (已修改) --- */}
                <div className="flex w-12 shrink lg:hidden items-end justify-end">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div className="absolute top-20 border-t border-slate-800 flex flex-col w-full right-0 bg-black shadow-lg py-4 container gap-8">
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className="flex justify-between items-center"
                                                onClick={() => setOpen(false)}
                                            >
                                                <span className="text-base md:text-lg">{item.title}</span>
                                                <MoveRight className="w-4 h-4 stroke-1 text-neutral-400" />
                                            </Link>
                                        ) : (
                                            <p className="font-semibold text-base md:text-lg">{item.title}</p>
                                        )}
                                        {item.items &&
                                            item.items.map((subItem) => (
                                                <a
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    onClick={(e) => {
                                                      onProtectedLinkClick(e, subItem.href);
                                                      setOpen(false);
                                                    }}
                                                    className="flex justify-between items-center pl-2"
                                                >
                                                    <span className="text-neutral-300 text-base md:text-lg">
                                                        {subItem.title}
                                                    </span>
                                                    <MoveRight className="w-4 h-4 stroke-1" />
                                                </a>
                                            ))}
                                    </div>
                                </div>
                            ))}
                            {/* --- 移动端登录/退出/用户信息 (已修改) --- */}
                            <div className="border-t border-slate-800 pt-4">
                                {isAuthenticated && user ? (
                                    <div className='flex flex-col gap-2 text-left'>
                                        <p className="font-semibold text-center text-base md:text-lg text-neutral-300 py-2">欢迎, {user.name}!</p>
                                        <div className="border-t border-slate-700"></div>
                                        <Link href="/my" className="text-neutral-300 text-base md:text-lg p-2 hover:bg-slate-800 rounded" onClick={() => setOpen(false)}>我的资料</Link>
                                        <Link href="/my/apply" className="text-neutral-300 text-base md:text-lg p-2 hover:bg-slate-800 rounded" onClick={() => setOpen(false)}>申请进度</Link>
                                        <div className="border-t border-slate-700"></div>
                                        <Button variant="outline" onClick={() => { onLogoutClick(); setOpen(false); }} className="w-full mt-2">
                                            退出登录
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" onClick={() => { onLoginClick(); setOpen(false); }} className="w-full">
                                        登录
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
AppNavigationBar.displayName = "AppNavigationBar";

export default AppNavigationBar;
