/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '212.220.105.29',
        port: '8079',
        pathname: '/api/**',
      },
    ],
  },
  // Note: rewrites don't work with static export
  // async rewrites() {
  //   return [
  //     {
  //       source: '/proxy-api/:path*',
  //       destination: 'http://212.220.105.29:8079/api/:path*',
  //     },
  //   ]
  // },
}

module.exports = nextConfig
