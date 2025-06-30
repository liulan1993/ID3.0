// 文件路径: src/app/api/export-pdf/route.ts

import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CustomerSubmission } from '@/app/admin/page'; // 假设类型定义在 page.tsx 中导出

export async function POST(request: Request) {
  try {
    const submission = (await request.json()) as CustomerSubmission;

    if (!submission) {
      return new NextResponse('缺少反馈数据', { status: 400 });
    }

    // 创建一个新的 PDF 文档
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 50;
    let y = height - margin;

    // 添加标题和用户信息
    page.drawText(submission.userName, {
      x: margin,
      y: y,
      font,
      size: 24,
      color: rgb(0, 0, 0),
    });
    y -= 20;
    page.drawText(`${submission.userEmail} - ${new Date(submission.submittedAt).toLocaleString()}`, {
        x: margin,
        y: y,
        font,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
    });
    y -= 30;

    // 添加内容
    const contentLines = submission.content.split('\n');
    for (const line of contentLines) {
        if (y < margin + 20) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
        page.drawText(line, {
            x: margin,
            y: y,
            font,
            size: 12,
            color: rgb(0, 0, 0),
            lineHeight: 15,
        });
        y -= 15;
    }

    // 添加图片
    if (submission.fileUrls && submission.fileUrls.length > 0) {
        y -= 20;
         if (y < margin + 20) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
        page.drawText('附件图片:', {
            x: margin,
            y: y,
            font,
            size: 16,
        });
        y -= 20;

        for (const url of submission.fileUrls) {
            try {
                const proxyUrl = `${new URL(request.url).origin}/api/image-proxy?url=${encodeURIComponent(url)}`;
                const imageResponse = await fetch(proxyUrl);
                const imageBytes = await imageResponse.arrayBuffer();
                
                let image;
                if (url.toLowerCase().endsWith('.png')) {
                    image = await pdfDoc.embedPng(imageBytes);
                } else {
                    image = await pdfDoc.embedJpg(imageBytes);
                }
                
                const dims = image.scale(1);
                const maxWidth = width - margin * 2;
                if (dims.width > maxWidth) {
                    dims.width = maxWidth;
                    dims.height = (dims.width * image.height) / image.width;
                }

                if (y < dims.height + margin) {
                    page = pdfDoc.addPage();
                    y = height - margin;
                }
                y -= dims.height;

                page.drawImage(image, {
                    x: margin,
                    y: y,
                    width: dims.width,
                    height: dims.height,
                });
                y -= 20; // 图片间的间距

            } catch (err) {
                console.error(`加载或嵌入图片失败: ${url}`, err);
                 if (y < margin + 20) {
                    page = pdfDoc.addPage();
                    y = height - margin;
                }
                page.drawText(`[图片加载失败: ${url.slice(0, 50)}...]`, {
                    x: margin,
                    y: y,
                    font,
                    size: 10,
                    color: rgb(1, 0, 0),
                });
                y -= 15;
            }
        }
    }

    // 将 PDF 文档序列化为字节数组
    const pdfBytes = await pdfDoc.save();

    // 返回 PDF 文件
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="feedback-${submission.key.slice(-12)}.pdf"`,
      },
    });

  } catch (error) {
    console.error('生成PDF时出错:', error);
    return new NextResponse('生成PDF时发生未知错误', { status: 500 });
  }
}
