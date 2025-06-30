// 文件路径: src/app/admin/page.tsx

"use client";

import React, { useState, useEffect, FC, PropsWithChildren, ComponentProps, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Menu, X, FileText, PlusCircle, Trash2, Edit, MessageSquare, Download, Calendar, Search, Upload, LogOut, UserCheck, Users, Eye, EyeOff } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toPng } from 'html-to-image';
import { jwtDecode } from 'jwt-decode';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const XLSX: any;

// --- 类型定义 ---
type UserPermission = 'full' | 'readonly';

interface User {
    username: string;
    permission: UserPermission;
}

// --- 登录表单组件 ---
const LoginForm: FC<{ onLoginSuccess: (permission: UserPermission) => void }> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!username || !password) {
            setError('账号和密码不能为空');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();
            if (res.ok) {
                onLoginSuccess(data.permission);
            } else {
                setError(data.message || '账号或密码错误');
            }
        } catch (err) {
            console.error('Login page submit error:', err);
            setError('登录时发生错误，请稍后再试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        管理员登录
                    </h1>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label
                            htmlFor="username"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            账号
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            密码
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 mt-1 text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm dark:bg-neutral-700 dark:border-neutral-600 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                        >
                            {isLoading ? '登录中...' : '登录'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- 工具函数 ---
const cn = (...inputs: (string | boolean | null | undefined)[]): string => {
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

interface ChatLog {
    key: string; 
    user: { name: string; email: string; };
    question: string;
    timestamp: string;
}

export interface CustomerSubmission {
    key: string;
    userName: string;
    userEmail: string;
    content: string;
    fileUrls: string[];
    submittedAt: string;
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
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};
const SidebarProvider: FC<PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>> = ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
  const [openState, setOpenState] = useState(true);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  return (<SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>);
};
const Sidebar: FC<PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>> = ({ children, open, setOpen, animate }) => (<SidebarProvider open={open} setOpen={setOpen} animate={animate}>{children}</SidebarProvider>);

const SidebarBody: FC<PropsWithChildren<ComponentProps<typeof motion.div>>> = (props) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...(props as ComponentProps<"div">)} />
        </>
    );
};

const DesktopSidebar: FC<PropsWithChildren<ComponentProps<typeof motion.div>>> = ({ className, children, ...props }) => {
  return (
    <motion.div className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0", className)} {...props}>
      {children}
    </motion.div>
  );
};

const MobileSidebar: FC<PropsWithChildren<ComponentProps<"div">>> = ({ className, children }) => {
  const { open, setOpen } = useSidebar();
  return (<><div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-end bg-neutral-100 dark:bg-neutral-800 w-full")}><Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} /><AnimatePresence>{open && (<motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className={cn("fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between", className)}><div className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)}><X /></div>{children}</motion.div>)}</AnimatePresence></div></>);
};
const SidebarLink: FC<{ link: LinkItem; className?: string; }> = ({ link, className }) => {
  const Component = link.action ? 'button' : 'a';
  const commonProps = {
    className: cn("flex items-center justify-start gap-4 group/sidebar py-2 w-full text-left", className),
    onClick: link.action,
  };
  const linkProps = Component === 'a' ? { href: link.href } : {};
  return (
    <Component {...commonProps} {...linkProps}>
      {link.icon}
      <span className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
        {link.label}
      </span>
    </Component>
  );
};
const Logo: FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /><span className="font-medium text-black dark:text-white whitespace-pre">后台管理</span></div>);
const LogoIcon: FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /></div>);


// --- 文章编辑器组件 ---
const ArticleEditor: FC<{ onArticlePublished: () => void; articleToEdit: Article | null; permission: UserPermission }> = ({ onArticlePublished, articleToEdit, permission }) => {
    const [markdownContent, setMarkdownContent] = useState('');
    const [authorEmail, setAuthorEmail] = useState('admin@example.com');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    const isEditMode = articleToEdit !== null;
    const isReadonly = permission === 'readonly';

    useEffect(() => {
        if (isEditMode) {
            setMarkdownContent(articleToEdit.markdownContent);
            setAuthorEmail(articleToEdit.authorEmail);
            setCoverImageUrl(articleToEdit.coverImageUrl);
        } else {
            setMarkdownContent('# 在这里写下您的文章标题\n\n在这里开始写作...');
            setAuthorEmail('admin@example.com');
            setCoverImageUrl(null);
        }
    }, [articleToEdit, isEditMode]);

    const handleFileUpload = async (file: File): Promise<string | null> => {
        setIsUploading(true);
        try {
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&userEmail=${encodeURIComponent(authorEmail)}`, { method: 'POST', body: file });
            const newBlob = await response.json();
            if (!response.ok) throw new Error(newBlob.message || '上传失败');
            return newBlob.url;
        } catch (error) {
            alert(error instanceof Error ? error.message : '上传失败');
            return null;
        } finally {
            setIsUploading(false);
        }
    };
    
    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = await handleFileUpload(file);
        if (url) setCoverImageUrl(url);
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (isReadonly) return;
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;
                const url = await handleFileUpload(file);
                if (url) {
                    const markdownImage = `\n![${file.name}](${url})\n`;
                    const textarea = textAreaRef.current;
                    if (textarea) {
                        const { selectionStart, value } = textarea;
                        const newText = value.slice(0, selectionStart) + markdownImage + value.slice(selectionStart);
                        setMarkdownContent(newText);
                    }
                }
                return; 
            }
        }
    };

    const handleSubmit = async () => {
        if (isReadonly) { alert("您没有权限执行此操作。"); return; }
        if (!markdownContent.trim() || !authorEmail.trim()) { setSubmitError('文章内容和作者邮箱不能为空。'); return; }
        setIsSubmitting(true);
        setSubmitError(null);
        
        const url = '/api/articles';
        const method = isEditMode ? 'PUT' : 'POST';
        const articleData = { markdownContent, authorEmail, coverImageUrl };
        const body = JSON.stringify(isEditMode ? { id: articleToEdit!.id, ...articleData } : articleData);

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || '提交失败'); }
            onArticlePublished();
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : '发生未知错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{isEditMode ? '编辑文章' : '写新文章'}</h1>
            <div className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-xl flex-1 flex flex-col shadow-lg min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
                    <textarea ref={textAreaRef} value={markdownContent} onPaste={handlePaste} onChange={(e) => setMarkdownContent(e.target.value)} className="w-full h-full p-4 rounded-lg bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 resize-none font-mono focus:ring-2 focus:ring-blue-500" readOnly={isReadonly} />
                    <div className="h-full bg-white dark:bg-black/40 border rounded-lg overflow-y-auto p-4">
                        <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {markdownContent}
                            </ReactMarkdown>
                        </article>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 pt-4 border-t border-neutral-300 dark:border-neutral-700">
                    <input type="file" ref={fileInputRef} onChange={handleCoverImageUpload} className="hidden" accept="image/*" disabled={isReadonly} />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || isReadonly} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400">
                        <Upload className="h-5 w-5" /> {isUploading ? '上传中...' : '上传封面'}
                    </button>
                    {coverImageUrl && <img src={coverImageUrl} alt="封面预览" className="h-10 w-10 rounded object-cover" />}
                    <input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="作者邮箱" className="px-3 py-2 rounded-lg bg-white dark:bg-black/40 border ml-auto" readOnly={isReadonly} />
                    <button onClick={handleSubmit} disabled={isSubmitting || isUploading || isReadonly} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-500">{isSubmitting ? '提交中...' : isEditMode ? '更新文章' : '发布文章'}</button>
                    {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                </div>
            </div>
        </div>
    );
};


// --- 文章管理列表组件 ---
const ArticleList: FC<{ articles: Article[]; isLoading: boolean; error: string | null; onEdit: (article: Article) => void; onDelete: (articleId: string) => void; permission: UserPermission }> = ({ articles, isLoading, error, onEdit, onDelete, permission }) => {
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [keyword, setKeyword] = useState('');
    const [author, setAuthor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const isReadonly = permission === 'readonly';

    useEffect(() => { let tempArticles = [...articles]; if (keyword) tempArticles = tempArticles.filter(a => a.title.toLowerCase().includes(keyword.toLowerCase())); if (author) tempArticles = tempArticles.filter(a => a.authorEmail.toLowerCase().includes(author.toLowerCase())); if (startDate) tempArticles = tempArticles.filter(a => new Date(a.createdAt) >= new Date(startDate)); if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempArticles = tempArticles.filter(a => new Date(a.createdAt) <= endOfDay); } setFilteredArticles(tempArticles); }, [articles, keyword, author, startDate, endDate]);
    const handleExport = () => { if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; } const dataToExport = filteredArticles.map(a => ({'标题': a.title, '作者': a.authorEmail, '发布日期': new Date(a.createdAt).toLocaleDateString(), '封面图URL': a.coverImageUrl, })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "文章列表"); XLSX.writeFile(workbook, "文章列表.xlsx"); };
    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">文章管理</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/><input type="text" placeholder="按标题筛选..." value={keyword} onChange={e => setKeyword(e.target.value)} className="p-2 pl-10 rounded border bg-white dark:bg-gray-700"/></div><input type="text" placeholder="按作者筛选..." value={author} onChange={e => setAuthor(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-500"/><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><span>-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/></div><button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Download className="h-5 w-5"/>导出 Excel</button></div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th scope="col" className="px-6 py-3">封面图</th><th scope="col" className="px-6 py-3">标题</th><th scope="col" className="px-6 py-3">作者</th><th scope="col" className="px-6 py-3">发布日期</th><th scope="col" className="px-6 py-3 text-center">操作</th></tr></thead>
                    <tbody>{isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : filteredArticles.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的文章</td></tr>) : (filteredArticles.map((article) => (<tr key={article.id} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600"><td className="p-4"><img src={article.coverImageUrl || "https://placehold.co/100x100/EEE/333?text=N/A"} alt={article.title} width={80} height={80} className="rounded-md object-cover w-20 h-20" /></td><th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">{article.title}</th><td className="px-6 py-4">{article.authorEmail}</td><td className="px-6 py-4">{new Date(article.createdAt).toLocaleDateString()}</td><td className="px-6 py-4 text-center"><button onClick={() => onEdit(article)} className="font-medium text-blue-500 hover:underline mr-4"><Edit className="inline h-5 w-5"/></button>{!isReadonly && <button onClick={() => onDelete(article.id)} className="font-medium text-red-500 hover:underline"><Trash2 className="inline h-5 w-5"/></button>}</td></tr>)))}</tbody>
                </table>
            </div>
        </div>
    );
};

// --- 客户问题一览组件 ---
const ChatLogViewer: FC<{ logs: ChatLog[]; isLoading: boolean; error: string | null; onRefresh: () => void; permission: UserPermission }> = ({ logs, isLoading, error, onRefresh, permission }) => {
    const [filteredLogs, setFilteredLogs] = useState<ChatLog[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const isReadonly = permission === 'readonly';

    useEffect(() => { let tempLogs = [...logs]; if (startDate) { tempLogs = tempLogs.filter(log => new Date(log.timestamp) >= new Date(startDate)); } if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempLogs = tempLogs.filter(log => new Date(log.timestamp) <= endOfDay); } setFilteredLogs(tempLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); }, [logs, startDate, endDate]);
    const handleSelect = (key: string) => { const newSelection = new Set(selectedKeys); if (newSelection.has(key)) { newSelection.delete(key); } else { newSelection.add(key); } setSelectedKeys(newSelection); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) { setSelectedKeys(new Set(filteredLogs.map(log => log.key))); } else { setSelectedKeys(new Set()); } };
    const handleDelete = async (keysToDelete: string[]) => { if (isReadonly) { alert("您没有权限执行此操作。"); return; } if (keysToDelete.length === 0 || !window.confirm(`确定要删除选中的 ${keysToDelete.length} 条记录吗？`)) return; try { const response = await fetch('/api/chat-logs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: keysToDelete }), }); if (!response.ok) throw new Error('删除失败'); alert('删除成功！'); onRefresh(); setSelectedKeys(new Set()); } catch (err) { alert(err instanceof Error ? err.message : '删除时发生未知错误'); } };
    const handleExport = () => { if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; } const dataToExport = filteredLogs.map(log => ({ '用户邮箱': log.user.email, '用户问题': log.question, '提问时间': new Date(log.timestamp).toLocaleString(), })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "客户问题记录"); XLSX.writeFile(workbook, "客户问题记录.xlsx"); };
    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">客户问题一览</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"><div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-500"/><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><span>-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/></div><button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Download className="h-5 w-5"/>导出 Excel</button>{!isReadonly && <button onClick={() => handleDelete(Array.from(selectedKeys))} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"><Trash2 className="h-5 w-5"/>删除选中</button>}</div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} disabled={isReadonly} checked={filteredLogs.length > 0 && selectedKeys.size === filteredLogs.length}/></th><th scope="col" className="px-6 py-3">用户</th><th scope="col" className="px-6 py-3">问题内容</th><th scope="col" className="px-6 py-3">时间</th><th scope="col" className="px-6 py-3">操作</th></tr></thead>
                    <tbody>{isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : filteredLogs.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的记录</td></tr>) : (filteredLogs.map((log) => (<tr key={log.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600"><td className="p-4"><input type="checkbox" checked={selectedKeys.has(log.key)} onChange={() => handleSelect(log.key)} disabled={isReadonly}/></td><td className="px-6 py-4">{log.user.email}</td><td className="px-6 py-4 max-w-md truncate" title={log.question}>{log.question}</td><td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4">{!isReadonly && <button onClick={() => handleDelete([log.key])} className="text-red-500 hover:underline"><Trash2 className="h-5 w-5"/></button>}</td></tr>)))}</tbody>
                </table>
            </div>
        </div>
    );
};

// --- 客户反馈查看器组件 ---
const CustomerFeedbackViewer: FC<{ submissions: CustomerSubmission[]; isLoading: boolean; error: string | null; onDelete: (keys: string[]) => void; onRefresh: () => void; permission: UserPermission }> = ({ submissions, isLoading, error, onDelete, onRefresh, permission }) => {
    const [filteredSubmissions, setFilteredSubmissions] = useState<CustomerSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<CustomerSubmission | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const modalContentRef = useRef<HTMLDivElement>(null);
    const isReadonly = permission === 'readonly';

    useEffect(() => {
        let tempSubmissions = [...submissions];
        if (startDate) { tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) >= new Date(startDate)); }
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) <= endOfDay); }
        setFilteredSubmissions(tempSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, [submissions, startDate, endDate]);

    const handleSelect = (key: string) => { const newSelection = new Set(selectedKeys); if (newSelection.has(key)) { newSelection.delete(key); } else { newSelection.add(key); } setSelectedKeys(newSelection); };

    const handleDelete = () => {
        if (isReadonly) { alert("您没有权限执行此操作。"); return; }
        if (selectedKeys.size === 0) { alert('请先选择要删除的反馈。'); return; }
        if (window.confirm(`确定要删除选中的 ${selectedKeys.size} 条反馈吗？`)) { onDelete(Array.from(selectedKeys)); setSelectedKeys(new Set()); }
    };

    const handleExportAsPng = async () => {
        if (!modalContentRef.current || !selectedSubmission) { alert('无法截图，请确保已打开一个反馈详情。'); return; }
        const elementToCapture = modalContentRef.current;
        const images = Array.from(elementToCapture.getElementsByTagName('img'));
        const originalSrcs = images.map(img => img.src);
        try {
            const dataUrlPromises = images.map(img => fetch(img.src).then(response => { if (!response.ok) throw new Error(`图片加载失败: ${response.statusText}`); return response.blob(); }).then(blob => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onloadend = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(blob); })));
            const dataUrls = await Promise.all(dataUrlPromises);
            images.forEach((img, index) => { img.src = dataUrls[index]; });
            await new Promise(resolve => setTimeout(resolve, 200));
            const dataUrl = await toPng(elementToCapture, { cacheBust: true, skipFonts: true, backgroundColor: '#1a1a1a', width: elementToCapture.scrollWidth, height: elementToCapture.scrollHeight });
            images.forEach((img, index) => { img.src = originalSrcs[index]; });
            const link = document.createElement('a');
            link.download = `feedback-${selectedSubmission.key.slice(-12)}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            images.forEach((img, index) => { img.src = originalSrcs[index]; });
            console.error('截图失败:', err);
            alert('截图失败，请查看控制台获取更多信息。');
        }
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col text-white">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">客户反馈</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-white" />
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-white" />
                </div>
                {!isReadonly && <button onClick={handleDelete} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"><Trash2 className="h-5 w-5" />删除选中</button>}
                 <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">刷新</button>
            </div>
            {isLoading ? <div className="text-center p-8">正在加载...</div> : error ? <div className="text-center p-8 text-red-500">{error}</div> : filteredSubmissions.length === 0 ? <div className="text-center p-8">没有符合条件的反馈</div> :
             (<div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
                    {filteredSubmissions.map(submission => (
                        <div key={submission.key} className="bg-neutral-800 rounded-lg shadow-lg overflow-hidden flex flex-col cursor-pointer transition-all duration-300 hover:shadow-cyan-500/50 hover:scale-105" onClick={() => setSelectedSubmission(submission)}>
                            <div className="h-40 bg-neutral-900 flex items-center justify-center text-neutral-600">{submission.fileUrls && submission.fileUrls.length > 0 ? (<img src={`/api/image-proxy?url=${encodeURIComponent(submission.fileUrls[0])}`} alt="反馈封面" className="w-full h-full object-cover"/>) : (<span>无图片</span>)}</div>
                            <div className="p-4 flex-grow">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-gray-400 break-all">{submission.userEmail}</p>
                                    <input type="checkbox" checked={selectedKeys.has(submission.key)} onClick={(e) => e.stopPropagation()} onChange={() => handleSelect(submission.key)} className="ml-4 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" disabled={isReadonly}/>
                                </div>
                                <p className="mt-2 text-gray-300 text-sm line-clamp-3">{submission.content || "无文本内容"}</p>
                            </div>
                            <div className="px-4 py-2 bg-neutral-900 text-xs text-gray-500 mt-auto">{new Date(submission.submittedAt).toLocaleString()}</div>
                        </div>
                    ))}
                </div>)}
            {selectedSubmission && (<AnimatePresence><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"><div ref={modalContentRef} className="p-6 overflow-y-auto"><h2 className="text-xl font-bold text-cyan-400 mb-2">{selectedSubmission.userName} <span className="text-sm font-normal text-gray-400">({selectedSubmission.userEmail})</span></h2><p className="text-xs text-gray-500 mb-4">提交于: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p><div className="prose prose-invert max-w-none prose-img:rounded-lg"><ReactMarkdown>{selectedSubmission.content}</ReactMarkdown></div>{selectedSubmission.fileUrls && selectedSubmission.fileUrls.length > 0 && (<div className="mt-6"><h3 className="font-bold text-lg mb-2 text-gray-300">附件图片:</h3><div className="grid grid-cols-2 md:grid-cols-3 gap-4">{selectedSubmission.fileUrls.map((url, index) => (<a key={`${url}-${index}`} href={url} target="_blank" rel="noopener noreferrer"><img src={`/api/image-proxy?url=${encodeURIComponent(url)}`} alt="附件图片" className="w-full h-auto object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105" /></a>))}</div></div>)}</div><div className="flex justify-end items-center gap-4 p-4 border-t border-neutral-700 mt-auto"><button onClick={handleExportAsPng} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">下载截图</button><button onClick={() => setSelectedSubmission(null)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">关闭</button></div></motion.div></motion.div></AnimatePresence>)}
        </div>
    );
};

// --- 系统设置组件 ---
const SettingsView: FC<{ permission: UserPermission }> = ({ permission }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPermission, setNewPermission] = useState<UserPermission>('readonly');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('获取用户列表失败');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '未知错误');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword, permission: newPermission }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '添加用户失败');
            alert('用户添加成功！');
            setNewUsername('');
            setNewPassword('');
            fetchUsers();
        } catch (err) {
            setError(err instanceof Error ? err.message : '未知错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async (username: string) => {
        if (!window.confirm(`确定要删除用户 "${username}" 吗？此操作不可逆。`)) return;
        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || '删除用户失败');
            alert('用户删除成功！');
            fetchUsers();
        } catch (err) {
            alert(err instanceof Error ? err.message : '删除失败');
        }
    };

    if (permission !== 'full') {
        return (
            <div className="p-4 md:p-8 w-full h-full flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">访问受限</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">您没有权限访问此页面。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col text-white">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">系统设置 - 用户管理</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 添加用户表单 */}
                <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">添加新用户</h2>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">用户名</label>
                            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">密码</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">权限</label>
                            <select value={newPermission} onChange={e => setNewPermission(e.target.value as UserPermission)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="readonly">只读权限</option>
                                <option value="full">完全权限</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-500">
                            {isSubmitting ? '添加中...' : '添加用户'}
                        </button>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </form>
                </div>

                {/* 用户列表 */}
                <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">现有用户</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-400">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3">用户名</th>
                                    <th scope="col" className="px-6 py-3">权限</th>
                                    <th scope="col" className="px-6 py-3">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (<tr><td colSpan={3} className="text-center p-4">加载中...</td></tr>) :
                                 users.map(user => (
                                    <tr key={user.username} className="border-b border-gray-700 hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                                        <td className="px-6 py-4">{user.permission === 'full' ? '完全权限' : '只读权限'}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDeleteUser(user.username)} className="text-red-500 hover:text-red-400 disabled:text-gray-500" disabled={user.username === 'admin'}>
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                 ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- 主页面组件 ---
const AdminDashboard: FC<{ onLogout: () => void; permission: UserPermission; username: string }> = ({ onLogout, permission, username }) => {
    const [open, setOpen] = useState(true);
    const [view, setView] = useState<'list' | 'editor' | 'questions' | 'customerFeedback' | 'settings'>('list');
    const [articles, setArticles] = useState<Article[]>([]);
    const [isArticlesLoading, setIsArticlesLoading] = useState(true);
    const [articlesError, setArticlesError] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isChatLogsLoading, setIsChatLogsLoading] = useState(true);
    const [chatLogsError, setChatLogsError] = useState<string | null>(null);
    
    const [customerSubmissions, setCustomerSubmissions] = useState<CustomerSubmission[]>([]);
    const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(true);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);

    useEffect(() => { const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; script.async = true; document.body.appendChild(script); return () => { document.body.removeChild(script); }; }, []);

    const fetchArticles = async () => { 
        setIsArticlesLoading(true); setArticlesError(null); 
        try { 
            const response = await fetch('/api/articles'); 
            if (!response.ok) throw new Error('获取文章数据失败'); 
            const data = await response.json(); 
            const parsedArticles = data.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean); 
            parsedArticles.sort((a:Article, b:Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
            setArticles(parsedArticles); 
        } catch (err: unknown) { setArticlesError(err instanceof Error ? err.message : '未知错误'); } finally { setIsArticlesLoading(false); } 
    };
    
    const fetchChatLogs = async () => {
        setIsChatLogsLoading(true); setChatLogsError(null);
        try {
            const response = await fetch('/api/chat-logs');
            if (!response.ok) throw new Error('获取聊天记录失败');
            const data = await response.json();
            setChatLogs(data);
        } catch (err: unknown) { setChatLogsError(err instanceof Error ? err.message : '未知错误'); } finally { setIsChatLogsLoading(false); }
    };
    
    const fetchCustomerSubmissions = async () => {
        setIsSubmissionsLoading(true); setSubmissionsError(null);
        try {
            const response = await fetch('/api/customer-feedback');
            if (!response.ok) throw new Error('获取客户反馈数据失败');
            const data = await response.json();
            setCustomerSubmissions(data);
        } catch (err: unknown) { setSubmissionsError(err instanceof Error ? err.message : '未知错误'); } finally { setIsSubmissionsLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchArticles();
        if (view === 'questions') fetchChatLogs();
        if (view === 'customerFeedback') fetchCustomerSubmissions();
    }, [view]);

    const handleEditArticle = (article: Article) => { setEditingArticle(article); setView('editor'); };
    const handleNewArticle = () => { if (permission === 'readonly') { alert("您没有权限写新文章。"); return; } setEditingArticle(null); setView('editor'); };
    const handleDeleteArticle = async (articleId: string) => { if (permission === 'readonly') { alert("您没有权限删除文章。"); return; } if (!window.confirm(`确定删除文章？`)) return; try { const response = await fetch('/api/articles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: articleId }), }); if (!response.ok) { const d = await response.json(); throw new Error(d.message || '删除失败'); } fetchArticles(); } catch (err: unknown) { alert(err instanceof Error ? err.message : '删除时发生错误'); } };
    const handlePublishSuccess = () => { alert('操作成功！'); setView('list'); };
    
    const handleDeleteSubmissions = async (keys: string[]) => {
        if (permission === 'readonly') { alert("您没有权限删除反馈。"); return; }
        try {
            const response = await fetch('/api/customer-feedback', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys }), });
            if (!response.ok) throw new Error('删除失败');
            alert('删除成功！');
            fetchCustomerSubmissions();
        } catch (err) { alert(err instanceof Error ? err.message : '删除时发生未知错误'); }
    };
    
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout failed", error);
        } finally {
            onLogout();
        }
    };

    const adminLinks: LinkItem[] = [
        { label: "文章管理", href: "#", icon: <FileText className="h-5 w-5" />, action: () => setView('list') },
        { label: "写新文章", href: "#", icon: <PlusCircle className="h-5 w-5" />, action: handleNewArticle },
        { label: "问题一览", href: "#", icon: <MessageSquare className="h-5 w-5" />, action: () => setView('questions') },
        { label: "客户反馈", href: "#", icon: <UserCheck className="h-5 w-5" />, action: () => setView('customerFeedback') },
        { label: "系统设置", href: "#", icon: <Settings className="h-5 w-5" />, action: () => setView('settings') },
    ];

    const userLink = { label: `${username} (${permission})`, href: "#", icon: (<Users className="h-5 w-5" />) };
    const logoutLink: LinkItem = { label: "退出登录", href: "#", icon: <LogOut className="h-5 w-5" />, action: handleLogout };

    const renderView = () => {
        switch(view) {
            case 'list': return <ArticleList articles={articles} isLoading={isArticlesLoading} error={articlesError} onEdit={handleEditArticle} onDelete={handleDeleteArticle} permission={permission} />;
            case 'editor': return <ArticleEditor onArticlePublished={handlePublishSuccess} articleToEdit={editingArticle} permission={permission} />;
            case 'questions': return <ChatLogViewer logs={chatLogs} isLoading={isChatLogsLoading} error={chatLogsError} onRefresh={fetchChatLogs} permission={permission} />;
            case 'customerFeedback': return <CustomerFeedbackViewer submissions={customerSubmissions} isLoading={isSubmissionsLoading} error={submissionsError} onDelete={handleDeleteSubmissions} onRefresh={fetchCustomerSubmissions} permission={permission} />;
            case 'settings': return <SettingsView permission={permission} />;
            default: return <div>请选择一个视图</div>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-900 w-full h-screen">
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody>
                    <div className="flex flex-col flex-1 overflow-y-auto">
                        <div className='px-2 py-1'>{open ? <Logo /> : <LogoIcon />}</div>
                        <div className="mt-8 flex flex-col gap-2">{adminLinks.map((link, idx) => (<SidebarLink key={idx} link={link} />))}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <SidebarLink link={userLink} />
                        <SidebarLink link={logoutLink} />
                    </div>
                </SidebarBody>
            </Sidebar>
            <main className="flex-1 bg-white dark:bg-neutral-900 flex">
                {renderView()}
            </main>
        </div>
    );
};


export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [permission, setPermission] = useState<UserPermission | null>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        if (token) {
            try {
                const decoded: { permission: UserPermission, username: string } = jwtDecode(token);
                setPermission(decoded.permission);
                setUsername(decoded.username);
                setIsLoggedIn(true);
            } catch (e) {
                console.error("Invalid token", e);
                setIsLoggedIn(false);
            }
        }
    }, []);

    const handleLoginSuccess = (perm: UserPermission) => {
        const token = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        if (token) {
            const decoded: { username: string } = jwtDecode(token);
            setUsername(decoded.username);
        }
        setPermission(perm);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setPermission(null);
        setUsername(null);
        // 强制页面刷新以清除所有状态并应用中间件重定向
        window.location.href = '/admin';
    };

    if (!isLoggedIn || !permission || !username) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return <AdminDashboard onLogout={handleLogout} permission={permission} username={username} />;
}
