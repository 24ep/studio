const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The default dev script uses Turbopack. Declaring its config prevents Next
  // from treating the webpack customization below as an accidental mismatch.
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
    // Optimize package imports to reduce bundle size and memory usage
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'react-hot-toast',
      'chart.js',
      'recharts',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
    // Disable expensive optimizations for fast builds only
    ...(process.env.FAST_BUILD === 'true' ? {
      optimizePackageImports: [],
    } : {}),
  },
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  // Enable standalone output for optimized Docker builds
  // This creates a minimal production build with only necessary files
  output: 'standalone',
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', './CHANGELOG.md'],
  },

  // Enable production-like optimizations in dev mode
  // swcMinify is enabled by default in Next.js 15, no need to specify
  productionBrowserSourceMaps: false,

  // Generate simpler build ID for local builds
  generateBuildId: (!process.env.CI && process.env.NODE_ENV !== 'production')
    ? async () => 'local-build-' + Date.now()
    : undefined,




  // Force Node.js runtime for all API routes to avoid Edge Runtime issues
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },

  // Configure headers for CORS and security
  // Simplify headers for local builds to reduce build time
  async headers() {
    // Skip complex headers during local builds (faster)
    if (!process.env.CI && process.env.NODE_ENV !== 'production') {
      return [];
    }

    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            // SECURITY: CORS is handled dynamically by cors.ts and middleware.ts
            // This static header is a fallback but should match NEXTAUTH_URL if set
            // If NEXTAUTH_URL is not set, the dynamic CORS handler will reject unauthorized origins
            value: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXTAUTH_URL || ''),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // SECURITY NOTE: 'unsafe-inline' and 'unsafe-eval' are required for Next.js
            // and some third-party libraries. Consider using nonces or hashes in the future.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http://localhost:9001 https://placehold.co https://storage.example.com; connect-src 'self' http://localhost:9001; frame-src 'self' https://www.openstreetmap.org; frame-ancestors 'self' https://your-app.example.com; base-uri 'self'; form-action 'self'; object-src 'none'; media-src 'self';",
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },

  // Image configuration
  images: {
    domains: ['localhost', '127.0.0.1', 'placehold.co'],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9001', pathname: '/studio-production/settings/**' },
      { protocol: 'http', hostname: 'localhost', port: '9001', pathname: '/uploads/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Disable image optimization during fast builds for speed
    ...(process.env.FAST_BUILD === 'true' ? {
      unoptimized: false, // Keep optimization but reduce quality
    } : {}),
  },

  // Webpack configuration
  webpack: (config, { isServer, dev }) => {
    const disableOptimization = process.env.DISABLE_OPTIMIZATION === 'true';
    const enableProductionOptimizations = process.env.ENABLE_PROD_OPTIMIZATIONS === 'true' || process.env.NODE_ENV === 'production';
    // Always use fast build optimizations for local builds (simpler)
    // Also enable fast builds when FAST_BUILD env var is set (even in production)
    const isLocalBuild = (!process.env.CI && process.env.NODE_ENV !== 'production') || process.env.FAST_BUILD === 'true';

    // Exclude test dependencies from build
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push('jsdom', 'parse5', '@testing-library/jest-dom', '@testing-library/react', 'vitest', 'csv-parse');
    }

    // Suppress warnings from necessary node modules
    config.ignoreWarnings = [
      {
        module: /node_modules\/require-in-the-middle/,
        message: /Critical dependency/,
      },
    ];

    // Prevent client bundle from trying to polyfill Node core modules
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
        dns: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        // Server-only packages should not be bundled for client
        nodemailer: false,
      };

      // Exclude server-only packages from client bundle via alias
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias['nodemailer'] = false;
    }

    // Fix for NextAuth jose.js vendor chunk issue
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['jose'] = require.resolve('jose');
    // Prevent optional native dependency resolution for pg
    // `pg-native` is optional and not needed; alias to false avoids bundling errors
    config.resolve.alias['pg-native'] = false;

    // Optimize for faster local builds
    if (isLocalBuild) {
      // Enable faster builds by reducing optimization overhead
      config.optimization = config.optimization || {};

      // Disable ALL expensive optimizations for fastest builds
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.mergeDuplicateChunks = false;
      config.optimization.usedExports = false; // Disable tree shaking analysis
      config.optimization.providedExports = false; // Disable export analysis
      config.optimization.sideEffects = false; // Disable side effects analysis

      // Disable minification completely for fastest builds
      config.optimization.minimize = false;
      config.optimization.minimizer = [];

      // Keep Next.js' splitChunks configuration intact. App Router embeds its
      // chunk metadata in the RSC payload, and replacing this configuration can
      // make CSS assets appear as executable script dependencies.

      // Enable aggressive caching for faster rebuilds
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        compression: 'gzip',
        maxMemoryGenerations: 1, // Reduce memory usage
      };

      // Reduce module resolution overhead
      config.resolve.symlinks = false;
      config.resolve.cache = true;
      config.resolve.cacheWithContext = false; // Faster resolution

      // Speed up module resolution
      config.module = config.module || {};
      config.module.unsafeCache = true;

      // Disable source maps for faster builds
      config.devtool = false;
    }

    // Enable production-like optimizations in dev mode for better performance
    if (!isServer && enableProductionOptimizations && !disableOptimization) {
      config.optimization = config.optimization || {};

      // Enable minification for production-like performance
      config.optimization.minimize = true;

      // Enable module concatenation for better performance
      config.optimization.concatenateModules = true;

      // Enable side effects optimization
      config.optimization.sideEffects = 'flag';
    }

    // Comprehensive fix for 'tg' initialization error (TDZ)
    // Apply only when DISABLE_OPTIMIZATION=true
    if (!isServer && disableOptimization) {
      // 1. Disable minification completely to avoid TDZ issues
      config.optimization = config.optimization || {};
      config.optimization.minimize = false;

      // 2. Disable all minification plugins
      config.optimization.minimizer = [];

      // 3. Add module concatenation prevention
      config.optimization.concatenateModules = false;

      // 4. Disable side effects optimization
      config.optimization.sideEffects = false;
    }

    return config;
  },
};

module.exports = nextConfig;
