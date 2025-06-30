// 文件路径: src/app/api/image-proxy/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new NextResponse('缺少图片 URL', { status: 400 });
    }

    // 在服务器端获取外部图片
    const imageResponse = await fetch(imageUrl, {
      headers: {
        // 模拟浏览器请求头，避免被某些服务阻止
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!imageResponse.ok) {
      return new NextResponse(`无法获取图片: ${imageResponse.statusText}`, { status: imageResponse.status });
    }

    // 获取图片数据和类型
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

    // 将图片数据返回给前端
    const response = new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // 设置一周的缓存
      },
    });
    
    return response;

  } catch (error) {
    console.error('图片代理时出错:', error);
    return new NextResponse('服务器内部错误', { status: 500 });
  }
}
