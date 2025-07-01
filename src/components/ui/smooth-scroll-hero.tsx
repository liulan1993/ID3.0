// src/components/ui/smooth-scroll-hero.tsx
"use client";

import React from 'react';
import { motion, useScroll, useTransform, useMotionTemplate, MotionValue } from 'framer-motion';

// 定义单个图片对象的数据结构，增加标题和描述
interface ImageItem {
  desktop: string;
  mobile: string;
  alt: string;
  title: string;
  description: string;
}

// 定义画廊组件的 Props
interface ScrollingImageGalleryProps {
  /**
   * 图片数组
   */
  images: ImageItem[];
  /**
   * 用于入场和出场缩放动画的滚动高度（像素）
   * @default 1500
   */
  introOutroScrollHeight?: number;
  /**
   * 用于每张图片横向滑动的滚动高度（像素）
   * @default 1000
   */
  slideScrollHeightPerImage?: number;
}


/**
 * 主组件，用于调用 ScrollingImageGallery
 */
export default function SmoothScrollHero() {
  // 为图片数据增加标题和描述
  const galleryImages: ImageItem[] = [
    {
      desktop: "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      mobile: "https://images.unsplash.com/photo-1511207538754-e8555f2bc187?q=80&w=2412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Misty forest with a river",
      title: "深入迷雾森林",
      description: "当第一道晨光穿透薄雾，森林的神秘画卷缓缓展开。每一次呼吸，都充满了自然的清新与宁静。"
    },
    {
      desktop: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      mobile: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Mountain lake with a wooden dock",
      title: "静谧的山间湖泊",
      description: "湖面倒映着天空的蔚蓝和山峦的沉稳。时间在这里仿佛静止，只剩下风声和心跳。"
    },
    {
      desktop: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      mobile: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      alt: "Green forest path in sunlight",
      title: "阳光穿透的林间小径",
      description: "沿着光影斑驳的小径前行，每一步都踏着希望。这是通往内心深处和平的旅程。"
    },
  ];

  return (
    <main className="bg-transparent text-white">
      <ScrollingImageGallery images={galleryImages} />
    </main>
  );
}

// 单个图片幻灯片的组件
const ImageSlide = ({
    image,
    index,
    scrollYProgress,
    introEndProgress,
    outroStartProgress,
    totalImages
}: {
    image: ImageItem;
    index: number;
    scrollYProgress: MotionValue<number>;
    introEndProgress: number;
    outroStartProgress: number;
    totalImages: number;
}) => {
    // --- 动画 1: 横向位移 ---
    const currentImageIndex = useTransform(
        scrollYProgress,
        [introEndProgress, outroStartProgress],
        [0, totalImages - 1]
    );
    const translateX = useTransform(
        currentImageIndex,
        (latest) => (index - latest) * 100 + '%'
    );

    // --- 动画 2: 画框裁剪 (clip-path) ---
    // 无条件调用所有 useTransform Hooks
    const initialFrame = { xStart: 10, yStart: 10, xEnd: 90, yEnd: 90 };
    const finalShrunkFrame = { xStart: 10, yStart: 40, xEnd: 90, yEnd: 85 };

    // 入场动画变换
    const introXStart = useTransform(scrollYProgress, [0, introEndProgress], [initialFrame.xStart, finalShrunkFrame.xStart]);
    const introYStart = useTransform(scrollYProgress, [0, introEndProgress], [initialFrame.yStart, finalShrunkFrame.yStart]);
    const introXEnd = useTransform(scrollYProgress, [0, introEndProgress], [initialFrame.xEnd, finalShrunkFrame.xEnd]);
    const introYEnd = useTransform(scrollYProgress, [0, introEndProgress], [initialFrame.yEnd, finalShrunkFrame.yEnd]);

    // 出场动画变换
    const outroXStart = useTransform(scrollYProgress, [outroStartProgress, 1], [finalShrunkFrame.xStart, initialFrame.xStart]);
    const outroYStart = useTransform(scrollYProgress, [outroStartProgress, 1], [finalShrunkFrame.yStart, initialFrame.yStart]);
    const outroXEnd = useTransform(scrollYProgress, [outroStartProgress, 1], [finalShrunkFrame.xEnd, initialFrame.xEnd]);
    const outroYEnd = useTransform(scrollYProgress, [outroStartProgress, 1], [finalShrunkFrame.yEnd, initialFrame.yEnd]);

    // 无条件创建运动模板
    const introClipPath = useMotionTemplate`polygon(${introXStart}% ${introYStart}%, ${introXEnd}% ${introYStart}%, ${introXEnd}% ${introYEnd}%, ${introXStart}% ${introYEnd}%)`;
    const outroClipPath = useMotionTemplate`polygon(${outroXStart}% ${outroYStart}%, ${outroXEnd}% ${outroYStart}%, ${outroXEnd}% ${outroYEnd}%, ${outroXStart}% ${outroYEnd}%)`;
    const middleClipPath = `polygon(${finalShrunkFrame.xStart}% ${finalShrunkFrame.yStart}%, ${finalShrunkFrame.xEnd}% ${finalShrunkFrame.yStart}%, ${finalShrunkFrame.xEnd}% ${finalShrunkFrame.yEnd}%, ${finalShrunkFrame.xStart}% ${finalShrunkFrame.yEnd}%)`;

    // --- 动画 3: 背景缩放 ---
    // 无条件调用所有 useTransform Hooks
    const introBackgroundSize = useTransform(scrollYProgress, [0, introEndProgress], ["100%", "170%"]);
    const outroBackgroundSize = useTransform(scrollYProgress, [outroStartProgress, 1], ["170%", "100%"]);

    // --- 动画 4: 文字淡入淡出 ---
    const textOpacity = useTransform(currentImageIndex, [index - 0.5, index, index + 0.5], [0, 1, 0]);

    // 根据条件 *分配* 结果，而不是调用 Hooks
    const clipPath = index === 0 ? introClipPath : (index === totalImages - 1 ? outroClipPath : middleClipPath);
    const backgroundSize = index === 0 ? introBackgroundSize : (index === totalImages - 1 ? outroBackgroundSize : "170%");

    return (
        <motion.div
            className="absolute top-0 h-full w-full"
            style={{ x: translateX, willChange: 'transform' }}
        >
            <motion.div
                className="absolute left-0 right-0 mx-auto w-11/12 max-w-lg text-center text-white top-[18%] sm:top-[15%] md:max-w-2xl"
                style={{ opacity: textOpacity }}
            >
                <h2 className="text-2xl font-bold sm:text-4xl md:text-5xl">{image.title}</h2>
                <p className="mt-2 text-sm sm:mt-4 sm:text-base md:text-lg text-gray-300">{image.description}</p>
            </motion.div>

            <motion.div
                className="h-full w-full relative"
                style={{ clipPath, willChange: 'clip-path' }}
            >
                <div className="h-full w-full relative bg-black">
                    <motion.div
                        className="absolute inset-0 md:hidden bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${image.mobile})`,
                            backgroundSize,
                        }}
                    />
                    <motion.div
                        className="absolute inset-0 hidden md:block bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${image.desktop})`,
                            backgroundSize,
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};


/**
 * 一个由滚动驱动的图片画廊组件。
 */
const ScrollingImageGallery: React.FC<ScrollingImageGalleryProps> = ({
  images,
  introOutroScrollHeight = 1500,
  slideScrollHeightPerImage = 1000,
}) => {
  const targetRef = React.useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: targetRef });

  const totalImages = images.length;
  const horizontalScrollHeight = (totalImages - 1) * slideScrollHeightPerImage;
  const totalScrollHeight = introOutroScrollHeight + horizontalScrollHeight + introOutroScrollHeight;
  
  const introEndProgress = introOutroScrollHeight / totalScrollHeight;
  const outroStartProgress = (introOutroScrollHeight + horizontalScrollHeight) / totalScrollHeight;

  return (
    <div ref={targetRef} style={{ height: `${totalScrollHeight}px` }} className="relative">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {images.map((img, index) => (
            <ImageSlide
                key={img.desktop}
                image={img}
                index={index}
                scrollYProgress={scrollYProgress}
                introEndProgress={introEndProgress}
                outroStartProgress={outroStartProgress}
                totalImages={totalImages}
            />
        ))}
      </div>
    </div>
  );
};
