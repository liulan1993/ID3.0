// 文件路径: src/app/admin/page.tsx

"use client";

import React, { useState, useEffect, PropsWithChildren, ComponentProps, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Menu, X, FileText, PlusCircle, Trash2, Edit, MessageSquare, Download, Calendar, Search, Upload, LogOut, UserCheck, Users, Eye, EyeOff, ClipboardList, Briefcase, Handshake, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toPng } from 'html-to-image';
import { jwtDecode } from 'jwt-decode';
import { PutBlobResult } from '@vercel/blob';


// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const XLSX: any;

// --- 类型定义 ---
type UserPermission = 'full' | 'readonly';
type ApplicationStatus = 'pending' | 'accepted' | 'completed' | 'rejected';

interface User {
    username: string;
    permission: UserPermission;
}

interface QuestionnaireAnswer {
  qId: string;
  question: string;
  answer: string | string[];
}

export interface QuestionnaireSubmission {
  key: string;
  userName: string;
  userEmail: string;
  submittedAt: string;
  answers: QuestionnaireAnswer[];
}

export interface UserSubmission {
    key: string;
    userName: string;
    userEmail: string;
    services: string[];
    formData: Record<string, { question: string, answer: unknown }>;
    submittedAt: string;
    status?: ApplicationStatus; // 增加可选的状态字段
}

interface LoginSuccessData {
    token: string;
    username: string;
    permission: UserPermission;
}


// --- 登录表单组件 ---
function LoginForm({ onLoginSuccess }: { onLoginSuccess: (data: LoginSuccessData) => void }) {
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
                onLoginSuccess(data);
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
}


// --- 工具函数 ---
function cn(...inputs: (string | boolean | null | undefined)[]): string {
  return inputs.filter(Boolean).join(' ');
}

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

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}

function SidebarProvider({ children, open: openProp, setOpen: setOpenProp, animate = true }: PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>) {
  const [openState, setOpenState] = useState(true);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  return (<SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>);
}

function Sidebar({ children, open, setOpen, animate }: PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>) {
    return (<SidebarProvider open={open} setOpen={setOpen} animate={animate}>{children}</SidebarProvider>);
}

function SidebarBody(props: PropsWithChildren<ComponentProps<typeof motion.div>>) {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...(props as ComponentProps<"div">)} />
        </>
    );
}

function DesktopSidebar({ className, children, ...props }: PropsWithChildren<ComponentProps<typeof motion.div>>) {
  return (
    <motion.div className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0", className)} {...props}>
      {children}
    </motion.div>
  );
}

function MobileSidebar({ className, children }: PropsWithChildren<ComponentProps<"div">>) {
  const { open, setOpen } = useSidebar();
  return (<><div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-end bg-neutral-100 dark:bg-neutral-800 w-full")}><Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} /><AnimatePresence>{open && (<motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className={cn("fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between", className)}><div className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)}><X /></div>{children}</motion.div>)}</AnimatePresence></div></>);
}

// 修复：jsx-a11y/anchor-is-valid
function SidebarLink({ link, className }: { link: LinkItem; className?: string; }) {
    const commonClasses = "flex items-center justify-start gap-4 group/sidebar py-2 w-full text-left";
    
    if (link.action) {
        return (
            <button onClick={link.action} className={cn(commonClasses, className)}>
                {link.icon}
                <span className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
                    {link.label}
                </span>
            </button>
        );
    }
    
    return (
        <a href={link.href} className={cn(commonClasses, className)}>
            {link.icon}
            <span className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0">
                {link.label}
            </span>
        </a>
    );
}


function Logo() {
    return (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /><span className="font-medium text-black dark:text-white whitespace-pre">后台管理</span></div>);
}

function LogoIcon() {
    return (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /></div>);
}


// --- 文章编辑器组件 ---
function ArticleEditor({ onArticlePublished, articleToEdit, permission, getAuthHeaders }: { onArticlePublished: () => void; articleToEdit: Article | null; permission: UserPermission, getAuthHeaders: (isJson?: boolean) => Record<string, string> }) {
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
            const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}&userEmail=${encodeURIComponent(authorEmail)}`, { 
                method: 'POST', 
                body: file, 
                headers: getAuthHeaders(false) // Pass false for file uploads
            });

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
            const response = await fetch(url, { method, headers: getAuthHeaders(true), body });
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
}


// --- 文章管理列表组件 ---
function ArticleList({ articles, isLoading, error, onEdit, onDelete, permission }: { articles: Article[]; isLoading: boolean; error: string | null; onEdit: (article: Article) => void; onDelete: (articleId: string) => void; permission: UserPermission }) {
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
}

// --- 客户问题一览组件 ---
function ChatLogViewer({ logs, isLoading, error, onRefresh, onDelete, permission }: { logs: ChatLog[]; isLoading: boolean; error: string | null; onRefresh: () => void; onDelete: (keys: string[]) => void; permission: UserPermission }) {
    const [filteredLogs, setFilteredLogs] = useState<ChatLog[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const isReadonly = permission === 'readonly';

    useEffect(() => { let tempLogs = [...logs]; if (startDate) { tempLogs = tempLogs.filter(log => new Date(log.timestamp) >= new Date(startDate)); } if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempLogs = tempLogs.filter(log => new Date(log.timestamp) <= endOfDay); } setFilteredLogs(tempLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); }, [logs, startDate, endDate]);
    const handleSelect = (key: string) => { const newSelection = new Set(selectedKeys); if (newSelection.has(key)) { newSelection.delete(key); } else { newSelection.add(key); } setSelectedKeys(newSelection); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) { setSelectedKeys(new Set(filteredLogs.map(log => log.key))); } else { setSelectedKeys(new Set()); } };
    const handleDeleteClick = (keysToDelete: string[]) => {
        if (isReadonly) {
            alert("您没有权限执行此操作。");
            return;
        }
        if (keysToDelete.length === 0 || !window.confirm(`确定要删除选中的 ${keysToDelete.length} 条记录吗？`)) return;
        onDelete(keysToDelete);
        setSelectedKeys(currentKeys => {
            const newKeys = new Set(currentKeys);
            keysToDelete.forEach(key => newKeys.delete(key));
            return newKeys;
        });
    };
    const handleExport = () => { if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; } const dataToExport = filteredLogs.map(log => ({ '用户邮箱': log.user.email, '用户问题': log.question, '提问时间': new Date(log.timestamp).toLocaleString(), })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "客户问题记录"); XLSX.writeFile(workbook, "客户问题记录.xlsx"); };
    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">客户问题一览</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-500"/><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><span>-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/></div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Download className="h-5 w-5"/>导出 Excel</button>
                {!isReadonly && <button onClick={() => handleDeleteClick(Array.from(selectedKeys))} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"><Trash2 className="h-5 w-5"/>删除选中</button>}
                <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">刷新</button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} disabled={isReadonly} checked={filteredLogs.length > 0 && selectedKeys.size === filteredLogs.length}/></th><th scope="col" className="px-6 py-3">用户</th><th scope="col" className="px-6 py-3">问题内容</th><th scope="col" className="px-6 py-3">时间</th><th scope="col" className="px-6 py-3">操作</th></tr></thead>
                    <tbody>{isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : filteredLogs.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的记录</td></tr>) : (filteredLogs.map((log) => (<tr key={log.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600"><td className="p-4"><input type="checkbox" checked={selectedKeys.has(log.key)} onChange={() => handleSelect(log.key)} disabled={isReadonly}/></td><td className="px-6 py-4">{log.user.email}</td><td className="px-6 py-4 max-w-md truncate" title={log.question}>{log.question}</td><td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4">{!isReadonly && <button onClick={() => handleDeleteClick([log.key])} className="text-red-500 hover:underline"><Trash2 className="h-5 w-5"/></button>}</td></tr>)))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- 客户反馈查看器组件 ---
function CustomerFeedbackViewer({ submissions, isLoading, error, onDelete, onRefresh, permission }: { submissions: CustomerSubmission[]; isLoading: boolean; error: string | null; onDelete: (keys: string[]) => void; onRefresh: () => void; permission: UserPermission }) {
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
}

// --- 问卷调查查看器组件 ---
function QuestionnaireViewer({ submissions, isLoading, error, onDelete, onRefresh, permission }: { submissions: QuestionnaireSubmission[]; isLoading: boolean; error: string | null; onDelete: (keys: string[]) => void; onRefresh: () => void; permission: UserPermission }) {
    const [filteredSubmissions, setFilteredSubmissions] = useState<QuestionnaireSubmission[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<QuestionnaireSubmission | null>(null);
    const isReadonly = permission === 'readonly';

    useEffect(() => {
        let tempSubmissions = [...submissions];
        if (startDate) {
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) >= new Date(startDate));
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) <= endOfDay);
        }
        setFilteredSubmissions(tempSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, [submissions, startDate, endDate]);

    const handleSelect = (key: string) => {
        const newSelection = new Set(selectedKeys);
        if (newSelection.has(key)) {
            newSelection.delete(key);
        } else {
            newSelection.add(key);
        }
        setSelectedKeys(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedKeys(new Set(filteredSubmissions.map(s => s.key)));
        } else {
            setSelectedKeys(new Set());
        }
    };

    const handleDelete = () => {
        if (isReadonly) {
            alert("您没有权限执行此操作。");
            return;
        }
        if (selectedKeys.size === 0) {
            alert('请先选择要删除的问卷。');
            return;
        }
        if (window.confirm(`确定要删除选中的 ${selectedKeys.size} 条问卷吗？`)) {
            onDelete(Array.from(selectedKeys));
            setSelectedKeys(new Set());
        }
    };

    const handleExport = () => {
        if (typeof XLSX === 'undefined') {
            alert('导出库正在加载中，请稍后再试。');
            return;
        }
        if (selectedKeys.size === 0) {
            alert('请选择至少一个问卷进行导出。');
            return;
        }

        const selectedSubmissionsData = submissions.filter(s => selectedKeys.has(s.key));
        
        const dataToExport = selectedSubmissionsData.flatMap(submission => 
            submission.answers.map(qa => ({
                '用户邮箱': submission.userEmail,
                '提交时间': new Date(submission.submittedAt).toLocaleString(),
                '问题': qa.question,
                '回答': Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer,
            }))
        );

        if (dataToExport.length === 0) {
            alert('选中的问卷没有可导出的回答。');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "问卷调查结果");
        XLSX.writeFile(workbook, "问卷调查结果.xlsx");
    };
    
    const viewDetails = (submission: QuestionnaireSubmission) => {
        setSelectedSubmission(submission);
        setDetailModalOpen(true);
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">问卷调查</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500"/>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400" disabled={selectedKeys.size === 0}>
                    <Download className="h-5 w-5"/>导出 Excel
                </button>
                {!isReadonly && (
                    <button onClick={handleDelete} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">
                        <Trash2 className="h-5 w-5"/>删除选中
                    </button>
                )}
                <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto">
                    刷新
                </button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="p-4">
                                <input type="checkbox" onChange={handleSelectAll} disabled={isReadonly} checked={filteredSubmissions.length > 0 && selectedKeys.size === filteredSubmissions.length}/>
                            </th>
                            <th scope="col" className="px-6 py-3">用户</th>
                            <th scope="col" className="px-6 py-3">提交时间</th>
                            <th scope="col" className="px-6 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={4} className="text-center p-8">正在加载...</td></tr>) 
                        : error ? (<tr><td colSpan={4} className="text-center p-8 text-red-500">{error}</td></tr>) 
                        : filteredSubmissions.length === 0 ? (<tr><td colSpan={4} className="text-center p-8">没有符合条件的问卷</td></tr>) 
                        : (filteredSubmissions.map((submission) => (
                            <tr key={submission.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600">
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedKeys.has(submission.key)} onChange={() => handleSelect(submission.key)} disabled={isReadonly}/>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{submission.userEmail}</td>
                                <td className="px-6 py-4">{new Date(submission.submittedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => viewDetails(submission)} className="font-medium text-blue-500 hover:underline">查看详情</button>
                                </td>
                            </tr>
                        )))}
                    </tbody>
                </table>
            </div>
            {detailModalOpen && selectedSubmission && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            <div className="p-6 overflow-y-auto">
                                <h2 className="text-xl font-bold text-cyan-400 mb-2">问卷详情</h2>
                                <p className="text-sm text-gray-400"><b>用户:</b> {selectedSubmission.userEmail}</p>
                                <p className="text-xs text-gray-500 mb-4"><b>提交于:</b> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                                <div className="space-y-4 mt-4">
                                    {selectedSubmission.answers.map((qa, index) => (
                                        <div key={index} className="border-b border-neutral-700 pb-2">
                                            <p className="font-semibold text-gray-300">{index + 1}. {qa.question}</p>
                                            <p className="text-gray-400 pl-4 mt-1">
                                                <b>答:</b> {Array.isArray(qa.answer) ? qa.answer.join(', ') : qa.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-4 p-4 border-t border-neutral-700 mt-auto">
                                <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">关闭</button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}

// --- 用户资料查看器组件 (旧) ---
function UserSubmissionsViewer({ submissions, isLoading, error, onDelete, onRefresh, permission }: { submissions: UserSubmission[]; isLoading: boolean; error: string | null; onDelete: (keys: string[]) => void; onRefresh: () => void; permission: UserPermission; }) {
    const [filteredSubmissions, setFilteredSubmissions] = useState<UserSubmission[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<UserSubmission | null>(null);
    const [downloading, setDownloading] = useState<string | null>(null);
    const isReadonly = permission === 'readonly';

    useEffect(() => {
        // This viewer should only show submissions with formData
        const submissionsWithFormData = submissions.filter(s => s.formData && Object.keys(s.formData).length > 0);
        let tempSubmissions = [...submissionsWithFormData];
        if (startDate) {
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) >= new Date(startDate));
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) <= endOfDay);
        }
        setFilteredSubmissions(tempSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, [submissions, startDate, endDate]);

    const handleSelect = (key: string) => {
        const newSelection = new Set(selectedKeys);
        if (newSelection.has(key)) {
            newSelection.delete(key);
        } else {
            newSelection.add(key);
        }
        setSelectedKeys(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedKeys(new Set(filteredSubmissions.map(s => s.key)));
        } else {
            setSelectedKeys(new Set());
        }
    };

    const handleDelete = () => {
        if (isReadonly) {
            alert("您没有权限执行此操作。");
            return;
        }
        if (selectedKeys.size === 0) {
            alert('请先选择要删除的资料。');
            return;
        }
        if (window.confirm(`确定要删除选中的 ${selectedKeys.size} 条资料吗？此操作将一并删除关联的文件。`)) {
            onDelete(Array.from(selectedKeys));
            setSelectedKeys(new Set());
        }
    };

    const flattenObject = (obj: Record<string, { question: string; answer: unknown }>, parentKey = '', res: Record<string, string | number> = {}) => {
        for (const key in obj) {
            const propName = parentKey ? `${parentKey} - ${obj[key].question || key}` : `${obj[key].question || key}`;
            const value = obj[key].answer;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                flattenObject(value as Record<string, { question: string; answer: unknown }>, propName, res);
            } else if (Array.isArray(value)) {
                const fileBlobs = value.filter(item => typeof item === 'object' && item !== null && 'url' in item);
                if (fileBlobs.length > 0) {
                    // 不导出文件内容
                } else {
                    res[propName] = value.join(', ');
                }
            } else if (value !== null && value !== undefined) {
                res[propName] = String(value);
            }
        }
        return res;
    };

    const handleExport = () => {
        if (typeof XLSX === 'undefined') {
            alert('导出库正在加载中，请稍后再试。');
            return;
        }
        if (selectedKeys.size === 0) {
            alert('请选择至少一个资料进行导出。');
            return;
        }

        const selectedSubmissionsData = submissions.filter(s => selectedKeys.has(s.key));
        
        const dataToExport = selectedSubmissionsData.map(submission => {
            const baseInfo = {
                '用户邮箱': submission.userEmail,
                '用户姓名': submission.userName,
                '提交时间': new Date(submission.submittedAt).toLocaleString(),
                '申请服务': submission.services.join(', '),
            };
            const flattenedFormData = flattenObject(submission.formData);
            return { ...baseInfo, ...flattenedFormData };
        });

        if (dataToExport.length === 0) {
            alert('选中的资料没有可导出的内容。');
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "用户资料");
        XLSX.writeFile(workbook, "用户资料.xlsx");
    };
    
    const viewDetails = (submission: UserSubmission) => {
        setSelectedSubmission(submission);
        setDetailModalOpen(true);
    };

    const handleDownload = async (fileUrl: string, fileName: string) => {
        setDownloading(fileUrl);
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`下载文件失败: ${response.statusText}`);
            }
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error("Download error:", err);
            alert(err instanceof Error ? err.message : '下载时发生未知错误');
        } finally {
            setDownloading(null);
        }
    };

    const renderAnswer = (answer: unknown) => {
        if (Array.isArray(answer)) {
            const fileBlobs: PutBlobResult[] = answer.filter((item): item is PutBlobResult => typeof item === 'object' && item !== null && 'url' in item);
            const otherItems = answer.filter(item => typeof item !== 'object' || item === null || !('url' in item));

            return (
                <div>
                    {otherItems.length > 0 && <p>{otherItems.join(', ')}</p>}
                    {fileBlobs.map((file, index) => {
                        const fileName = file.pathname.split('/').pop() || 'download';
                        return (
                            <div key={index} className="flex items-center justify-between mt-2 p-2 bg-gray-700/50 rounded">
                                <span className="truncate text-sm text-gray-300">{fileName}</span>
                                <button
                                    onClick={() => handleDownload(file.url, fileName)}
                                    disabled={downloading === file.url}
                                    className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-500"
                                >
                                    {downloading === file.url ? '下载中...' : '下载'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            );
        }
        if (typeof answer === 'object' && answer !== null) {
            return <div className="pl-4 border-l-2 border-neutral-700 mt-2">{renderFormData(answer as Record<string, { question: string; answer: unknown }>)}</div>;
        }
        return <p>{String(answer)}</p>;
    };

    const renderFormData = (formData: Record<string, { question: string, answer: unknown }>) => {
        return Object.entries(formData).map(([key, value]) => (
            <div key={key} className="mt-2">
                <p className="font-semibold text-gray-300">{value.question || key}</p>
                <div className="text-gray-400 pl-4 mt-1">
                    {renderAnswer(value.answer)}
                </div>
            </div>
        ));
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">用户资料</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500"/>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400" disabled={selectedKeys.size === 0}>
                    <Download className="h-5 w-5"/>导出 Excel
                </button>
                {!isReadonly && (
                    <button onClick={handleDelete} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">
                        <Trash2 className="h-5 w-5"/>删除选中
                    </button>
                )}
                <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto">
                    刷新
                </button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="p-4">
                                <input type="checkbox" onChange={handleSelectAll} disabled={isReadonly} checked={filteredSubmissions.length > 0 && selectedKeys.size === filteredSubmissions.length}/>
                            </th>
                            <th scope="col" className="px-6 py-3">用户</th>
                            <th scope="col" className="px-6 py-3">申请服务</th>
                            <th scope="col" className="px-6 py-3">提交时间</th>
                            <th scope="col" className="px-6 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) 
                        : error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) 
                        : filteredSubmissions.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的资料</td></tr>) 
                        : (filteredSubmissions.map((submission) => (
                            <tr key={submission.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600">
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedKeys.has(submission.key)} onChange={() => handleSelect(submission.key)} disabled={isReadonly}/>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{submission.userEmail}</td>
                                <td className="px-6 py-4">{submission.services.join(', ')}</td>
                                <td className="px-6 py-4">{new Date(submission.submittedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => viewDetails(submission)} className="font-medium text-blue-500 hover:underline">查看详情</button>
                                </td>
                            </tr>
                        )))}
                    </tbody>
                </table>
            </div>
            {detailModalOpen && selectedSubmission && (
                <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                            <div className="p-6 overflow-y-auto">
                                <h2 className="text-xl font-bold text-cyan-400 mb-2">用户资料详情</h2>
                                <p className="text-sm text-gray-400"><b>用户:</b> {selectedSubmission.userEmail} ({selectedSubmission.userName})</p>
                                <p className="text-sm text-gray-400"><b>申请服务:</b> {selectedSubmission.services.join(', ')}</p>
                                <p className="text-xs text-gray-500 mb-4"><b>提交于:</b> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                                <div className="space-y-4 mt-4 border-t border-neutral-700 pt-4">
                                    {renderFormData(selectedSubmission.formData)}
                                </div>
                            </div>
                            <div className="flex justify-end items-center gap-4 p-4 border-t border-neutral-700 mt-auto">
                                <button onClick={() => setDetailModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">关闭</button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
}

// --- 新增：客户申请管理组件 ---
function CustomerApplicationViewer({
    submissions,
    isLoading,
    error,
    onRefresh,
    permission,
    getAuthHeaders,
    onDelete
}: {
    submissions: UserSubmission[];
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;
    permission: UserPermission;
    getAuthHeaders: (isJson?: boolean) => Record<string, string>;
    onDelete: (keys: string[]) => void;
}) {
    const [filteredSubmissions, setFilteredSubmissions] = useState<UserSubmission[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const isReadonly = permission === 'readonly';

    useEffect(() => {
        // This viewer should only show submissions without extensive formData (i.e., new applications)
        const applicationSubmissions = submissions.filter(s => !s.formData || Object.keys(s.formData).length === 0);
        let tempSubmissions = [...applicationSubmissions];
        if (startDate) {
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) >= new Date(startDate));
        }
        if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            tempSubmissions = tempSubmissions.filter(s => new Date(s.submittedAt) <= endOfDay);
        }
        setFilteredSubmissions(tempSubmissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
    }, [submissions, startDate, endDate]);

    const handleUpdateStatus = async (key: string, status: ApplicationStatus) => {
        if (permission !== 'full') {
            alert("您没有权限执行此操作。");
            return;
        }

        try {
            const response = await fetch('/api/update-application-status', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: JSON.stringify({ key, status }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '更新状态失败');
            }
            
            alert(`申请状态已更新为: ${status}`);
            onRefresh(); // Refresh data from server to ensure consistency
        } catch (err) {
            alert(err instanceof Error ? err.message : '更新时发生错误');
        }
    };
    
    const handleSelect = (key: string) => {
        const newSelection = new Set(selectedKeys);
        if (newSelection.has(key)) { newSelection.delete(key); } else { newSelection.add(key); }
        setSelectedKeys(newSelection);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedKeys(new Set(filteredSubmissions.map(s => s.key)));
        } else {
            setSelectedKeys(new Set());
        }
    };
    
    const handleDelete = () => {
        if (isReadonly) { alert("您没有权限执行此操作。"); return; }
        if (selectedKeys.size === 0) { alert('请先选择要删除的申请。'); return; }
        if (window.confirm(`确定要删除选中的 ${selectedKeys.size} 条申请吗？`)) {
            onDelete(Array.from(selectedKeys));
            setSelectedKeys(new Set());
        }
    };

    const handleExport = () => {
        if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; }
        const dataToExport = filteredSubmissions.map(s => ({
            '客户邮箱': s.userEmail,
            '申请时间': new Date(s.submittedAt).toLocaleString(),
            '申请业务': s.services.join(', '),
            '当前状态': s.status || 'pending',
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "客户申请列表");
        XLSX.writeFile(workbook, "客户申请列表.xlsx");
    };

    const getStatusPill = (status: ApplicationStatus = 'pending') => {
        const statusMap: Record<ApplicationStatus, { text: string; className: string; icon: React.ReactNode }> = {
            pending: { text: '待处理', className: 'bg-yellow-500/20 text-yellow-400', icon: <Hourglass size={14} /> },
            accepted: { text: '已受理', className: 'bg-blue-500/20 text-blue-400', icon: <CheckCircle size={14} /> },
            completed: { text: '已完成', className: 'bg-green-500/20 text-green-400', icon: <CheckCircle size={14} /> },
            rejected: { text: '已拒绝', className: 'bg-red-500/20 text-red-400', icon: <XCircle size={14} /> },
        };
        const { text, className, icon } = statusMap[status];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
                {icon}
                {text}
            </span>
        );
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">客户申请</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                 <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-500"/>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                    <span>-</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700 text-gray-800 dark:text-white"/>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    <Download className="h-5 w-5"/>导出 Excel
                </button>
                {!isReadonly && (
                    <button onClick={handleDelete} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400">
                        <Trash2 className="h-5 w-5"/>删除选中
                    </button>
                )}
                <button onClick={onRefresh} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ml-auto">
                    刷新
                </button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="p-4">
                                <input type="checkbox" onChange={handleSelectAll} disabled={isReadonly}/>
                            </th>
                            <th scope="col" className="px-6 py-3">客户邮箱</th>
                            <th scope="col" className="px-6 py-3">申请业务</th>
                            <th scope="col" className="px-6 py-3">申请时间</th>
                            <th scope="col" className="px-6 py-3">当前状态</th>
                            <th scope="col" className="px-6 py-3 text-center">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={6} className="text-center p-8">正在加载...</td></tr>)
                        : error ? (<tr><td colSpan={6} className="text-center p-8 text-red-500">{error}</td></tr>)
                        : filteredSubmissions.length === 0 ? (<tr><td colSpan={6} className="text-center p-8">没有客户申请记录</td></tr>)
                        : (filteredSubmissions.map((submission) => (
                            <tr key={submission.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600">
                                <td className="p-4">
                                    <input type="checkbox" checked={selectedKeys.has(submission.key)} onChange={() => handleSelect(submission.key)} disabled={isReadonly}/>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{submission.userEmail}</td>
                                <td className="px-6 py-4">{submission.services.join(', ')}</td>
                                <td className="px-6 py-4">{new Date(submission.submittedAt).toLocaleString()}</td>
                                <td className="px-6 py-4">{getStatusPill(submission.status)}</td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    {permission === 'full' && (
                                        <>
                                            <button onClick={() => handleUpdateStatus(submission.key, 'accepted')} className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50" disabled={submission.status !== 'pending'}>接受</button>
                                            <button onClick={() => handleUpdateStatus(submission.key, 'completed')} className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50" disabled={submission.status !== 'accepted'}>完成</button>
                                            <button onClick={() => handleUpdateStatus(submission.key, 'rejected')} className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50" disabled={submission.status === 'completed' || submission.status === 'rejected'}>拒绝</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


// --- 系统设置组件 ---
function SettingsView({ permission, getAuthHeaders }: { permission: UserPermission, getAuthHeaders: (isJson?: boolean) => Record<string, string> }) {
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
            const res = await fetch('/api/users', { headers: getAuthHeaders(true) });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || '获取用户列表失败');
            }
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '未知错误');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (permission === 'full') {
            fetchUsers();
        }
    }, [permission]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: getAuthHeaders(true),
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
                headers: getAuthHeaders(true),
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
}


// --- 主页面组件 ---
function AdminDashboard({ onLogout, permission, username, token }: { onLogout: () => void; permission: UserPermission; username: string; token: string; }) {
    const [open, setOpen] = useState(true);
    const [view, setView] = useState<'list' | 'editor' | 'questions' | 'customerFeedback' | 'questionnaire' | 'userSubmissions' | 'customerApplications' | 'settings'>('list');
    
    // Articles state
    const [articles, setArticles] = useState<Article[]>([]);
    const [isArticlesLoading, setIsArticlesLoading] = useState(true);
    const [articlesError, setArticlesError] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    
    // Chat logs state
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isChatLogsLoading, setIsChatLogsLoading] = useState(true);
    const [chatLogsError, setChatLogsError] = useState<string | null>(null);
    
    // Customer submissions state
    const [customerSubmissions, setCustomerSubmissions] = useState<CustomerSubmission[]>([]);
    const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(true);
    const [submissionsError, setSubmissionsError] = useState<string | null>(null);

    // Questionnaire submissions state
    const [questionnaireSubmissions, setQuestionnaireSubmissions] = useState<QuestionnaireSubmission[]>([]);
    const [isQuestionnairesLoading, setIsQuestionnairesLoading] = useState(true);
    const [questionnairesError, setQuestionnairesError] = useState<string | null>(null);

    // User submissions state
    const [userSubmissions, setUserSubmissions] = useState<UserSubmission[]>([]);
    const [isUserSubmissionsLoading, setIsUserSubmissionsLoading] = useState(true);
    const [userSubmissionsError, setUserSubmissionsError] = useState<string | null>(null);

    useEffect(() => { 
        const script = document.createElement('script'); 
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; 
        script.async = true; 
        document.body.appendChild(script); 
        return () => { document.body.removeChild(script); }; 
    }, []);

    const getAuthHeaders = (isJson = true): Record<string, string> => {
        const headers: Record<string, string> = {};
        if (isJson) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.error("Auth token not found in props.");
            onLogout();
        }
        return headers;
    };

    const fetchArticles = async () => { 
        setIsArticlesLoading(true); setArticlesError(null); 
        try { 
            const response = await fetch('/api/articles', { headers: getAuthHeaders() }); 
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '获取文章数据失败');
            }
            const data = await response.json(); 
            const parsedArticles = data.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean); 
            parsedArticles.sort((a:Article, b:Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
            setArticles(parsedArticles); 
        } catch (err: unknown) { setArticlesError(err instanceof Error ? err.message : '未知错误'); } finally { setIsArticlesLoading(false); } 
    };
    
    const fetchChatLogs = async () => {
        setIsChatLogsLoading(true); setChatLogsError(null);
        try {
            const response = await fetch('/api/chat-logs', { headers: getAuthHeaders() });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '获取聊天记录失败');
            }
            const data = await response.json();
            setChatLogs(data);
        } catch (err: unknown) { setChatLogsError(err instanceof Error ? err.message : '未知错误'); } finally { setIsChatLogsLoading(false); }
    };
    
    const fetchCustomerSubmissions = async () => {
        setIsSubmissionsLoading(true); setSubmissionsError(null);
        try {
            const response = await fetch('/api/customer-feedback', { headers: getAuthHeaders() });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '获取客户反馈数据失败');
            }
            const data = await response.json();
            setCustomerSubmissions(data);
        } catch (err: unknown) { setSubmissionsError(err instanceof Error ? err.message : '未知错误'); } finally { setIsSubmissionsLoading(false); }
    };
    
    const fetchQuestionnaires = async () => {
        setIsQuestionnairesLoading(true); setQuestionnairesError(null);
        try {
            const response = await fetch('/api/questionnaires', { headers: getAuthHeaders() });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '获取问卷数据失败');
            }
            const data = await response.json();
            setQuestionnaireSubmissions(data);
        } catch (err: unknown) { setQuestionnairesError(err instanceof Error ? err.message : '未知错误'); } finally { setIsQuestionnairesLoading(false); }
    };

    const fetchAllSubmissionsForAdmin = async () => {
        setIsUserSubmissionsLoading(true); setUserSubmissionsError(null);
        try {
            const response = await fetch('/api/admin/get-applications', { headers: getAuthHeaders() });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '获取用户资料失败');
            }
            const data = await response.json();
            setUserSubmissions(data);
        } catch (err: unknown) { setUserSubmissionsError(err instanceof Error ? err.message : '未知错误'); } finally { setIsUserSubmissionsLoading(false); }
    };

    useEffect(() => {
        if (view === 'list') fetchArticles();
        if (view === 'questions') fetchChatLogs();
        if (view === 'customerFeedback') fetchCustomerSubmissions();
        if (view === 'questionnaire') fetchQuestionnaires();
        if (view === 'userSubmissions' || view === 'customerApplications') fetchAllSubmissionsForAdmin();
    }, [view]);

    const handleEditArticle = (article: Article) => { setEditingArticle(article); setView('editor'); };
    const handleNewArticle = () => { if (permission === 'readonly') { alert("您没有权限写新文章。"); return; } setEditingArticle(null); setView('editor'); };
    const handleDeleteArticle = async (articleId: string) => { if (permission === 'readonly') { alert("您没有权限删除文章。"); return; } if (!window.confirm(`确定删除文章？`)) return; try { const response = await fetch('/api/articles', { method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ id: articleId }), }); if (!response.ok) { const d = await response.json(); throw new Error(d.message || '删除失败'); } fetchArticles(); } catch (err: unknown) { alert(err instanceof Error ? err.message : '删除时发生错误'); } };
    const handlePublishSuccess = () => { alert('操作成功！'); setView('list'); fetchArticles(); };
    
    const handleDeleteChatLogs = async (keys: string[]) => {
        if (permission === 'readonly') { alert("您没有权限执行此操作。"); return; }
        try {
            const response = await fetch('/api/chat-logs', { method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ keys }), });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除失败');
            }
            alert('删除成功！');
            fetchChatLogs();
        } catch (err) {
            alert(err instanceof Error ? err.message : '删除时发生未知错误');
        }
    };

    const handleDeleteCustomerFeedback = async (keys: string[]) => {
        if (permission === 'readonly') { alert("您没有权限删除反馈。"); return; }
        try {
            const response = await fetch('/api/customer-feedback', { method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ keys }), });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除失败');
            }
            alert('删除成功！');
            fetchCustomerSubmissions();
        } catch (err) { alert(err instanceof Error ? err.message : '删除时发生未知错误'); }
    };

    const handleDeleteQuestionnaires = async (keys: string[]) => {
        if (permission === 'readonly') { alert("您没有权限删除问卷。"); return; }
        try {
            const response = await fetch('/api/questionnaires', { method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ keys }), });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '删除失败');
            }
            alert('删除成功！');
            fetchQuestionnaires();
        } catch (err) { alert(err instanceof Error ? err.message : '删除时发生未知错误'); }
    };

    const handleDeleteUserSubmissions = async (keys: string[]) => {
        if (permission === 'readonly') { alert("您没有权限删除资料。"); return; }
        try {
            const response = await fetch('/api/admin/get-applications', { method: 'DELETE', headers: getAuthHeaders(), body: JSON.stringify({ keys }), });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '删除失败');
            }
            alert('删除成功！');
            fetchAllSubmissionsForAdmin();
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
        { label: "问卷调查", href: "#", icon: <ClipboardList className="h-5 w-5" />, action: () => setView('questionnaire') },
        { label: "用户资料", href: "#", icon: <Briefcase className="h-5 w-5" />, action: () => setView('userSubmissions') },
        { label: "客户申请", href: "#", icon: <Handshake className="h-5 w-5" />, action: () => setView('customerApplications') },
        { label: "系统设置", href: "#", icon: <Settings className="h-5 w-5" />, action: () => setView('settings') },
    ];

    const userLink = { label: `${username} (${permission})`, href: "#", icon: (<Users className="h-5 w-5" />) };
    const logoutLink: LinkItem = { label: "退出登录", href: "#", icon: <LogOut className="h-5 w-5" />, action: handleLogout };

    const renderView = () => {
        switch(view) {
            case 'list': return <ArticleList articles={articles} isLoading={isArticlesLoading} error={articlesError} onEdit={handleEditArticle} onDelete={handleDeleteArticle} permission={permission} />;
            case 'editor': return <ArticleEditor onArticlePublished={handlePublishSuccess} articleToEdit={editingArticle} permission={permission} getAuthHeaders={getAuthHeaders} />;
            case 'questions': return <ChatLogViewer logs={chatLogs} isLoading={isChatLogsLoading} error={chatLogsError} onRefresh={fetchChatLogs} onDelete={handleDeleteChatLogs} permission={permission} />;
            case 'customerFeedback': return <CustomerFeedbackViewer submissions={customerSubmissions} isLoading={isSubmissionsLoading} error={submissionsError} onDelete={handleDeleteCustomerFeedback} onRefresh={fetchCustomerSubmissions} permission={permission} />;
            case 'questionnaire': return <QuestionnaireViewer submissions={questionnaireSubmissions} isLoading={isQuestionnairesLoading} error={questionnairesError} onDelete={handleDeleteQuestionnaires} onRefresh={fetchQuestionnaires} permission={permission} />;
            case 'userSubmissions': return <UserSubmissionsViewer submissions={userSubmissions} isLoading={isUserSubmissionsLoading} error={userSubmissionsError} onDelete={handleDeleteUserSubmissions} onRefresh={fetchAllSubmissionsForAdmin} permission={permission} />;
            case 'customerApplications': return <CustomerApplicationViewer submissions={userSubmissions} isLoading={isUserSubmissionsLoading} error={userSubmissionsError} onRefresh={fetchAllSubmissionsForAdmin} permission={permission} getAuthHeaders={getAuthHeaders} onDelete={handleDeleteUserSubmissions} />;
            case 'settings': return <SettingsView permission={permission} getAuthHeaders={getAuthHeaders} />;
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
}


export default function AdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [permission, setPermission] = useState<UserPermission | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    const handleLogout = () => {
        setToken(null);
        setIsLoggedIn(false);
        setPermission(null);
        setUsername(null);
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    };

    useEffect(() => {
        const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
        if (cookieToken) {
            try {
                const decoded: { permission: UserPermission, username: string, exp: number } = jwtDecode(cookieToken);
                if (decoded.exp * 1000 > Date.now()) {
                    setToken(cookieToken);
                    setPermission(decoded.permission);
                    setUsername(decoded.username);
                    setIsLoggedIn(true);
                } else {
                    handleLogout();
                }
            } catch (e) {
                console.error("Invalid token", e);
                handleLogout();
            }
        }
    }, []);

    const handleLoginSuccess = (data: LoginSuccessData) => {
        document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
        setToken(data.token);
        setUsername(data.username);
        setPermission(data.permission);
        setIsLoggedIn(true);
    };

    if (!isLoggedIn || !permission || !username || !token) {
        return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    return <AdminDashboard onLogout={handleLogout} permission={permission} username={username} token={token} />;
}
