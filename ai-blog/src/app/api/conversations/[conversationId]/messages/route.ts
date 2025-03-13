import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import OpenAI from 'openai';

// 创建 OpenAI 实例
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: `${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
});

// 获取会话的所有消息
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const conversationId = params.conversationId;

  try {
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = ? AND seedStatus = 1 ORDER BY created_at ASC',
      [conversationId]
    );

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: '获取消息失败' }, { status: 500 });
  }
}

// 发送消息到AI并获取回复
export async function POST(request: Request, { params }: { params: { conversationId: string } }) {
  const conversationId = params.conversationId;
  const { content, user_id } = await request.json();
  let aiResponse = '';

  try {
    // 校验参数
    if (!conversationId || !content || !user_id) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    // 查询用户是否存在
    const [user] = await pool.query('SELECT * FROM users WHERE user_id = ?', [user_id]);
    const userArray = user as any[];
    if (!userArray || userArray.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 400 });
    }

    // 保存用户消息
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
      [conversationId, 'user', content, user_id, 1]
    );

    // 获取此会话的前几条消息作为上下文
    const [previousMessages]: any = await pool.query(
      'SELECT role, content FROM messages WHERE conversation_id = ? AND seedStatus = 1 ORDER BY created_at DESC LIMIT 10',
      [conversationId]
    );

    // 转换为OpenAI格式的消息数组（最新的消息在最后）
    const messageHistory = previousMessages
      .reverse()
      .map((msg: any) => ({ role: msg.role, content: msg.content }));

    // 更新会话标题（如果是第一条消息）
    const [messageCount]: any = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?',
      [conversationId]
    );

    if (messageCount[0].count <= 2) {
      // 使用用户的第一条消息作为会话标题（截取部分）
      const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
      await pool.query(
        'UPDATE conversations SET title = ?, updated_at = NOW() WHERE conversation_id = ?',
        [title, conversationId]
      );
    } else {
      // 更新会话的更新时间
      await pool.query('UPDATE conversations SET updated_at = NOW() WHERE conversation_id = ?', [
        conversationId,
      ]);
    }

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        // 调用AI API
        const completion = await openai.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            ...messageHistory,
          ],
          stream: true,
        });

        // 处理流式响应
        for await (const chunk of completion) {
          const contentChunk = chunk.choices[0]?.delta?.content || '';
          if (contentChunk) {
            aiResponse += contentChunk;
            controller.enqueue(new TextEncoder().encode(contentChunk));
          }
        }

        // 保存AI回复
        await pool.query(
          'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
          [conversationId, 'assistant', aiResponse, user_id, 1]
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error:', error);
    // 记录失败
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_id, seedStatus) VALUES (?, ?, ?, ?, ?)',
      [conversationId, 'system', '消息处理失败', user_id, 0]
    );
    return NextResponse.json({ error: '内部服务器错误' }, { status: 500 });
  }
}
