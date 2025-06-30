// 文件路径: src/app/admin/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Menu, X, FileText, PlusCircle, Trash2, Edit } from 'lucide-react'; // 新增图标
import ReactMarkdown from 'react-markdown';

// --- 工具函数 ---
const cn = (...inputs: (string | boolean | null | undefined)[]) => {
  return inputs.filter(Boolean).join(' ');
};

// --- 类型定义 ---
interface LinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  action?: () => void;
}

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

// --- 内置侧边栏组件定义 (无改动) ---
const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);
const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};
const SidebarProvider: React.FC<React.PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>> = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  return (<SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>);
};
const Sidebar: React.FC<React.PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>> = ({ children, open, setOpen, animate }) => (<SidebarProvider open={open} setOpen={setOpen} animate={animate}>{children}</SidebarProvider>);
const SidebarBody: React.FC<React.ComponentProps<typeof motion.div>> = (props) => (<><DesktopSidebar {...props} /><MobileSidebar {...(props as React.ComponentProps<"div">)} /></>);
const DesktopSidebar: React.FC<React.ComponentProps<typeof motion.div>> = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (<motion.div className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0", className)} animate={{ width: animate ? (open ? "300px" : "72px") : "300px" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} {...props}>{children}</motion.div>);
};
const MobileSidebar: React.FC<React.ComponentProps<"div">> = ({ className, children }) => {
  const { open, setOpen } = useSidebar();
  return (<><div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-end bg-neutral-100 dark:bg-neutral-800 w-full")}><Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} /><AnimatePresence>{open && (<motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className={cn("fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between", className)}><div className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)}><X /></div>{children}</motion.div>)}</AnimatePresence></div></>);
};
const SidebarLink: React.FC<{ link: LinkItem; className?: string; }> = ({ link, className }) => {
  const { open, animate } = useSidebar();
  const Component = link.action ? 'button' : 'a';
  return (<Component onClick={link.action} className={cn("flex items-center justify-start gap-4 group/sidebar py-2 w-full text-left", className)}>{link.icon}<motion.span animate={{ display: animate ? (open ? "inline-block" : "none") : "inline-block", opacity: animate ? (open ? 1 : 0) : 1, }} className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">{link.label}</motion.span></Component>);
};
const Logo: React.FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black dark:text-white whitespace-pre">文章后台</motion.span></div>);
const LogoIcon: React.FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /></div>);


// --- 文章编辑器组件 (更新) ---
const ArticleEditor: React.FC<{ onArticlePublished: () => void; articleToEdit: Article | null }> = ({ onArticlePublished, articleToEdit }) => {
    const [markdownContent, setMarkdownContent] = useState('');
    const [authorEmail, setAuthorEmail] = useState('admin@example.com');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEditMode = articleToEdit !== null;

    useEffect(() => {
        if (isEditMode) {
            setMarkdownContent(articleToEdit.markdownContent);
            setAuthorEmail(articleToEdit.authorEmail);
        } else {
            // 为新文章设置默认内容
            setMarkdownContent('# 在这里写下您的文章标题\n\n在这里开始写作...');
            setAuthorEmail('admin@example.com');
        }
    }, [articleToEdit, isEditMode]);

    const handleSubmit = async () => {
        if (!markdownContent.trim() || !authorEmail.trim()) {
            setSubmitError('文章内容和作者邮箱不能为空。');
            return;
        }
        setIsSubmitting(true);
        setSubmitError(null);

        const url = '/api/articles';
        const method = isEditMode ? 'PUT' : 'POST';
        const body = JSON.stringify(isEditMode ? { id: articleToEdit.id, markdownContent, authorEmail } : { markdownContent, authorEmail });

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '提交失败，请检查API服务。');
            }
            onArticlePublished(); // 成功后调用回调
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : '发生未知错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{isEditMode ? '编辑文章' : '写新文章'}</h1>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg flex-1 flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    <textarea value={markdownContent} onChange={(e) => setMarkdownContent(e.target.value)} className="w-full flex-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 resize-none font-mono" />
                    <div className="h-full bg-white dark:bg-gray-900 border rounded-lg overflow-y-auto p-4">
                        <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg"><ReactMarkdown>{markdownContent}</ReactMarkdown></article>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="作者邮箱" className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700" />
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">{isSubmitting ? '提交中...' : isEditMode ? '更新文章' : '发布文章'}</button>
                    {submitError && <p className="text-red-500">{submitError}</p>}
                </div>
            </div>
        </div>
    );
};

// --- 文章管理列表组件 (更新) ---
const ArticleList: React.FC<{ articles: Article[]; isLoading: boolean; error: string | null; onEdit: (article: Article) => void; onDelete: (articleId: string) => void; }> = ({ articles, isLoading, error, onEdit, onDelete }) => (
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
                        <th scope="col" className="px-6 py-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : 
                     error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : 
                     articles.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">暂无文章</td></tr>) : 
                     (articles.map((article) => (
                        <tr key={article.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td className="p-4"><img src={article.coverImageUrl || "https://placehold.co/100x100/EEE/333?text=N/A"} alt={article.title} width={80} height={80} className="rounded-md object-cover w-20 h-20" /></td>
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{article.title}</th>
                            <td className="px-6 py-4">{article.authorEmail}</td>
                            <td className="px-6 py-4">{new Date(article.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => onEdit(article)} className="font-medium text-blue-600 dark:text-blue-500 hover:underline mr-4"><Edit className="inline h-5 w-5"/></button>
                                <button onClick={() => onDelete(article.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline"><Trash2 className="inline h-5 w-5"/></button>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- 主页面组件 (更新) ---
export default function AdminPage() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'list' | 'editor'>('list');
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);

    const fetchArticles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/articles');
            if (!response.ok) throw new Error('获取文章数据失败');
            const data = await response.json();
            const parsedArticles = data.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean);
            parsedArticles.sort((a:Article, b:Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setArticles(parsedArticles);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : '发生未知错误');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (view === 'list') {
            fetchArticles();
        }
    }, [view]);

    const handleEditArticle = (article: Article) => {
        setEditingArticle(article);
        setView('editor');
    };
    
    const handleNewArticle = () => {
        setEditingArticle(null);
        setView('editor');
    }

    const handleDeleteArticle = async (articleId: string) => {
        // 使用自定义模态框代替 confirm
        if (!window.confirm(`确定要删除这篇文章吗？此操作不可撤销。`)) {
            return;
        }
        try {
            const response = await fetch('/api/articles', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: articleId }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除失败');
            }
            // 删除成功后重新获取列表
            fetchArticles();
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : '删除时发生未知错误');
        }
    };
    
    const handlePublishSuccess = () => {
        alert('操作成功！');
        setView('list');
    };

    const adminLinks: LinkItem[] = [
        { label: "文章管理", href: "#", icon: <FileText className="h-5 w-5" />, action: () => setView('list') },
        { label: "写新文章", href: "#", icon: <PlusCircle className="h-5 w-5" />, action: handleNewArticle },
        { label: "系统设置", href: "#", icon: <Settings className="h-5 w-5" />, action: () => alert('设置功能待开发') },
    ];

    const userData = { name: "管理员", href: "#", avatarUrl: "https://placehold.co/100x100/E5E7EB/4B5563?text=A" };
    const userLink = { label: userData.name, href: userData.href, icon: (<img src={userData.avatarUrl} className="h-7 w-7 rounded-full" alt="avatar" />) };

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full h-screen">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto">
                        <div className='px-2 py-1'>{open ? <Logo /> : <LogoIcon />}</div>
                        <div className="mt-8 flex flex-col gap-2">{adminLinks.map((link, idx) => (<SidebarLink key={idx} link={link} />))}</div>
                    </div>
                    <div><SidebarLink link={userLink} /></div>
                </SidebarBody>
            </Sidebar>
            <main className="flex-1 bg-white dark:bg-neutral-900 flex">
                {view === 'list' ? (
                    <ArticleList articles={articles} isLoading={isLoading} error={error} onEdit={handleEditArticle} onDelete={handleDeleteArticle} />
                ) : (
                    <ArticleEditor onArticlePublished={handlePublishSuccess} articleToEdit={editingArticle} />
                )}
            </main>
        </div>
    );
}
