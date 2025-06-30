// 文件路径: src/app/business/page.tsx

import { kv } from '@vercel/kv';
import BusinessClient from '@/components/ui/business-client';
import { Article } from '@/components/ui/business-client'; // 引入类型

// (关键修正 1) 强制页面动态渲染
// 这会确保每次访问都从服务器获取最新数据，是解决顽固缓存问题的最强力方法。
export const dynamic = 'force-dynamic';
// export const revalidate = 0; // 'force-dynamic' 是 revalidate: 0 的一个更强力的等价物

// Page 组件是一个服务器组件，负责获取数据
export default async function Page() {
    
    // 服务器端数据获取逻辑
    const fetchArticles = async (): Promise<Article[]> => {
        try {
            // 1. 获取所有文章的key
            const articleKeys = await kv.keys('article:*');
            if (articleKeys.length === 0) {
                return []; 
            }
            // 2. 批量获取所有文章的数据
            const articlesData = await kv.mget(...articleKeys);
            
            // 3. 解析从数据库取出的JSON字符串
            const articles: Article[] = articlesData
                .filter(item => item !== null) 
                .map(item => {
                    if (typeof item === 'string') {
                        try {
                            return JSON.parse(item);
                        } catch (e) {
                            console.error("Failed to parse article JSON:", item, e);
                            return null;
                        }
                    }
                    return item as Article;
                })
                .filter((item): item is Article => item !== null); // 过滤掉解析失败的项目
            
            // 4. 按创建时间降序排序，确保最新的文章在最前面
            articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            // 截取最新的2篇文章
            return articles.slice(0, 2);

        } catch (error) {
            console.error("Failed to fetch articles from Vercel KV:", error);
            return []; // 出错时返回空数组
        }
    };

    const articles = await fetchArticles();

    // 将获取并处理好的文章数据作为 props 传递给客户端组件
    return (
        <BusinessClient articles={articles} />
    );
}
