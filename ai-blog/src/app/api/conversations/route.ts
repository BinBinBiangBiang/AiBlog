import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

// 获取用户的所有会话
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  try {
    const [conversations] = await pool.query(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: '获取会话列表失败' }, { status: 500 });
  }
}

// 创建新会话
export async function POST(request: NextRequest) {
  const { user_id, title } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  try {
    // 生成唯一的会话ID
    const conversation_id = uuidv4();

    // 在插入时提供 conversation_id
    const [result] = await pool.query(
      'INSERT INTO conversations (conversation_id, user_id, title) VALUES (?, ?, ?)',
      [conversation_id, user_id, title || '新对话']
    );

    return NextResponse.json({ data: { conversation_id } });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: '创建会话失败' }, { status: 500 });
  }
}
