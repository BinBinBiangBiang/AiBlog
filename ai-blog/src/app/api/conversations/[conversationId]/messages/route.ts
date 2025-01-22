import { NextResponse } from 'next/server';
import pool from '@/lib/db';

import OpenAI from 'openai';

// 创建 OpenAI 实例 并配置 API 密钥
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: `${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
});

export async function GET(request: Request, { params }: { params: { conversationId: string } }) {
  const conversationId = params.conversationId;
  const [messages] = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversationId]
  );
  return NextResponse.json({ data: messages });
}

export async function POST(
  request: Request,
  { params }: { params: { conversation_id: string; user_id: number; content: string } }
) {
  const { content, user_id, conversation_id } = await request.json();
  let aiResponse = '';
  try {
    // 校验参数是否正确
    if (!conversation_id || !content || !user_id) {
      return NextResponse.json({ error: '传参缺失！' }, { status: 400 });
    }

    // 查询用户是否存在
    const [user] = await pool.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const userArray = user as any[];
    console.log('User query result:', user);
    if (!userArray || userArray.length === 0) {
      return NextResponse.json({ error: '用户不存在！' }, { status: 400 });
    }

    // 保存用户消息到数据库
    const [userMessage] = await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
      [conversation_id, 'user', content, user_id, 1] // 假设 user_id 为 1
    );

    console.log('User message saved:', userMessage);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        // 调用 DeepSeek API
        const completion = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' }, // 系统提示
            { role: 'user', content }, // 用户消息
          ],
          stream: true, // 启用流式响应
        });

        // 处理流式响应
        for await (const chunk of completion) {
          const contentChunk = chunk.choices[0]?.delta?.content || '';
          if (contentChunk) {
            aiResponse += contentChunk; // 逐步拼接 AI 回复
            controller.enqueue(new TextEncoder().encode(contentChunk)); // 发送给客户端
          }
        }

        // 流式响应结束，保存完整的 AI
        await pool.query(
          'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
          [conversation_id, 'assistant', aiResponse, user_id, 1]
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error:', error);
    // AI对话失败，不保存记录，记录seedStatus为0
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
      [conversation_id, 'user', aiResponse, user_id, 0]
    );
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
