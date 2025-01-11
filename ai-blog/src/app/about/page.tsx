'use client';

import { Layout } from 'antd';
import ServerAbout from './server/index';
const { Content } = Layout;

export default function About() {
  return (
    <Content style={{ padding: '24px' }}>
      <ServerAbout />
    </Content>
  );
}
