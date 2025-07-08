// src/components/ui/CustomFooter.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Slot } from '@radix-ui/react-slot';

// ============================================================================
// 0. 工具函数和依赖组件 (为了使组件独立)
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  legacyBehavior?: boolean;
  passHref?: boolean;
}

const Link = ({ href, children, legacyBehavior, ...props }: CustomLinkProps) => {
    if (legacyBehavior) {
        const child = React.Children.only(children) as React.ReactElement;
        const newProps = { ...props, href };
        return React.cloneElement(child, newProps);
    }
    return <a href={href} {...props}>{children}</a>;
};
Link.displayName = "Link";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-white/90",
        destructive: "bg-red-500 text-slate-50 hover:bg-red-500/90",
        outline: "border border-slate-700 bg-transparent hover:bg-slate-800",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        ghost: "hover:bg-slate-800 hover:text-slate-50",
        link: "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-slate-700 bg-black px-3 py-2 text-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:cursor-not-allowed disabled:opacity-50',
          "text-base md:text-lg",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const Label = React.forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'>
>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn('font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />
));
Label.displayName = 'Label';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const XiaohongshuIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.273 18.818H18.18v-3.09h-2.181v3.09h-3.09v2.182h3.09v3.091h2.182v-3.09h3.09v-2.182zM4.364 3.818h4.363V2.727H4.364v1.091zm4.363 9.818H4.364v1.091h4.363v-1.09zM15.455 6h-2.182v1.09h2.182V6zm-5.455 6H5.455v1.09h4.545V6zm-1.09 9.818H4.364v1.09h4.545v-1.09zm5.454-3.272H4.364v1.09h9.818v-1.09zM4.364 9.273h9.818v1.09H4.364v-1.09z"/>
  </svg>
);
XiaohongshuIcon.displayName = "XiaohongshuIcon";

const ZhihuIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.57,19.38L21.57,19.38l-4.48,0c-0.34,0-0.62-0.28-0.62-0.62v-4.44h-2.5v4.44c0,0.34-0.28,0.62-0.62,0.62H8.85c-0.34,0-0.62-0.28-0.62-0.62v-4.44H5.73v4.44c0,0.34-0.28,0.62-0.62,0.62H2.43c-0.34,0-0.62-0.28-0.62-0.62V5.24c0-0.34,0.28-0.62,0.62-0.62h11.23l0,0l0,0l4.5,0c0.34,0,0.62,0.28,0.62,0.62v13.52C22.19,19.1,21.91,19.38,21.57,19.38z M9.47,12.11H5.73V7.1h3.74V12.11z M15.47,12.11h-3.74V7.1h3.74V12.11z"/>
  </svg>
);
ZhihuIcon.displayName = "ZhihuIcon";

const DouyinIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M16.6 5.82s.51.5 1.63.5c1.43 0 2.5-.9 2.5-2.55s-1.06-2.46-2.5-2.46C16.6.31 15.14 2.1 15.14 4.16v7.35c0 2.9-2.23 4.88-5.22 4.88-2.51 0-4.62-1.74-4.62-4.52s2.11-4.52 4.62-4.52c.2 0 .4.02.59.05v2.1c-.2-.03-.39-.05-.59-.05-1.34 0-2.5.95-2.5 2.42s1.16 2.42 2.5 2.42c1.73 0 3.03-1.2 3.03-3.2V5.82z"/>
  </svg>
);
DouyinIcon.displayName = "DouyinIcon";

const BilibiliIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2.5 14.5v-9l6 4.5-6 4.5z"/>
  </svg>
);
BilibiliIcon.displayName = "BilibiliIcon";

// ============================================================================
// 1. 页脚主组件
// ============================================================================

/**
 * 处理平滑滚动到指定ID元素的函数
 * @param e - 鼠标事件
 * @param id - 目标元素的ID
 */
const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth', // 平滑滚动
      block: 'start',      // 滚动到元素顶部
    });
  }
};

export default function CustomFooter() {
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

    const socialIcons = [
      { name: '小红书', icon: <XiaohongshuIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/xiaohongshu.png', url: 'https://www.xiaohongshu.com/user/profile/6624755f00000000030303c2' },
      { name: '知乎', icon: <ZhihuIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/sara.png', url: 'https://www.zhihu.com/org/apex-elite-service' },
      { name: '抖音', icon: <DouyinIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/wenjing.png', url: 'https://www.douyin.com' },
      { name: '哔哩哔哩', icon: <BilibiliIcon className="h-5 w-5" />, qrcode: 'https://zh.apex-elite-service.com/wenjian/mengchen.png', url: 'https://www.bilibili.com' },
    ];

    return (
      <footer className="bg-transparent text-white py-12 mt-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold tracking-tight mb-4">官方公众号</h2>
            <div className="mb-8 w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-gray-800/20 border border-slate-700 rounded-lg flex items-center justify-center p-2">
              <Image
                src="https://zh.apex-elite-service.com/wenjian/weixingongzhonghao.png"
                alt="官方公众号二维码"
                width={280}
                height={280}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <nav className="mb-8 flex flex-wrap justify-center gap-6 text-neutral-300 text-base md:text-lg">
              <Link href="#" onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-white">Apex</Link>
              <Link href="#study-abroad-education" onClick={(e) => handleScrollTo(e, 'study-abroad-education')} className="hover:text-white">留学</Link>
              <Link href="#health-management" onClick={(e) => handleScrollTo(e, 'health-management')} className="hover:text-white">医疗</Link>
              <Link href="#corporate-services" onClick={(e) => handleScrollTo(e, 'corporate-services')} className="hover:text-white">企业服务</Link>
              <Link href="#" className="hover:text-white">敬请期待</Link>
            </nav>
            <div className="mb-8 flex space-x-4">
              {socialIcons.map((social) => (
                 <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "relative",
                      hoveredIcon === social.name ? "z-50" : "z-0"
                    )}
                    onMouseEnter={() => setHoveredIcon(social.name)}
                    onMouseLeave={() => setHoveredIcon(null)}
                  >
                    <Button variant="outline" size="icon" className="rounded-full">
                      {social.icon}
                      <span className="sr-only">{social.name}</span>
                    </Button>
                    {hoveredIcon === social.name && (
                      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-36 h-36 bg-white border rounded-md shadow-lg p-1 flex items-center justify-center">
                        <Image src={social.qrcode} alt={`${social.name} QR Code`} width={136} height={136} className="w-full h-full object-cover" />
                      </div>
                    )}
                 </a>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-sm text-neutral-400">
                © 2024 Your Company. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    );
}
