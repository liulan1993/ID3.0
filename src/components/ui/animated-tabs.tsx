// src/components/animated-tabs.tsx
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const defaultTabs: Tab[] = [
  {
    id: "tab1",
    label: "公司注册",
    content: (
      <div className="grid grid-cols-1 gap-4 w-full h-full">
        <img
          src="https://zh.apex-elite-service.com/wenjian/1-1.jpg"
          alt="Tab 1"
          className="rounded-lg w-full aspect-video object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            公司注册创始包
          </h2>
          <p className="text-sm sm:text-base font-medium text-gray-200 mt-0">
            提供一站式的公司注册创始包，涵盖战略架构、银行开户与主动式秘书服务，为您稳固事业的第一步。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab2",
    label: "准证申请",
    content: (
      <div className="grid grid-cols-1 gap-4 w-full h-full">
        <img
          src="https://zh.apex-elite-service.com/wenjian/2-1.jpg"
          alt="Tab 2"
          className="rounded-lg w-full aspect-video object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            创始人准证方案
          </h2>
          <p className="text-sm sm:text-base font-medium text-gray-200 mt-0">
            专为创始人及高管家庭量身定制EP/DP等准证。我们通过深度评估和战略规划，极大提升获批率，保障身份安全。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab3",
    label: "财税与合规",
    content: (
      <div className="grid grid-cols-1 gap-4 w-full h-full">
        <img
          src="https://zh.apex-elite-service.com/wenjian/3.jpg"
          alt="Tab 3"
          className="rounded-lg w-full aspect-video object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            财税合规与规划
          </h2>
          <p className="text-sm sm:text-base font-medium text-gray-200 mt-0">
            提供专业的年度财税申报、财税合规与规划服务，我们不仅确保您的企业稳健合规，更助力您充分享受新加坡的政策优势。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab4",
    label: "人力资源",
    content: (
      <div className="grid grid-cols-1 gap-4 w-full h-full">
        <img
          src="https://zh.apex-elite-service.com/wenjian/4.jpg"
          alt="Tab 4"
          className="rounded-lg w-full aspect-video object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            人力资源解决方案
          </h2>
          <p className="text-sm sm:text-base font-medium text-gray-200 mt-0">
            助您在新加坡高效、合规地组建管理团队。我们提供从人才招聘、EOR到薪酬合规的一站式解决方案。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab5",
    label: "技术驱动",
    content: (
      <div className="grid grid-cols-1 gap-4 w-full h-full">
        <img
          src="https://zh.apex-elite-service.com/wenjian/4.jpg"
          alt="Tab 4"
          className="rounded-lg w-full aspect-video object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            专业前后端开发
          </h2>
          <p className="text-sm sm:text-base font-medium text-gray-200 mt-0">
            我们拥有专业的技术团队，提供稳定高效的前后端开发服务，实现您对产品的所有构想，确保应用功能完善，运行流畅。
          </p>
        </div>
      </div>
    ),
  },
];

const AnimatedTabs = ({
  tabs = defaultTabs,
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full max-w-lg flex flex-col gap-y-2", className)}>
      <div className="flex gap-2 flex-wrap bg-[#11111198] bg-opacity-50 backdrop-blur-sm p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-3 py-1.5 text-sm sm:text-base font-medium rounded-lg text-white outline-none transition-colors"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-[#111111d1] bg-opacity-50 shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm !rounded-lg"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="p-4 bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] text-white bg-opacity-50 backdrop-blur-sm rounded-xl border min-h-[15rem] h-full">
        <AnimatePresence mode="wait">
            {tabs.map(
              (tab) =>
                activeTab === tab.id && (
                  <motion.div
                    key={tab.id}
                    initial={{
                      opacity: 0,
                      scale: 0.95,
                      x: 10,
                    }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      x: -10,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut",
                    }}
                  >
                    {tab.content}
                  </motion.div>
                )
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnimatedTabs;
