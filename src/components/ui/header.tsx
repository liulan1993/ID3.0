// src/components/ui/header.tsx
"use client";

import React, { useState } from 'react';
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

const AppNavigationBar = ({ onLoginClick, onProtectedLinkClick }: { onLoginClick: () => void; onProtectedLinkClick: (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>, href: string) => void; }) => {
    const navigationItems = [
        { title: "主页", href: "/", description: "" },
        {
            title: "客户支持", description: "拥抱数字化转型，提升客户体验。",
            items: [
                { title: "问卷调查", href: "https://www.apex-elite-service.com/wenjuandiaocha" },
                { title: "资料上传", href: "https://zl.apex-elite-service.com/" },
                { title: "客户反馈", href: "https://www.apex-elite-service.com/kehufankui" },
                { title: "活动报名", href: "https://www.apex-elite-service.com/huodongbaoming" },
            ],
        },
        {
            title: "AI赋能", description: "AI驱动的智能，提升业务效率。",
            items: [
                { title: "实时汇率", href: "https://www.apex-elite-service.com/shishihuilv" },
                { title: "个税计算器", href: "https://www.apex-elite-service.com/geshuijisuanqi" },
                { title: "专属AI", href: "https://www.apex-elite-service.com/zhuanshuAI" },
                { title: "敬请期待", href: "#" },
            ],
        },
    ];

    const [isOpen, setOpen] = useState(false);
    
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
                                                        <Link href="#">
                                                            <Button size="sm" className="mt-10 text-base md:text-lg" variant="outline">
                                                                商业洞察
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
                {/* --- 此处是修改的核心 --- */}
                <div className="flex justify-end w-full gap-2 md:gap-4">
                    <Button variant="ghost" className="hidden md:inline text-base md:text-lg">
                        欢迎您！
                    </Button>
                    <div className="border-r border-slate-700 hidden md:inline"></div>
                    {/* 确保“登录”按钮没有被 <Link> 标签包裹 */}
                    <Button variant="outline" onClick={onLoginClick} className="text-base md:text-lg">
                        登录
                    </Button>
                    <Link href="#">
                        <Button variant="default" className="text-base md:text-lg">商业洞察</Button>
                    </Link>
                </div>
                {/* --- 移动端菜单 --- */}
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
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
AppNavigationBar.displayName = "AppNavigationBar";

export default AppNavigationBar;
