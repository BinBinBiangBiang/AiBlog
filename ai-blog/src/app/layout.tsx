import ClientLayout from '@/components/ClientLayout';
import Header from '@/components/Header';
import type { Metadata } from 'next';
import { RootStyleRegistry } from './rootStyleRegistry';
import './globals.css';

export const metadata: Metadata = {
  title: '网站标题',
  description: '网站描述',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <RootStyleRegistry>
          <ClientLayout>
            <Header />
            <main style={{ marginTop: '64px', minHeight: 'calc(100vh - 64px)' }}>{children}</main>
          </ClientLayout>
        </RootStyleRegistry>
      </body>
    </html>
  );
}
