// 该组件使用了 'use client' 指令，以兼容 Next.js 等框架的客户端渲染环境。
'use client';

import React, { forwardRef } from 'react';
// 从 CDN 导入 ReactLenis 组件以解决模块解析错误。
// Lenis 是一个用于实现平滑滚动效果的库。
// @ts-ignore 
import { ReactLenis } from 'https://esm.sh/@studio-freight/react-lenis';

// -- 核心滚动内容组件 --
// 使用 forwardRef 将 ref 从父组件传递到 DOM 元素（如此处的 <main>）。
// 这允许父组件直接访问 <main> 元素。
const ScrollContentInternal = forwardRef<HTMLElement>((props, ref) => {
  return (
    // <main> 标签作为滚动内容的主要容器。
    // ref 被附加到这里，以便 Lenis 可以控制其滚动行为。
    <main ref={ref}>
      <article>
        {/* 第一个部分：介绍 */}
        <section className='text-white h-screen w-full bg-slate-950 grid place-content-center sticky top-0'>
          {/* 背景网格效果 */}
          <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
          
          <h1 className='2xl:text-7xl text-6xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
            我知道你在找什么 <br /> 请向下滑动 👇
          </h1>
        </section>

        {/* 第二个部分：主要内容 */}
        <section className='bg-gray-300 text-black grid place-content-center h-screen sticky top-0 rounded-tr-2xl rounded-tl-2xl overflow-hidden'>
          {/* 背景网格效果 */}
          <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
          <h1 className='2xl:text-7xl text-4xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
            就是这个 <br /> 尽情享受吧!
          </h1>
        </section>

        {/* 第三个部分：结尾 */}
        <section className='text-white h-screen w-full bg-slate-950 grid place-content-center sticky top-0'>
          {/* 背景网格效果 */}
          <div className='absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:54px_54px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]'></div>
          <h1 className='2xl:text-7xl text-5xl px-8 font-semibold text-center tracking-tight leading-[120%]'>
            感谢您的滚动。
            <br /> 现在再向上滚动试试 ☝️🏿
          </h1>
        </section>
      </article>
    </main>
  );
});

// 为组件设置一个显示名称，这在 React DevTools 中很有用。
ScrollContentInternal.displayName = 'ScrollContentInternal';


// -- 主应用组件 --
// 这是最终导出的、功能完整的组件。
function ScrollContent() {
  return (
    // ReactLenis 组件是平滑滚动功能的“引擎”。
    // `root` 属性告诉 Lenis 将滚动效果应用于整个页面 (<html> 元素)。
    // 它会自动寻找子元素中的滚动容器并应用平滑效果。
    <ReactLenis root>
      {/* 渲染包含所有滚动内容的组件 */}
      <ScrollContentInternal />
    </ReactLenis>
  );
}

export default ScrollContent;
