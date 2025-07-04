// src/components/testimonials.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Transition } from "@headlessui/react";

interface Testimonial {
  img: string;
  quote: string;
  role: string;
}

const testimonialsData: Testimonial[] = [
    {
      img: '',
      quote: "公司注册、准证、财税及人力资源的运营方案，助力企业高效发展。",
      role: '企业服务',
    },
    {
      img: '',
      quote: "作为您家庭的教育合伙人，规划最优成长路径，提供全方位的教育服务。",
      role: '留学教育',
    },
    {
      img: '',
      quote: "溯源生命数据，中新医疗资源，为您守护健康。",
      role: '健康管理',
    },
    {
      img: '',
      quote: "网站、后端、公众号、App、数据库… 复杂的交给我，成功的带给您。",
      role: '技术赋能',
    },
];

const Testimonials = () => {
  const [active, setActive] = useState<number>(0);
  const [autorotate, setAutorotate] = useState<boolean>(true);
  const autorotateTiming: number = 7000;

  useEffect(() => {
    if (!autorotate) return;
    const interval = setInterval(() => {
      setActive(
        active + 1 === testimonialsData.length ? 0 : (active) => active + 1,
      );
    }, autorotateTiming);
    return () => clearInterval(interval);
  }, [active, autorotate]);

  return (
    <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center px-4">
      <div className="mb-8">
        <div className="relative w-28 h-28 flex items-center justify-center">
             <motion.div
                className="absolute w-full h-full rounded-full border-2 border-amber-500"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
            />
            <div className="absolute w-24 h-24 rounded-full border-2 border-amber-600/50"></div>
            <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
            >
                <div className="absolute w-24 h-24 rounded-full"
                     style={{
                        background: 'conic-gradient(from 0deg, transparent 0% 70%, #FDE68A 95%, transparent 100%)'
                     }}
                ></div>
            </motion.div>
            <div className="absolute w-20 h-20 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.5)]"></div>
            <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-300 animate-pulse"></div>
        </div>
      </div>
      <div className="mb-5 w-full">
        <div className="relative grid min-h-[6rem] items-center">
          {testimonialsData.map((testimonial, index) => (
            <Transition
              as="div"
              key={index}
              show={active === index}
              className="[grid-area:1/1]"
              enter="transition ease-in-out duration-500 delay-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-out duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="text-base md:text-2xl text-slate-200 px-4">
                {testimonial.quote}
              </div>
            </Transition>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center">
        {testimonialsData.map((testimonial, index) => (
          <button
            key={index}
            className={`m-1 sm:m-2 px-4 py-2 sm:px-6 rounded-full text-sm sm:text-base font-medium transition-all duration-300 focus-visible:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-sky-500 ${
              active === index
                ? "bg-white text-black shadow-md"
                : "bg-transparent text-white hover:bg-white hover:text-black"
            }`}
            onClick={() => {
              setActive(index);
              setAutorotate(false);
            }}
          >
            <span>{testimonial.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;