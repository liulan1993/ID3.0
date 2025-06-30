// 文件路径: src/app/business/page.tsx

import { kv } from '@vercel/kv';
import BusinessClient from '@/components/ui/business-client';
import { Article } from '@/components/ui/business-client'; // 引入类型

// Page 组件现在是一个服务器组件，负责获取数据
export default async function Page() {
    
    // 服务器端数据获取逻辑
    const fetchArticles = async (): Promise<Article[]> => {
        try {
            // 1. 获取所有匹配 'article:*' 模式的键
            const articleKeys = await kv.keys('article:*');
            if (articleKeys.length === 0) {
                return []; // 如果没有文章，返回空数组
            }
            // 2. 批量获取所有键对应的值
            const articlesData = await kv.mget(...articleKeys);
            
            // 3. (关键修正) 解析从KV中取出的JSON字符串
            const articles: Article[] = articlesData
                .filter(item => item !== null) // 确保数据不为 null
                .map(item => {
                    // 因为数据在存储时被字符串化了，所以在这里需要解析回来
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
            
            // 按创建时间降序排序，最新的文章在最前面
            articles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return articles;
        } catch (error) {
            console.error("Failed to fetch articles from Vercel KV:", error);
            return []; // 出错时返回空数组
        }
    };

    const articles = await fetchArticles();

    return (
        // 将获取到的文章数据作为 props 传递给客户端组件
        <BusinessClient articles={articles} />
    );
}
