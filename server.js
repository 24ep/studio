const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 8021;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Server timeout configuration for SSE endpoints
const SERVER_TIMEOUT = 300000; // 5 minutes
const KEEP_ALIVE_TIMEOUT = 65000; // 65 seconds
const HEADERS_TIMEOUT = 66000; // 66 seconds

console.log('Starting Next.js custom server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', port);

console.log('Preparing Next.js app...');
app.prepare().then(() => {
  console.log('Next.js app prepared. Creating server...');
  // deepcode ignore CleartextTransmission: Intentional HTTP server for local development/internal use
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      const { pathname } = parsedUrl;

      // Special handling for SSE endpoints
      if (pathname === '/api/sse' || pathname.startsWith('/api/sse/')) {
        // Set longer timeout for SSE connections
        req.setTimeout(SERVER_TIMEOUT);
        res.setTimeout(SERVER_TIMEOUT);

        // Set SSE-specific headers
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Keep-Alive', `timeout=${KEEP_ALIVE_TIMEOUT}, max=1000`);
      }

      // Set proper MIME types for static assets
      if (pathname.startsWith('/_next/static/css/')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        // Prevent CSS from being executed as script
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' 'unsafe-hashes'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:;");
      } else if (pathname.startsWith('/_next/static/chunks/') && pathname.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (pathname.startsWith('/_next/static/') && pathname.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      } else if (pathname.startsWith('/_next/static/') && pathname.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' 'unsafe-hashes'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' ws: wss:;");
      }

      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // X-Frame-Options removed - using CSP frame-ancestors instead (more flexible)
      // res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Configure server timeouts
  server.timeout = SERVER_TIMEOUT;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT;
  server.headersTimeout = HEADERS_TIMEOUT;

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      // Server ready
    });
});
