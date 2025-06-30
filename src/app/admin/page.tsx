// 文件路径: src/app/admin/page.tsx

"use client";

import React, { useState, useEffect, FC, PropsWithChildren, ComponentProps, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, Menu, X, FileText, PlusCircle, Trash2, Edit, MessageSquare, Download, Calendar, Search, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// 告诉 TypeScript XLSX 是一个通过 script 标签加载的全局变量
declare const XLSX: any;

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
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;
  return (<SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>);
};
const Sidebar: FC<PropsWithChildren<{ open?: boolean; setOpen?: React.Dispatch<React.SetStateAction<boolean>>; animate?: boolean; }>> = ({ children, open, setOpen, animate }) => (<SidebarProvider open={open} setOpen={setOpen} animate={animate}>{children}</SidebarProvider>);
const SidebarBody: FC<ComponentProps<typeof motion.div>> = (props) => (<><DesktopSidebar {...props} /><MobileSidebar {...(props as ComponentProps<"div">)} /></>);
const DesktopSidebar: FC<ComponentProps<typeof motion.div>> = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();
  return (<motion.div className={cn("h-full px-4 py-4 hidden md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] flex-shrink-0", className)} animate={{ width: animate ? (open ? "300px" : "72px") : "300px" }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} {...props}>{children}</motion.div>);
};
const MobileSidebar: FC<ComponentProps<"div">> = ({ className, children }) => {
  const { open, setOpen } = useSidebar();
  return (<><div className={cn("h-10 px-4 py-4 flex flex-row md:hidden items-center justify-end bg-neutral-100 dark:bg-neutral-800 w-full")}><Menu className="text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)} /><AnimatePresence>{open && (<motion.div initial={{ x: "-100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className={cn("fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between", className)}><div className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200 cursor-pointer" onClick={() => setOpen(!open)}><X /></div>{children}</motion.div>)}</AnimatePresence></div></>);
};
const SidebarLink: FC<{ link: LinkItem; className?: string; }> = ({ link, className }) => {
  const { open, animate } = useSidebar();
  const Component = link.action ? 'button' : 'a';

  const commonProps = {
    className: cn("flex items-center justify-start gap-4 group/sidebar py-2 w-full text-left", className),
    onClick: link.action,
  };

  const linkProps = Component === 'a' ? { href: link.href } : {};

  return (
    <Component {...commonProps} {...linkProps}>
      {link.icon}
      <motion.span
        animate={{
          display: animate ? "inline-block" : "none",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Component>
  );
};
const Logo: FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /><motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black dark:text-white whitespace-pre">后台管理</motion.span></div>);
const LogoIcon: FC = () => (<div className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"><div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" /></div>);


// --- 文章编辑器组件 (已恢复图片上传功能) ---
const ArticleEditor: FC<{ onArticlePublished: () => void; articleToEdit: Article | null }> = ({ onArticlePublished, articleToEdit }) => {
    const [markdownContent, setMarkdownContent] = useState('');
    const [authorEmail, setAuthorEmail] = useState('admin@example.com');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    
    const isEditMode = articleToEdit !== null;

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
            <div className="bg-neutral-200 dark:bg-neutral-800 p-4 rounded-xl flex-1 flex flex-col shadow-lg">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
                    <textarea ref={textAreaRef} value={markdownContent} onPaste={handlePaste} onChange={(e) => setMarkdownContent(e.target.value)} className="w-full h-full p-4 rounded-lg bg-white dark:bg-black/40 border border-gray-300 dark:border-gray-700 resize-none font-mono focus:ring-2 focus:ring-blue-500" />
                    <div className="h-full bg-white dark:bg-black/40 border rounded-lg overflow-y-auto p-4">
                        <article className="prose prose-invert prose-lg max-w-none prose-img:rounded-lg"><ReactMarkdown>{markdownContent}</ReactMarkdown></article>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-4 pt-4 border-t border-neutral-300 dark:border-neutral-700">
                    <input type="file" ref={fileInputRef} onChange={handleCoverImageUpload} className="hidden" accept="image/*" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400">
                        <Upload className="h-5 w-5" /> {isUploading ? '上传中...' : '上传封面'}
                    </button>
                    {coverImageUrl && <img src={coverImageUrl} alt="封面预览" className="h-10 w-10 rounded object-cover" />}
                    <input type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="作者邮箱" className="px-3 py-2 rounded-lg bg-white dark:bg-black/40 border ml-auto" />
                    <button onClick={handleSubmit} disabled={isSubmitting || isUploading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-500">{isSubmitting ? '提交中...' : isEditMode ? '更新文章' : '发布文章'}</button>
                    {submitError && <p className="text-red-500 text-sm">{submitError}</p>}
                </div>
            </div>
        </div>
    );
};


// --- 文章管理列表组件 (已恢复筛选和导出功能) ---
const ArticleList: FC<{ articles: Article[]; isLoading: boolean; error: string | null; onEdit: (article: Article) => void; onDelete: (articleId: string) => void; }> = ({ articles, isLoading, error, onEdit, onDelete }) => {
    const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
    const [keyword, setKeyword] = useState('');
    const [author, setAuthor] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        let tempArticles = [...articles];
        if (keyword) tempArticles = tempArticles.filter(a => a.title.toLowerCase().includes(keyword.toLowerCase()));
        if (author) tempArticles = tempArticles.filter(a => a.authorEmail.toLowerCase().includes(author.toLowerCase()));
        if (startDate) tempArticles = tempArticles.filter(a => new Date(a.createdAt) >= new Date(startDate));
        if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempArticles = tempArticles.filter(a => new Date(a.createdAt) <= endOfDay); }
        setFilteredArticles(tempArticles);
    }, [articles, keyword, author, startDate, endDate]);
    
    const handleExport = () => {
        if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; }
        const dataToExport = filteredArticles.map(a => ({'标题': a.title, '作者': a.authorEmail, '发布日期': new Date(a.createdAt).toLocaleDateString(), '封面图URL': a.coverImageUrl, }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "文章列表");
        XLSX.writeFile(workbook, "文章列表.xlsx");
    };

    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">文章管理</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/><input type="text" placeholder="按标题筛选..." value={keyword} onChange={e => setKeyword(e.target.value)} className="p-2 pl-10 rounded border bg-white dark:bg-gray-700"/></div>
                <input type="text" placeholder="按作者筛选..." value={author} onChange={e => setAuthor(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/>
                <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-500"/><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><span>-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/></div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Download className="h-5 w-5"/>导出 Excel</button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr><th scope="col" className="px-6 py-3">封面图</th><th scope="col" className="px-6 py-3">标题</th><th scope="col" className="px-6 py-3">作者</th><th scope="col" className="px-6 py-3">发布日期</th><th scope="col" className="px-6 py-3 text-center">操作</th></tr>
                    </thead>
                    <tbody>
                        {isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : 
                         error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : 
                         filteredArticles.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的文章</td></tr>) : 
                         (filteredArticles.map((article) => (<tr key={article.id} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600"><td className="p-4"><img src={article.coverImageUrl || "https://placehold.co/100x100/EEE/333?text=N/A"} alt={article.title} width={80} height={80} className="rounded-md object-cover w-20 h-20" /></td><th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">{article.title}</th><td className="px-6 py-4">{article.authorEmail}</td><td className="px-6 py-4">{new Date(article.createdAt).toLocaleDateString()}</td><td className="px-6 py-4 text-center"><button onClick={() => onEdit(article)} className="font-medium text-blue-500 hover:underline mr-4"><Edit className="inline h-5 w-5"/></button><button onClick={() => onDelete(article.id)} className="font-medium text-red-500 hover:underline"><Trash2 className="inline h-5 w-5"/></button></td></tr>)))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- 客户问题一览组件 (已恢复) ---
const ChatLogViewer: FC<{ logs: ChatLog[]; isLoading: boolean; error: string | null; onRefresh: () => void; }> = ({ logs, isLoading, error, onRefresh }) => {
    const [filteredLogs, setFilteredLogs] = useState<ChatLog[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    useEffect(() => { let tempLogs = [...logs]; if (startDate) { tempLogs = tempLogs.filter(log => new Date(log.timestamp) >= new Date(startDate)); } if (endDate) { const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999); tempLogs = tempLogs.filter(log => new Date(log.timestamp) <= endOfDay); } setFilteredLogs(tempLogs.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())); }, [logs, startDate, endDate]);
    const handleSelect = (key: string) => { const newSelection = new Set(selectedKeys); if (newSelection.has(key)) { newSelection.delete(key); } else { newSelection.add(key); } setSelectedKeys(newSelection); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.checked) { setSelectedKeys(new Set(filteredLogs.map(log => log.key))); } else { setSelectedKeys(new Set()); } };
    const handleDelete = async (keysToDelete: string[]) => { if (keysToDelete.length === 0 || !window.confirm(`确定要删除选中的 ${keysToDelete.length} 条记录吗？`)) return; try { const response = await fetch('/api/chat-logs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keys: keysToDelete }), }); if (!response.ok) throw new Error('删除失败'); alert('删除成功！'); onRefresh(); setSelectedKeys(new Set()); } catch (err) { alert(err instanceof Error ? err.message : '删除时发生未知错误'); } };
    const handleExport = () => { if (typeof XLSX === 'undefined') { alert('导出库正在加载中，请稍后再试。'); return; } const dataToExport = filteredLogs.map(log => ({ '用户邮箱': log.user.email, '用户问题': log.question, '提问时间': new Date(log.timestamp).toLocaleString(), })); const worksheet = XLSX.utils.json_to_sheet(dataToExport); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "客户问题记录"); XLSX.writeFile(workbook, "客户问题记录.xlsx"); };
    return (
        <div className="p-4 md:p-8 w-full h-full flex flex-col">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">客户问题一览</h1>
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-gray-500"/><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/><span>-</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 rounded border bg-white dark:bg-gray-700"/></div>
                <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"><Download className="h-5 w-5"/>导出 Excel</button>
                <button onClick={() => handleDelete(Array.from(selectedKeys))} disabled={selectedKeys.size === 0} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"><Trash2 className="h-5 w-5"/>删除选中</button>
            </div>
            <div className="flex-1 overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"><tr><th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={filteredLogs.length > 0 && selectedKeys.size === filteredLogs.length}/></th><th scope="col" className="px-6 py-3">用户</th><th scope="col" className="px-6 py-3">问题内容</th><th scope="col" className="px-6 py-3">时间</th><th scope="col" className="px-6 py-3">操作</th></tr></thead>
                    <tbody>{isLoading ? (<tr><td colSpan={5} className="text-center p-8">正在加载...</td></tr>) : error ? (<tr><td colSpan={5} className="text-center p-8 text-red-500">{error}</td></tr>) : filteredLogs.length === 0 ? (<tr><td colSpan={5} className="text-center p-8">没有符合条件的记录</td></tr>) : (filteredLogs.map((log) => (<tr key={log.key} className="bg-white border-b dark:bg-gray-800 hover:bg-gray-600"><td className="p-4"><input type="checkbox" checked={selectedKeys.has(log.key)} onChange={() => handleSelect(log.key)}/></td><td className="px-6 py-4">{log.user.email}</td><td className="px-6 py-4 max-w-md truncate" title={log.question}>{log.question}</td><td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td><td className="px-6 py-4"><button onClick={() => handleDelete([log.key])} className="text-red-500 hover:underline"><Trash2 className="h-5 w-5"/></button></td></tr>)))}</tbody>
                </table>
            </div>
        </div>
    );
};


// --- 主页面组件 ---
export default function AdminPage() {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<'list' | 'editor' | 'questions'>('list');
    const [articles, setArticles] = useState<Article[]>([]);
    const [isArticlesLoading, setIsArticlesLoading] = useState(true);
    const [articlesError, setArticlesError] = useState<string | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isChatLogsLoading, setIsChatLogsLoading] = useState(true);
    const [chatLogsError, setChatLogsError] = useState<string | null>(null);

    useEffect(() => { const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; script.async = true; document.body.appendChild(script); return () => { document.body.removeChild(script); }; }, []);

    const fetchArticles = async () => { 
        setIsArticlesLoading(true); 
        setArticlesError(null); 
        try { 
            const response = await fetch('/api/articles'); 
            if (!response.ok) throw new Error('获取文章数据失败'); 
            const data = await response.json(); 
            const parsedArticles = data.map((item: unknown) => typeof item === 'string' ? JSON.parse(item) : item).filter(Boolean); 
            parsedArticles.sort((a:Article, b:Article) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); 
            setArticles(parsedArticles); 
        } catch (err: unknown) { 
            setArticlesError(err instanceof Error ? err.message : '未知错误'); 
        } finally { 
            setIsArticlesLoading(false); 
        } 
    };
    
    const fetchChatLogs = async () => {
        setIsChatLogsLoading(true);
        setChatLogsError(null);
        try {
            const response = await fetch('/api/chat-logs');
            if (!response.ok) throw new Error('获取聊天记录失败');
            const data = await response.json();
            setChatLogs(data);
        } catch (err: unknown) {
            setChatLogsError(err instanceof Error ? err.message : '未知错误');
        } finally {
            setIsChatLogsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') fetchArticles();
        if (view === 'questions') fetchChatLogs();
    }, [view]);

    const handleEditArticle = (article: Article) => { setEditingArticle(article); setView('editor'); };
    const handleNewArticle = () => { setEditingArticle(null); setView('editor'); };
    const handleDeleteArticle = async (articleId: string) => { if (!window.confirm(`确定删除文章？`)) return; try { const response = await fetch('/api/articles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: articleId }), }); if (!response.ok) { const d = await response.json(); throw new Error(d.message || '删除失败'); } fetchArticles(); } catch (err: unknown) { alert(err instanceof Error ? err.message : '删除时发生错误'); } };
    const handlePublishSuccess = () => { alert('操作成功！'); setView('list'); };

    const adminLinks: LinkItem[] = [
        { label: "文章管理", href: "#", icon: <FileText className="h-5 w-5" />, action: () => setView('list') },
        { label: "写新文章", href: "#", icon: <PlusCircle className="h-5 w-5" />, action: handleNewArticle },
        { label: "问题一览", href: "#", icon: <MessageSquare className="h-5 w-5" />, action: () => setView('questions') },
        { label: "系统设置", href: "#", icon: <Settings className="h-5 w-5" />, action: () => alert('设置功能待开发') },
    ];

    const userData = { name: "管理员", href: "#", avatarUrl: "https://placehold.co/100x100/E5E7EB/4B5563?text=A" };
    const userLink = { label: userData.name, href: userData.href, icon: (<img src={userData.avatarUrl} className="h-7 w-7 rounded-full" alt="avatar" />) };

    const renderView = () => {
        switch(view) {
            case 'list': return <ArticleList articles={articles} isLoading={isArticlesLoading} error={articlesError} onEdit={handleEditArticle} onDelete={handleDeleteArticle} />;
            case 'editor': return <ArticleEditor onArticlePublished={handlePublishSuccess} articleToEdit={editingArticle} />;
            case 'questions': return <ChatLogViewer logs={chatLogs} isLoading={isChatLogsLoading} error={chatLogsError} onRefresh={fetchChatLogs} />;
            default: return <div>请选择一个视图</div>;
        }
    };

    return (
        <div className="flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-900 w-full h-screen">
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
                {renderView()}
            </main>
        </div>
    );
}
