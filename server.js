const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxy server is running',
    target: BACKEND_URL,
  });
});

// Proxy all /api requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
    
    // Forward Authorization header
    if (req.headers.authorization) {
      console.log('[Proxy] Authorization header present');
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Response status: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('[Proxy] Error:', err.message);
    res.status(500).json({
      error: 'Proxy error',
      message: err.message,
    });
  },
}));

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: ${BACKEND_URL}`);
  console.log(`✅ CORS enabled for: http://localhost:3000`);
});
