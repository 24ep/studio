/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize build performance
  swcMinify: true,
  compress: true,
  
  // Reduce bundle size
  experimental: {
    optimizeCss: false,
    optimizePackageImports: [
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'lucide-react',
      'date-fns',
      'recharts',
      'react-quill',
      'genkit',
      '@genkit-ai/googleai'
    ],
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
  
  webpack: (config, { isServer, dev }) => {
    // Optimize for production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 10,
            },
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              chunks: 'all',
              priority: 10,
            },
            genkit: {
              test: /[\\/]node_modules[\\/](genkit|@genkit-ai)[\\/]/,
              name: 'genkit',
              chunks: 'all',
              priority: 10,
            },
            reactQuill: {
              test: /[\\/]node_modules[\\/]react-quill[\\/]/,
              name: 'react-quill',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }

    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;