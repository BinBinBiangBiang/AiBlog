'use client';
import { ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#00b96b',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
