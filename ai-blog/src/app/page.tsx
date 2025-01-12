'use client';
import { Layout } from 'antd';

const { Content } = Layout;

export default function Home() {
  return (
    <Content className="p-4 mt-10">
      <h1>Welcome to Home Page</h1>
      <p>Scroll down to see header behavior</p>
      {/* 添加更多内容... */}
    </Content>
  );
}
