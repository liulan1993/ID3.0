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
    label: "教育留学板块",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1493552152660-f915ab47ae9d?q=80&w=3087&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 1"
          className="rounded-lg w-full h-40 md:h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            个性化留学规划
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            我们提供从选校、文书到签证的全方位指导，助力学生进入世界顶尖名校。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab2",
    label: "医疗服务",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1506543730435-e2c1d4553a84?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Tab 2"
          className="rounded-lg w-full h-40 md:h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            全球医疗资源
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            对接全球顶级医疗机构，提供远程会诊、海外就医等高端健康管理服务。
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tab3",
    label: "企业服务",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
        <img
          src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3"
          alt="Tab 3"
          className="rounded-lg w-full h-40 md:h-60 object-cover mt-0 !m-0 shadow-[0_0_20px_rgba(0,0,0,0.2)] border-none"
        />
        <div className="flex flex-col gap-y-2">
          <h2 className="text-xl md:text-2xl font-bold mb-0 text-white mt-0 !m-0">
            企业出海解决方案
          </h2>
          <p className="text-sm text-gray-200 mt-0">
            为企业提供市场准入、法律合规、税务筹划等一站式海外拓展服务。
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
              "relative px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-white outline-none transition-colors"
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