'use client';
import { Layout, Menu } from 'antd';
import Link from 'next/link';
import Image from 'next/image';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';

const { Header: AntHeader } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: 'home',
    label: <Link href="/">首页</Link>,
  },
  {
    key: 'about',
    label: <Link href="/about">关于我们</Link>,
  },
  {
    key: 'chat',
    label: <Link href="/chat">AI对话</Link>,
  },
];

const HEADER_HEIGHT = '64px';
const LOGO_SIZE = 120;

export default function Header() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 100) {
        setVisible(lastScrollY > currentScrollY);
      } else {
        setVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <AntHeader
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        height: HEADER_HEIGHT,
        zIndex: 1000,
        transition: 'transform 0.3s ease-in-out',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
      }}
    >
      <div
        className="logo-container"
        style={{
          marginRight: '24px',
          height: '64px',
          width: '100px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
        }}
      >
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={100}
          height={64}
          priority
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            scale: '2.0',
            padding: 0,
            margin: 0,
          }}
        />
      </div>
      <Menu
        mode="horizontal"
        items={menuItems}
        style={{
          flex: 1,
          minWidth: 0,
          borderBottom: 'none',
        }}
      />
    </AntHeader>
  );
}
