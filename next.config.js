/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: process.env.NODE_ENV === 'development' 
      ? ["http://localhost:9002", "http://localhost:9846", "http://159.89.193.226:9002", "http://10.0.10.57:9846"] 
      : undefined,
  },
};

module.exports = nextConfig;