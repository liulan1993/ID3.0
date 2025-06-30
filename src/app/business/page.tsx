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
            
            // 3. 解析并过滤掉可能为空的数据
            const articles = articlesData
                .filter(item => item !== null) // 确保数据不为 null
                .map(item => item as Article); // 类型断言
            
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
