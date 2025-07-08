// src/app/page.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, ArrowRight, Check, X } from 'lucide-react';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from '@radix-ui/react-slot';


// --- 组件路径 ---
import AppNavigationBar from '@/components/ui/header';
import OpeningAnimation from '@/components/ui/opening-animation';
import MainScene from '@/components/ui/main-scene';
import HomePageTitle from '@/components/ui/home-page-title';
import Testimonials from '@/components/ui/testimonials';
import CorporateServicesTimeline from '@/components/ui/CorporateServicesTimeline';
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
// 1. 从 old-page.tsx 迁移过来的组件及其依赖
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

// Button 组件
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
          </div>
        </div>
      </div>
    </div>
  );
};
ProjectShowcase.displayName = "ProjectShowcase";


// --- 带模型图的信息卡片区域组件 ---
interface InfoSectionProps {
    title: string | React.ReactNode;
    description: string | React.ReactNode;
    primaryImageSrc: string;
    secondaryImageSrc: string;
    reverseLayout?: boolean;
    className?: string;
}

const InfoSectionWithMockup: React.FC<InfoSectionProps> = ({
    title,
    description,
    primaryImageSrc,
    secondaryImageSrc,
    reverseLayout = false,
    className,
}) => {
    const containerVariants: Variants = {
        hidden: {},
        visible: {
             transition: {
                staggerChildren: 0.2,
            }
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
    };

    const layoutClasses = reverseLayout
        ? "md:grid-cols-2 md:grid-flow-col-dense"
        : "md:grid-cols-2";

    const textOrderClass = reverseLayout ? "md:col-start-2" : "";
    const imageOrderClass = reverseLayout ? "md:col-start-1" : "";

    return (
        <section className={cn("relative py-24 md:py-32 bg-transparent overflow-hidden", className)}>
            <div className="container max-w-[1220px] w-full px-6 md:px-10 relative z-10 mx-auto">
                <motion.div
                     className={`grid grid-cols-1 gap-16 md:gap-8 w-full items-center ${layoutClasses}`}
                     variants={containerVariants}
                     initial="hidden"
                     whileInView="visible"
                     viewport={{ once: true, amount: 0.2 }}
                >
                    <motion.div
                        className={cn(
                            "flex flex-col justify-center gap-4 mt-10 md:mt-0",
                            textOrderClass,
                            "items-center text-center",
                            reverseLayout ? "md:items-end md:text-right" : "md:items-start md:text-left"
                        )}
                        variants={itemVariants}
                    >
                         <div className="space-y-2 md:space-y-1">
                            <h2 className="text-white text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                                {title}
                            </h2>
                        </div>
                        <p className="text-[#868f97] leading-6 text-base md:text-lg">
                            {description}
                        </p>
                    </motion.div>
                    <motion.div
                        className={cn(
                            "relative mt-10 md:mt-0 mx-auto w-full max-w-[300px] md:max-w-[471px]",
                            imageOrderClass,
                            reverseLayout ? "md:justify-self-end" : "md:justify-self-start"
                         )}
                        variants={itemVariants}
                    >
                        <motion.div
                             className={`absolute w-[300px] h-[317px] md:w-[472px] md:h-[500px] bg-[#090909] rounded-[32px] z-0`}
                             style={{
                                top: reverseLayout ? 'auto' : '10%',
                                bottom: reverseLayout ? '10%' : 'auto',
                                left: reverseLayout ? 'auto' : '-5%',
                                right: reverseLayout ? '-5%' : 'auto',
                                transform: reverseLayout ? 'translate(0, 0)' : 'translateY(10%)',
                                filter: 'blur(2px)'
                            }}
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? -20 : -30 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div
                                className="relative w-full h-full bg-cover bg-center rounded-[32px]"
                                style={{
                                    backgroundImage: `url(${secondaryImageSrc})`,
                                }}
                            />
                        </motion.div>
                        <motion.div
                            className="relative w-full h-[405px] md:h-[637px] bg-[#ffffff0a] rounded-[32px] backdrop-blur-[15px] backdrop-brightness-[100%] border-0 z-10 overflow-hidden"
                            initial={{ y: reverseLayout ? 0 : 0 }}
                            whileInView={{ y: reverseLayout ? 20 : 30 }}
                             transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                             viewport={{ once: true, amount: 0.5 }}
                        >
                             <Image
                                src={primaryImageSrc}
                                alt={typeof title === 'string' ? title : 'Info Section Image'}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes="(max-width: 768px) 100vw, 50vw"
                            />
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
InfoSectionWithMockup.displayName = "InfoSectionWithMockup";

// --- 常见问题 (FAQ) 组件 ---
const FaqItem = React.forwardRef<
  HTMLDivElement,
  {
    question: string;
    answer: string;
    index: number;
  }
>(({ question, answer, index }, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      className={cn(
        "group rounded-lg",
        "transition-all duration-200 ease-in-out",
        "border border-white/10"
      )}
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 h-auto justify-between hover:bg-transparent"
      >
        <h3
          className={cn(
            "text-base md:text-lg font-medium transition-colors duration-200 text-left",
            "text-white",
            isOpen && "text-white"
          )}
        >
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "p-0.5 rounded-full flex-shrink-0",
            "transition-colors duration-200",
            isOpen ? "text-white" : "text-neutral-400"
          )}
        >
          <ChevronDownIcon className="h-4 w-4" /> 
        </motion.div>
      </Button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: "easeIn" },
            }}
          >
            <div className="px-6 pb-4 pt-2">
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-base md:text-lg text-neutral-400 leading-relaxed"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
FaqItem.displayName = "FaqItem";

interface FaqSectionProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    question: string;
    answer: string;
  }[];
}

const FaqSection = React.forwardRef<HTMLElement, FaqSectionProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn("w-full", className)}
        {...props}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {items.map((item, index) => (
              <FaqItem
                key={index}
                question={item.question}
                answer={item.answer}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }
);
FaqSection.displayName = "FaqSection";

// --- 产品定价组件 ---
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const PricingSection = () => {
    const plans = [
      {
        name: "健康数据纵向分析",
        description: "为您解读历年体检报告中隐藏的“趋势密码”，将孤立的数据点整合成清晰的动态趋势图，赋能您与医生进行更高质量的沟通。",
        features: [
          "历年体检报告数据整合",
          "关键健康指标趋势分析",
          "深度洞察报告解读",
        ],
      },
      {
        name: "溯源式体检规划",
        description: "我们不仅是定制，更是溯源。通过追溯您健康趋势、家族史与生活方式的源头，我们为您设计真正针对“根本问题”的年度体检方案，让筛查更具前瞻性与目的性。",
        features: [
          "溯源式年度方案设计",
          "高风险项深度筛查建议",
          "顶尖体检机构预约协助",
        ],
      },
    ];

    return (
        <div className="w-full py-0 font-sans">
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center gap-6 text-center mt-10">
                    <div className="flex flex-col gap-2">
                        <h3 className="text-2xl md:text-3xl font-semibold text-white">
                            核心服务详情
                            <br />
                            Core Service Details
                        </h3>
                        <p className="max-w-2xl text-base md:text-lg text-neutral-300">
                            您可以清晰地看到我们提供的不同服务计划，帮助您选择最适合您的需求的方案。
                        </p>
                    </div>
                </div>

                <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-2">
                    {plans.map((plan) => (
                        <Card
                            key={plan.name}
                            className="flex h-full flex-col bg-transparent border-neutral-700"
                        >
                            <CardHeader className="p-6 pb-4 text-center">
                                <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                                <CardDescription className="text-base md:text-lg text-neutral-300 mt-2">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-1 flex-col justify-between gap-6 p-6 pt-0">
                                <div className="flex-grow">
                                    <div className="flex flex-col gap-4 mt-4 items-center">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex flex-row items-start gap-3">
                                                <Check className="h-5 w-5 flex-shrink-0 text-green-500 mt-1" />
                                                <p className="text-base md:text-lg text-neutral-300">{feature}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};
PricingSection.displayName = "PricingSection";

// --- 对话框组件 ---
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-800 bg-black p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground text-white">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// --- 行动号召(CTA)区域组件 ---
const CtaWithGallerySection = () => {
    const [step, setStep] = useState(0);

    const steps = [
      {
        title: "我们从深度对话开始",
        description: "在Apex，任何伟大的合作都始于一次不设时限的深度对话。我们坚持先聆听您的故事与蓝图，而非直接提供方案。因为我们坚信，真正的解决方案，源自对您独特需求的深刻理解。",
      },
      {
        title: "您的专属战略路径图",
        description: "我们不提供标准化的“产品套餐”。无论是您的商业架构、子女的教育路径，还是家庭的健康规划，我们都将为您量身定制一套清晰、可行、且完全符合您长远目标的战略路径图。",
      },
      {
        title: "从0到1，从1到无限",
        description: "我们不仅陪伴您完成从0到1的落地，更致力于在您从1走向无限的征途中，持续提供战略支持。我们的服务体系具有高度的延展性，能伴随您事业与家族的成长，不断演进。",
      },
      {
        title: "欢迎加入一个值得信赖的生态圈",
        description: "选择Apex，意味着您不仅选择了一家服务机构，更是加入了一个由顶尖企业家、行业专家和稀缺资源构成的生态网络。欢迎与我们联系，开启您在新加坡的全新可能。",
      },
    ];
  
    const next = () => {
      if (step < steps.length - 1) setStep(step + 1);
    };

    const containerVariants: Variants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    };

    return (
        <section className="py-24 md:py-32 bg-transparent">
            <div className="container mx-auto px-4 md:px-8">
                <motion.div
                    className="text-center"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                >
                    <motion.h2 variants={itemVariants} className="text-white mb-4 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                        开启您在新加坡的全新篇章
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-neutral-300 max-w-2xl mx-auto mb-8 text-base md:text-lg">
                        一切伟大的事业，都始于一次深度的战略对话。欢迎预约与我们进行一对一沟通，共同擘画您在新加坡的商业与家族蓝图。
                    </motion.p>
                    <motion.div variants={itemVariants} className="flex justify-center">
                      <Dialog onOpenChange={(open) => !open && setStep(0)}>
                        <DialogTrigger asChild>
                           <HalomotButton 
                             inscription="远见之上，从容有道" 
                             onClick={() => {}} 
                             backgroundColor='#161616' 
                             hoverTextColor='#fff' 
                             gradient='linear-gradient(to right, #603dec, #a123f4)'
                           />
                        </DialogTrigger>
                        <DialogContent
                            className={cn(
                                "w-[95vw] sm:w-full max-w-3xl",
                                "max-h-[90vh]",
                                "p-0 overflow-hidden rounded-xl border-neutral-800 shadow-2xl",
                                "bg-black text-white",
                                "flex flex-col",
                                "data-[state=open]:animate-none data-[state=closed]:animate-none"
                            )}
                        >
                            <div className="flex-grow overflow-y-auto">
                                <div className="flex flex-col md:flex-row w-full">
                                    <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-neutral-800">
                                        <div className="flex flex-col gap-3">
                                            <Image
                                                src="https://zh.apex-elite-service.com/wenjian/logo-1.png"
                                                alt="Logo"
                                                width={48}
                                                height={48}
                                                className="w-12 h-12 rounded-full border-4 border-neutral-800"
                                                unoptimized
                                            />
                                            <h2 className="text-lg font-medium">我们如何与您同行</h2>
                                            <p className="text-sm text-neutral-400">
                                                我们提供的，是一种超越传统服务的、专为顶尖人士设计的全新解决方案。
                                            </p>
                                            <div className="flex flex-col gap-3 mt-6">
                                                {steps.map((s, index) => (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                    "flex items-center gap-2 text-sm transition-opacity",
                                                    index === step
                                                        ? "font-semibold text-white"
                                                        : "opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    {index < step ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                                                    )}
                                                    <span className="font-normal">{s.title}</span>
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-2/3 p-8">
                                        <div className="space-y-4">
                                            <DialogHeader>
                                                <AnimatePresence mode="wait">
                                                <motion.h2
                                                    key={steps[step].title}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="text-2xl font-medium"
                                                >
                                                    {steps[step].title}
                                                </motion.h2>
                                                </AnimatePresence>
                                                <div className="min-h-[60px]">
                                                    <AnimatePresence mode="wait">
                                                        <motion.p
                                                        key={steps[step].description}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="text-neutral-400 text-base"
                                                        >
                                                        {steps[step].description}
                                                        </motion.p>
                                                    </AnimatePresence>
                                                </div>
                                            </DialogHeader>
                                            <div className="w-full h-60 bg-neutral-900 rounded-lg flex items-center justify-center overflow-hidden">
                                                <Image
                                                src="https://zh.apex-elite-service.com/wenjian/12-1.jpg"
                                                alt="Step Visual"
                                                width={200}
                                                height={200}
                                                className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-shrink-0 p-6 border-t border-neutral-800 bg-black">
                                <div className="flex justify-between items-center">
                                    <DialogClose asChild>
                                        <Button variant="outline">返回</Button>
                                    </DialogClose>
                                    {step < steps.length - 1 ? (
                                        <Button variant="outline" onClick={next}>
                                        继续
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <DialogClose asChild>
                                        <Button variant="outline">主页</Button>
                                        </DialogClose>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                      </Dialog>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
CtaWithGallerySection.displayName = "CtaWithGallerySection";

// --- 分屏滚动动画区域组件 ---
function ScrollAdventure() {
  const [currentPage, setCurrentPage] = useState(1);
  const numOfPages = scrollAnimationPages.length;
  const animTime = 1000;
  const scrolling = useRef(false);
  const touchStartY = useRef(0);
  const componentRef = useRef<HTMLDivElement>(null);

  const navigateUp = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const navigateDown = useCallback(() => {
    if (currentPage < numOfPages) {
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, numOfPages]);

  const handleScroll = useCallback((deltaY: number) => {
      if (scrolling.current) return;
      scrolling.current = true;
      if (deltaY > 0) {
        navigateDown();
      } else {
        navigateUp();
      }
      setTimeout(() => {
        scrolling.current = false;
      }, animTime);
  }, [navigateDown, navigateUp]);

  useEffect(() => {
    const scrollComponent = componentRef.current;
    if (!scrollComponent) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScroll(e.deltaY);
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touchEndY = e.changedTouches[0].clientY;
        const deltaY = touchEndY - touchStartY.current;
        if(Math.abs(deltaY) > 50) {
            handleScroll(-deltaY);
            touchStartY.current = touchEndY;
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        const rect = scrollComponent.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;

        if (isVisible && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            handleScroll(e.key === 'ArrowDown' ? 1 : -1);
        }
    };
    
    scrollComponent.addEventListener('wheel', handleWheel, { passive: false });
    scrollComponent.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollComponent.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      scrollComponent.removeEventListener('wheel', handleWheel);
      scrollComponent.removeEventListener('touchstart', handleTouchStart);
      scrollComponent.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll]);

  return (
    <div 
      ref={componentRef} 
      className="relative overflow-hidden w-full max-w-6xl mx-auto bg-transparent font-[Helvetica] rounded-2xl border-none aspect-[1/2] lg:aspect-[2/1]"
    >
      {scrollAnimationPages.map((page, i) => {
        const idx = i + 1;
        const isActive = currentPage === idx;
        
        return (
          <div key={idx} className="absolute inset-0 flex flex-col lg:flex-row">
            <div
              className={cn(
                "w-full h-1/2 lg:w-1/2 lg:h-full",
                "transition-transform duration-[1000ms] ease-in-out",
                isActive ? 'translate-x-0' : '-translate-x-full'
              )}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: page.leftBgImage ? `url(${page.leftBgImage})` : 'none', 
                  backgroundColor: 'transparent' 
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-4 md:p-8">
                  {page.leftContent && (
                    <div className="text-center">
                      <h2 className="mb-4 tracking-widest text-2xl md:text-3xl font-semibold">
                        {page.leftContent.heading}
                      </h2>
                      <p className="text-base md:text-lg">
                        {page.leftContent.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div
              className={cn(
                "w-full h-1/2 lg:w-1/2 lg:h-full",
                "transition-transform duration-[1000ms] ease-in-out",
                isActive ? 'translate-x-0' : 'translate-x-full'
              )}
            >
              <div
                className="w-full h-full bg-cover bg-center bg-no-repeat"
                style={{ 
                  backgroundImage: page.rightBgImage ? `url(${page.rightBgImage})` : 'none', 
                  backgroundColor: 'transparent' 
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-white p-4 md:p-8">
                  {page.rightContent && (
                     <div className="text-center">
                      <h2 className="mb-4 tracking-widest text-2xl md:text-3xl font-semibold">
                        {page.rightContent.heading}
                      </h2>
                       <div className="text-base md:text-lg">
                          {page.rightContent.description}
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
ScrollAdventure.displayName = "ScrollAdventure";

// --- 文本揭示卡片组件 ---
const Stars = () => {
  const randomMove = () => Math.random() * 4 - 2;
  const randomOpacity = () => Math.random();
  const random = () => Math.random();
  return (
    <div className="absolute inset-0">
      {[...Array(80)].map((_, i) => (
        <motion.span
          key={`star-${i}`}
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0],
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            backgroundColor: "white",
            borderRadius: "50%",
            zIndex: 1,
          }}
          className="inline-block"
        ></motion.span>
      ))}
    </div>
  );
};
const MemoizedStars = memo(Stars);
MemoizedStars.displayName = "MemoizedStars";

const TextRevealCardTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2 className={cn("text-white text-lg mb-2", className)}>
      {children}
    </h2>
  );
};
TextRevealCardTitle.displayName = "TextRevealCardTitle";

const TextRevealCardDescription = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={cn("text-[#a9a9a9] text-sm", className)}>{children}</p>
  );
};
TextRevealCardDescription.displayName = "TextRevealCardDescription";

const TextRevealCard = ({
  text,
  revealText,
  children,
  className,
}: {
  text: string;
  revealText: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const [widthPercentage, setWidthPercentage] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState(0);
  const [localWidth, setLocalWidth] = useState(0);
  const [isMouseOver, setIsMouseOver] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      const { left, width } = cardRef.current.getBoundingClientRect();
      setLeft(left);
      setLocalWidth(width);
    }
    const handleResize = () => {
        if (cardRef.current) {
            const { left, width } = cardRef.current.getBoundingClientRect();
            setLeft(left);
            setLocalWidth(width);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    }
  }, []);

  const mouseMoveHandler = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (cardRef.current) {
      const relativeX = event.clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  };

  const touchMoveHandler = (event: React.TouchEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const relativeX = event.touches[0].clientX - left;
      setWidthPercentage((relativeX / localWidth) * 100);
    }
  };

  const mouseLeaveHandler = () => {
    setIsMouseOver(false);
    setWidthPercentage(0);
  };

  const mouseEnterHandler = () => {
    setIsMouseOver(true);
  };

  const rotateDeg = (widthPercentage - 50) * 0.1;

  return (
    <div
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
      onMouseMove={mouseMoveHandler}
      onTouchStart={mouseEnterHandler}
      onTouchEnd={mouseLeaveHandler}
      onTouchMove={touchMoveHandler}
      ref={cardRef}
      className={cn(
        "bg-transparent w-full rounded-lg p-8 relative overflow-hidden",
        className
      )}
    >
      {children}

      <div className="h-40 relative flex items-center overflow-hidden">
        <motion.div
          style={{ width: "100%" }}
          animate={
            isMouseOver
              ? {
                  opacity: widthPercentage > 0 ? 1 : 0,
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
                }
              : {
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
                }
          }
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="absolute bg-transparent z-20 will-change-transform"
        >
          <p
            style={{ textShadow: "4px 4px 15px rgba(0,0,0,0.5)" }}
            className="py-10 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px] text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-300"
          >
            {revealText}
          </p>
        </motion.div>
        <motion.div
          animate={{
            left: `${widthPercentage}%`,
            rotate: `${rotateDeg}deg`,
            opacity: widthPercentage > 0 ? 1 : 0,
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent absolute z-50 will-change-transform"
        ></motion.div>
        <motion.div
          animate={{
            clipPath: `inset(0 0 0 ${widthPercentage}%)`
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
          className="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)] w-full"
        >
          <p className="py-10 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px] bg-clip-text text-transparent bg-[#323238]">
            {text}
          </p>
          <MemoizedStars />
        </motion.div>
      </div>
    </div>
  );
};
TextRevealCard.displayName = "TextRevealCard";


// ============================================================================
// 2. 静态数据
// ============================================================================
const infoSectionData1 = {
    title: ( <> 健康管理 <br /> Health Management </> ),
    description: ( <> 我相信，健康是承载事业版图与人生品质的终极资产，Apex传承于生命管理的独特基因，我们不提供诊疗，而是您最值得信赖的健康战略家与医疗资源导航员，致力于助您主动掌控健康，预见未来。 </> ),
    primaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/8-1.png',
    secondaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/9.jpg',
};

const faqData = [
    { question: "中新跨境就医服务", answer: "无论是您希望从新加坡回到中国寻求顶级诊疗，还是从中国来到新加坡链接全球领先的医疗资源，我们都能为您提供无缝的跨境支持，打破地域与信息壁垒。" },
    { question: "一站式行程与陪诊", answer: "我们为您处理从机票酒店预订、地面交通到专业双语陪诊的全程细节，让您可以完全专注于康复与治疗，心无旁骛。" },
    { question: "顶尖专家预约", answer: "凭借我们深耕两地的稀缺名医资源网络，我们将协助您预约到通常需要漫长等待的顶尖专家，为您赢得最宝贵的健康时机。" },
    { question: "全程住院与理赔支持", answer: "我们的服务将延伸至您诊疗结束之后，提供包括住院流程协助、多学科会诊推进以及关键的保险理赔流程支持等全面的后续保障。" },
];

const infoSectionData2 = {
    title: ( <> 溯源式体检 <br /> In-Depth Health </> ),
    description: ( <> 每年的体检报告，不应只是一份被存档的文件，唯将历年数据串联，发现健康趋势的真正秘密，Apex独特有溯源体检服务，为您解读生命数据，将未来的不确定性，转化为尽在掌握的主动权。 </> ),
    primaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/10-1.jpg',
    secondaryImageSrc: 'https://zh.apex-elite-service.com/wenjian/11.jpg',
};

const scrollAnimationPages = [
  { leftBgImage: 'https://zh.apex-elite-service.com/wenjian/13.jpg', rightBgImage: null, leftContent: null, rightContent: { heading: '首席伙伴', description: '我们凭借在中新两地的实体团队，真正实现了服务的无缝衔接。无论您身在国内还是已在新加坡，都能随时与我们的本地成员当面沟通，确保服务“不掉线”。作为您长期的首席合伙人，为您节省巨大的时间与沟通成本。' } },
  { leftBgImage: null, rightBgImage: 'https://zh.apex-elite-service.com/wenjian/14-1.jpg', leftContent: { heading: '安心保障', description: '我们郑重承诺：24小时内回复，紧急事务2小时内响应。所有价格透明，无隐形消费。您将拥有一位专属项目合伙人，全程为您负责。' }, rightContent: null },
  { leftBgImage: 'https://zh.apex-elite-service.com/wenjian/15-1.jpg', rightBgImage: null, leftContent: null, rightContent: { heading: '服务流程', description: '我们的合作始于深度保密的咨询，以全面理解您的需求。随后，专家团队将为您量身定制方案，在执行中协调所有细节，并随时汇报进展。' } },
  { leftBgImage: null, rightBgImage: 'https://zh.apex-elite-service.com/wenjian/16.jpg', leftContent: { heading: '即刻启程', description: '纸上得来终觉浅，绝知此事要躬行。立即联系我们，开启一次专属的战略性探讨，让我们为您在新加坡的成功保驾护航。' }, rightContent: null },
];

// ============================================================================
// 3. 主页面组件
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
                            
                            <div id="corporate-services">
                                <CorporateServicesTimeline />
                            </div>

                            <div id="study-abroad-education" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <ProjectShowcase 
                                    testimonials={projectShowcaseData}
                                    onProtectedLinkClick={handleProtectedLinkClick}
                                />
                            </div>

                            <div id="health-management">
                                <InfoSectionWithMockup {...infoSectionData1} />
                            </div>
                            
                            <div className="py-16 px-8 flex flex-col justify-center items-center">
                                <FaqSection items={faqData} className="w-full max-w-4xl"/>
                            </div>

                            <InfoSectionWithMockup
                                {...infoSectionData2}
                                reverseLayout={true}
                                className="pt-24 md:pt-32 pb-0"
                            />
                            
                            <div className="pt-0 px-8 flex flex-col items-center">
                              <PricingSection />
                            </div>

                            <CtaWithGallerySection />
                            
                            <div className="py-24 px-8 flex flex-col justify-center items-center">
                                <div className="text-center mb-12">
                                    <h2 className="text-white mb-4 text-3xl md:text-[40px] font-semibold leading-tight md:leading-[53px]">
                                        我们的承诺与流程
                                    </h2>
                                    <p className="text-neutral-300 max-w-2xl mx-auto text-base md:text-lg">
                                        探索我们如何通过透明、高效的流程，为您在新加坡的旅程保驾护航。
                                    </p>
                                </div>
                                <ScrollAdventure />
                            </div>

                            <div className="py-12 md:py-20 flex items-center justify-center">
                                <TextRevealCard
                                    text="真正的价值，蕴藏于深度对话之中。"
                                    revealText="与我们同行，让您的卓越在新加坡从容绽放。"
                                    className="w-full max-w-4xl"
                                >
                                    <TextRevealCardTitle className="text-2xl font-bold">
                                    洞见未来，共谱新章
                                    </TextRevealCardTitle>
                                    <TextRevealCardDescription className="text-base md:text-lg">
                                    我们深知，每一个伟大的决策，都需要前瞻性的洞察与值得信赖的伙伴。Apex将两者融为一体，陪伴您开启未来。
                                    </TextRevealCardDescription>
                                </TextRevealCard>
                            </div>

                            {/* --- 新组件插入结束 --- */}

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
