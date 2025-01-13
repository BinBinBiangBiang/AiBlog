'use client';
import { Layout, Menu } from 'antd';
import Link from 'next/link';
import Image from 'next/image';
import type { MenuProps } from 'antd';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const { Header: AntHeader } = Layout;
const accessLink = ['/', '/about', '/chat'];

const HEADER_HEIGHT = '64px';
const LOGO_SIZE = 120;

function Header() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathName = usePathname();

  // 动态生成菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: 'home',
      label: <Link href="/">首页</Link>,
      className: pathName === '/' ? 'ant-menu-item-selected' : '',
    },
    {
      key: 'about',
      label: <Link href="/about">关于我们</Link>,
      className: pathName === '/about' ? 'ant-menu-item-selected' : '',
    },
    {
      key: 'chat',
      label: <Link href="/chat">AI对话</Link>,
      className: pathName === '/chat' ? 'ant-menu-item-selected' : '',
    },
  ];

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

  if (!accessLink.includes(pathName)) return null;

  return (
    <AntHeader
      className={`
        fixed top-0 w-full z-[1000] transition-transform duration-300 ease-in-out
        ${visible ? 'translate-y-0' : '-translate-y-full'}
        bg-white shadow-md flex items-center px-3 overflow-hidden
      `}
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="logo-container h-16 w-14 flex-shrink-0 flex items-center  p-0 m-0 bg-transparent mr-4 -ml-6">
        <Image
          src="/images/logo1.svg"
          alt="Logo"
          width={50}
          height={20}
          priority
          className="object-cover object-center scale-[4] p-0 m-0"
        />
      </div>
      <Menu mode="horizontal" items={menuItems} className="flex-1 min-w-0 border-none" />
    </AntHeader>
  );
}

export default Header;
