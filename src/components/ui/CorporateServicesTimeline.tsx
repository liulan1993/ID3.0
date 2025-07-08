// src/components/ui/CorporateServicesTimeline.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

// 组件所需的数据
const timelineData = [
    {
      title: "公司注册",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">提供一站式的公司注册“创始包”，涵盖战略架构、银行开户与主动式秘书服务，为您稳固事业的第一步。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/1-1.jpg" 
              alt="启动模板" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl" 
            />
          </div>
        </div>
      ),
    },
    {
      title: "准证申请",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">为创始人、高管及家人量身定制整体准证方案（EP、DP等），通过深度评估与战略规划，极大化成功率，提供核心身份保障。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/2-1.jpg" 
              alt="启动模板" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl" 
            />
          </div>
        </div>
      ),
    },
    {
      title: "财务税务合规",
      content: (
        <div>
          <p className="text-neutral-200 font-normal mb-8 text-base md:text-lg">提供专业的年度财税申报、财税合规与规划服务，我们不仅确保您的企业稳健合规，更助力您充分享受新加坡的政策优势。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/3.jpg" 
              alt="英雄区模板" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl" 
            />
          </div>
        </div>
      ),
    },
    {
      title: "人力资源支持",
      content: (
        <div>
          <p className="text-neutral-200 mb-4 text-base md:text-lg">提供从核心人才招聘、名义雇主（EOR）到跨境薪酬合规的一站式人力资源解决方案，助您在新加坡高效、合规地组建并管理顶尖团队。</p>
          <div>
            <Image 
              src="https://zh.apex-elite-service.com/wenjian/4.jpg" 
              alt="新组件预览" 
              width={500}
              height={300}
              className="rounded-lg object-cover w-full h-auto shadow-xl"
            />
          </div>
        </div>
      ),
    },
];

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (ref.current) setHeight(ref.current.getBoundingClientRect().height);
    });
    if (ref.current) resizeObserver.observe(ref.current);
    return () => resizeObserver.disconnect();
  }, []);
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start 10%", "end 50%"] });
  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className="w-full bg-transparent font-[Helvetica] md:px-10" ref={containerRef}>
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="mb-4 text-white max-w-4xl text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">企业服务<br />Corporate Services</h2>
        <p className="text-neutral-300 max-w-sm text-base md:text-lg">我们深知，在新加坡设立公司，是您全球战略的关键一步，而非一次简单的流程代办。Apex提供的，是从顶层视角出发，为您的商业大厦搭建最稳固、合规且具前瞻性的战略基石，并为后续的持续运营保驾护航。</p>
      </div>
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:pt-24 md:gap-10">
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-neutral-800 border border-neutral-700 p-2" />
              </div>
              <h3 className="hidden md:block md:pl-20 font-semibold text-white text-2xl md:text-3xl">{item.title}</h3>
            </div>
            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block mb-4 text-left font-semibold text-white text-2xl md:text-3xl">{item.title}</h3>
              {item.content}
            </div>
          </div>
        ))}
        <motion.div style={{ height: heightTransform, opacity: opacityTransform }} className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-transparent from-[0%] via-[10%] rounded-full" />
      </div>
    </div>
  );
};
Timeline.displayName = "Timeline";

// 导出为默认组件
export default function CorporateServicesTimeline() {
    return <Timeline data={timelineData} />;
}
