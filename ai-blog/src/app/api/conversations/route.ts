import { NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export async function GET() {
  const [conversations] = await pool.query('SELECT * FROM conversations');
  return NextResponse.json({ data: conversations });
}

export async function POST(request: Request) {
  const { title, user_id } = await request.json();

  if (!user_id || !title) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // 检查是否已存在相同标题的会话
    console.log('title', title);
    console.log('user_id', user_id);
    const [existingConversation] = await pool.query<RowDataPacket[]>(
      'SELECT conversation_id  FROM conversations WHERE user_id = ? AND title = ?',
      [user_id, title]
    );

    // 前端生成会话的唯一id 存储在后端 如果已经生成了就直接返回
    let conversationId = '';

    // 如果已存在，返回现有会话 ID
    if (Array.isArray(existingConversation) && existingConversation.length > 0) {
      console.log('existingConversation', existingConversation);
      conversationId = existingConversation[0].conversation_id;
      console.log('conversationId', conversationId);
      return NextResponse.json({
        data: {
          conversation_id: conversationId,
        },
      });
    }

    // 否则，创建新会话
    conversationId = uuidv4();
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)',
      [conversationId, user_id, title] // 使用 uuidv4() 生成唯一标识符
    );

    return NextResponse.json({
      data: {
        conversation_id: conversationId,
      },
    });
  } catch (error) {
    console.error('Error creating conversation:', error); // 新增：打印错误日志
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
