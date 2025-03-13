import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 删除会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const conversationId = params.conversationId;

  try {
    // 先删除会话中的所有消息
    await pool.query('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);

    // 然后删除会话本身
    await pool.query('DELETE FROM conversations WHERE conversation_id = ?', [conversationId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: '删除会话失败' }, { status: 500 });
  }
}
