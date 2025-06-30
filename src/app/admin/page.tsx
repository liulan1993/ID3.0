// 文件路径: src/app/admin/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Menu, X, FileText, PlusCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// import remarkGfm from 'remark-gfm'; // 暂时移除以解决编译问题

// --- 工具函数 ---
const cn = (...inputs: (string | boolean | null | undefined)[]) => {
  return inputs.filter(Boolean).join(' ');
};

// --- 类型定义 ---
interface LinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  action?: () => void; // 新增: 用于触发页面内操作
}

// 根据 route.ts 定义的文章数据结构
interface Article {
    id: string;
    title: string;
    markdownContent: string;
    coverImageUrl: string | null;
    authorEmail: string;
    createdAt: string;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

// --- 内置侧边栏组件定义 ---

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const SidebarProvider: React.FC<React.PropsWithChildren<{
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}>> = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

const Sidebar: React.FC<React.PropsWithChildren<{
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}>> = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

const SidebarBody: React.FC<React.ComponentProps<typeof motion.div>> = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

const DesktopSidebar: React.FC<React.ComponentProps<typeof motion.div>> = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0", className)}
      animate={{ width: animate ? (open ? "300px" : "72px") : "300px" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const MobileSidebar: React.FC<React.ComponentProps<"div">> = ({ className, children }) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-end bg-neutral-100 dark:bg-neutral-800 w-full")}>
        <Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} />
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn("fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between", className)}
            >
              <div className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)}>
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const SidebarLink: React.FC<{ link: LinkItem; className?: string; }> = ({ link, className }) => {
  const { open, animate } = useSidebar();
  const Component = link.action ? 'button' : 'a';

  return (
    <Component
      // href={link.href} // href is not a valid prop for button
      onClick={link.action}
      className={cn("flex items-center justify-start gap-4 group/sidebar py-2 w-full text-left", className)}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Component>
  );
};

const Logo: React.FC = () => (
    <div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20">
        <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black dark:text-white whitespace-pre">文章后台</motion.span>
    </div>
);

const LogoIcon: React.FC = () => (
    <div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20">
        <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
    </div>
);

// --- 新的文章编辑器组件 ---
const ArticleEditor: React.FC<{ onArticlePublished: () => void }> = ({ onArticlePublished }) => {
    const [markdownContent, setMarkdownContent] = useState('# 在这里写下您的文章标题\n\n在这里开始写作... 支持Markdown格式。\n\n**图片示例**:\n![风景](https://placehold.co/600x400/3B82F6/white?text=Image)\n\n**视频示例 (mp4)**:\n![视频](https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4)');
    const [authorEmail, setAuthorEmail] = useState('admin@example.com');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    const handlePublish = async () => {
        if (!markdownContent.trim() || !authorEmail.trim()) {
            setPublishError('文章内容和作者邮箱不能为空。');
            return;
        }
        setIsPublishing(true);
        setPublishError(null);

        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markdownContent, authorEmail }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '发布失败，请检查API服务。');
            }
            // 发布成功后，调用回调函数
            onArticlePublished();
        } catch (err: unknown) {
            if (err instanceof Error) {
                setPublishError(err.message);
            } else {
                setPublishError('发生未知错误');
            }
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">写新文章</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                {/* 编辑区 */}
                <div className="flex flex-col h-full">
                    <textarea
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        className="w-full flex-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 resize-none font-mono"
                        placeholder="在此输入Markdown..."
                    />
                </div>
                {/* 预览区 */}
                <div className="h-full bg-white dark:bg-gray-900 border rounded-lg overflow-y-auto p-4">
                    <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg prose-headings:text-white">
                        <ReactMarkdown /*remarkPlugins={[remarkGfm]}*/ components={{
                            img: (props) => {
                                if (typeof props.src === 'string' && (props.src.endsWith('.mp4') || props.src.endsWith('.webm') || props.src.endsWith('.ogg'))) {
                                    return (<div className="w-full aspect-video my-6"><video src={props.src} controls preload="metadata" className="w-full h-full rounded-lg">您的浏览器不支持播放该视频。</video></div>);
                                }
                                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                                return <img {...props} />;
                            },
                        }}>{markdownContent}</ReactMarkdown>
                    </article>
                </div>
            </div>
             {/* 发布操作区 */}
             <div className="mt-4 flex items-center gap-4">
                <input
                    type="email"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="作者邮箱"
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isPublishing ? '发布中...' : '发布文章'}
                </button>
                {publishError && <p className="text-red-500">{publishError}</p>}
            </div>
        </div>
    );
};

// --- 文章管理列表组件 ---
const ArticleList: React.FC<{ articles: Article[], isLoading: boolean, error: string | null }> = ({ articles, isLoading, error }) => (
    <div className="p-4 md:p-8 w-full h-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">文章管理</h1>
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th scope="col" className="px-6 py-3">封面图</th>
                        <th scope="col" className="px-6 py-3">标题</th>
                        <th scope="col" className="px-6 py-3">作者</th>
                        <th scope="col" className="px-6 py-3">发布日期</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (
                        <tr><td colSpan={4} className="text-center p-8 text-gray-500">正在加载文章...</td></tr>
                    ) : error ? (
                        <tr><td colSpan={4} className="text-center p-8 text-red-500">{error}</td></tr>
                    ) : articles.length === 0 ? (
                        <tr><td colSpan={4} className="text-center p-8 text-gray-500">暂无文章。</td></tr>
                    ) : (
                        articles.map((article) => (
                            <tr key={article.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="p-4">
                                    <img
                                        src={article.coverImageUrl || "https://placehold.co/100x100/EEE/333?text=No-Image"}
                                        alt={article.title}
                                        width={80}
                                        height={80}
                                        className="rounded-md object-cover w-20 h-20"
                                    />
                                </td>
                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{article.title}</th>
                                <td className="px-6 py-4">{article.authorEmail}</td>
                                <td className="px-6 py-4">{new Date(article.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
);


// --- 主页面组件 (集成视图切换逻辑) ---

export default function AdminPage() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'list' | 'editor'>('list'); // 'list' 或 'editor'
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchArticles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('获取文章数据失败');
            // kv返回的数据可能是字符串，需要解析
            const data = await response.json();
            const parsedArticles = data.map((item: unknown) => {
                if (typeof item === 'string') {
                    try {
                        return JSON.parse(item);
                    } catch(e) {
                        console.error("Failed to parse article JSON:", item, e);
                        return null;
                    }
                }
                return item;
            }).filter((item: unknown): item is Article => item !== null); // 过滤掉解析失败的项目
            setArticles(parsedArticles);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('发生未知错误');
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (view === 'list') {
            fetchArticles();
        }
    }, [view]);

    // 定义导航链接，并添加切换视图的 action
    const adminLinks: LinkItem[] = [
        {
            label: "文章管理",
            href: "#",
            icon: <FileText className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
            action: () => setView('list'),
        },
        {
            label: "写新文章",
            href: "#",
            icon: <PlusCircle className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
            action: () => setView('editor'),
        },
        {
            label: "系统设置",
            href: "#",
            icon: <Settings className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />,
            action: () => alert('设置功能待开发'),
        },
    ];

    const userData = { name: "管理员", href: "#", avatarUrl: "https://placehold.co/100x100/E5E7EB/4B5563?text=A" };
    const userLink = {
        label: userData.name, href: "#",
        icon: (<img src={userData.avatarUrl} className="h-7 w-7 flex-shrink-0 rounded-full" width={50} height={50} alt="avatar" />)
    };

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto">
                        <div className='px-2 py-1'>{open ? <Logo /> : <LogoIcon />}</div>
                        <div className="mt-8 flex flex-col gap-2">
                            {adminLinks.map((link, idx) => (<SidebarLink key={idx} link={link} />))}
                        </div>
                    </div>
                    <div><SidebarLink link={userLink} /></div>
                </SidebarBody>
            </Sidebar>

            <main className="flex-1 bg-white dark:bg-neutral-900 flex">
                 {/* 根据 view 状态条件渲染不同组件 */}
                {view === 'list' ? (
                    <ArticleList articles={articles} isLoading={isLoading} error={error} />
                ) : (
                    <ArticleEditor onArticlePublished={() => {
                        alert('文章发布成功！');
                        setView('list'); // 发布成功后切换回列表视图
                    }} />
                )}
            </main>
        </div>
    );
}
