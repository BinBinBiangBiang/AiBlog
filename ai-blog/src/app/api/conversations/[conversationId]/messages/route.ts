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

  if (!conversation_id || !content) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 保存用户消息到数据库
  const [userMessage] = await pool.query(
    'INSERT INTO messages (conversation_id, role, content, user_id) VALUES (?, ?, ?, ?)',
    [conversation_id, 'user', content, 1] // 假设 user_id 为 1
  );

  // 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      let aiResponse = '';

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

      // 流式响应结束，保存完整的 AI 回复
      await pool.query(
        'INSERT INTO messages (conversation_id, role, content, user_id) VALUES (?, ?, ?, ?)',
        [conversation_id, 'assistant', aiResponse, user_id]
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
