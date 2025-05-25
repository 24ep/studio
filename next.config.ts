
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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
  // Add allowedDevOrigins for development if accessing from non-localhost
  // This is primarily for development scenarios. In production, your reverse proxy
  // or hosting setup would typically handle CORS policies.
  //
  // If you are consistently developing and accessing your Next.js app from 159.89.193.226
  // on port 9002 (the port your app is running on), you would uncomment and use:
  //
  // experimental: {
  //   allowedDevOrigins: ["http://159.89.193.226:9002"],
  // },
  //
  // For a more general development setup, you might have something like:
  // experimental: {
  //   allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000", "http://<your-local-network-ip>:<your-port>"],
  // },
  //
  // For now, to address the specific warning from 159.89.193.226, I will add it.
  // Please be mindful that this is an experimental feature and for development use.
  // Replace with your actual origin if it's different, or remove/restrict for production.
  experimental: {
    allowedDevOrigins: process.env.NODE_ENV === 'development' ? ["http://159.89.193.226:9002"] : undefined,
  },
};

export default nextConfig;

    