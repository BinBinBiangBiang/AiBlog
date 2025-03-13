import { NextRequest, NextResponse } from 'next/server';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  // type 1 是使用账号名和密码登录  2 是使用邮箱登录
  const { username, password, type } = await request.json();

  try {
    if (type === 1) {
        // 使用账号名和密码登录
        const [rows, fields] = await pool.query(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );
    } else if (type === 2) {
        // 使用邮箱登录 ()
        const [rows, fields] = await pool.query(
            'SELECT * FROM users WHERE email = ? AND password = ?',
            [email, password]
        );
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    return NextResponse.json({ data: rows[0] });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json({ error: '登录失败' }, { status: 500 });
  }
