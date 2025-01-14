import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    // 从连接池中获取连接
    const connection = await pool.getConnection();

    // 执行 MySQL 查询
    const [rows, fields] = await connection.query('SELECT * FROM users');

    // 释放连接回连接池
    connection.release();

    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
