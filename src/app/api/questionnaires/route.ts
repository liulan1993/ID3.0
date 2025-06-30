// 文件路径: src/app/api/questionnaires/route.ts

import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

// GET: 获取所有问卷提交记录
export async function GET() {
  try {
    const submissionKeys = await kv.keys('user_questionnaires:*');
    if (submissionKeys.length === 0) {
      return NextResponse.json([]);
    }
    const submissionsRaw = await kv.mget(...submissionKeys);

    const submissions = submissionsRaw.map((sub, index) => {
      const key = submissionKeys[index];
      let data;
      if (typeof sub === 'string') {
        try {
          data = JSON.parse(sub);
        } catch (e) {
          console.error("Failed to parse questionnaire submission:", sub, e);
          return null;
        }
      } else if (sub && typeof sub === 'object') {
        data = sub;
      } else {
        return null;
      }
      
      return { key, ...data };

    }).filter(Boolean);

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching questionnaires:", error);
    return NextResponse.json({ message: "获取问卷记录失败" }, { status: 500 });
  }
}

// DELETE: 删除一个或多个问卷记录
export async function DELETE(req: NextRequest) {
  try {
    const { keys } = await req.json();
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ message: "缺少要删除的记录 key" }, { status: 400 });
    }

    const deletedCount = await kv.del(...keys);

    if (deletedCount === 0) {
        return NextResponse.json({ message: "记录不存在或已被删除" }, { status: 404 });
    }

    return NextResponse.json({ message: `成功删除了 ${deletedCount} 条记录` }, { status: 200 });
  } catch (error) {
    console.error("Error deleting questionnaires:", error);
    return NextResponse.json({ message: "删除问卷记录失败" }, { status: 500 });
  }
}