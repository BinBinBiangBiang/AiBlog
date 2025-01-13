import { NextResponse } from 'next/server';
const mysql = require('mysql2/promise');

// 创建全局的 MySQL 连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST, // 服务器地址
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD, // 密码
  database: process.env.MYSQL_DATABASE,
});

export async function GET(request) {
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
