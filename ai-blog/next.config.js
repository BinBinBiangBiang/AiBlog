/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['antd', '@ant-design'], // 按需加载 antd
  images: {
    // 配置允许的远程图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    forceSwcTransforms: true, // 强制使用 SWC
  },
  reactStrictMode: false,
};

module.exports = config;
