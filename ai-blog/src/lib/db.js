import mysql from 'mysql2/promise';

// 创建 MySQL 连接池
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST, // 服务器地址
  port: 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD, // 密码
  database: process.env.MYSQL_DATABASE,
});

// 导出连接池
export default pool;
