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
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new NextResponse('无法获取图片', { status: imageResponse.status });
    }

    // 获取图片数据和类型
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';

    // 将图片数据返回给前端
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // 添加缓存头以提高性能
      },
    });

  } catch (error) {
    console.error('图片代理时出错:', error);
    return new NextResponse('服务器内部错误', { status: 500 });
  }
}
