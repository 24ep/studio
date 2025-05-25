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
  // For production, this should be handled by your reverse proxy or hosting setup.
  // Example: allowedDevOrigins: ['http://localhost:3000', 'https://159.89.193.226:6000']
  // Replace with your actual development origin(s) if needed.
  // For now, I will leave it commented out or with a very permissive example
  // for ease of development, but be mindful of this for production.
  // experimental: {
  //   allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000"], // Add your specific IPs/ports if needed
  // }
  // If you are using a specific IP like 159.89.193.226, you might need to add its scheme and port.
  // For example, if your Next.js app runs on port 9002:
  // experimental: {
  //  allowedDevOrigins: ["http://159.89.193.226:9002"]
  // }
  // It's generally safer to keep this restrictive.
  // For this prototype, if you're consistently accessing from 159.89.193.226 (assuming HTTP and port 9002), you could add:
  // Note: This is an experimental feature.
  // experimental: {
  //   allowedDevOrigins: ["http://159.89.193.226:9002"],
  // },
};

export default nextConfig;
