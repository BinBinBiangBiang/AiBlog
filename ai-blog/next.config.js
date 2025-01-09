/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@ant-design'],
  images: {
    // 配置允许的远程图片域名
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = config;
