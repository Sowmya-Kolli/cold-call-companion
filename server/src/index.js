// src/index.js — Express application entry point

import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRouter from './routes/health.js';
import callsRouter from './routes/calls.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ── CORS ──────────────────────────────────────────────────────
// Parse configured frontend origins and support legitimate Vercel preview deployments safely
const explicitOrigins = config.frontendOrigin
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

function isOriginAllowed(origin) {
  if (!origin) return true; // Allow non-browser requests (server-to-server, curl, health checks)
  const normalized = origin.trim().replace(/\/+$/, '');

  // 1. Exact match with any configured origin
  if (explicitOrigins.includes(normalized)) return true;

  // 2. Allow local development origins in non-production environments
  if (config.nodeEnv !== 'production') {
    if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
      return true;
    }
  }

  // 3. Legitimate Vercel preview deployments matching the configured Vercel app slug
  const vercelConfigs = explicitOrigins.filter((o) => o.includes('.vercel.app'));
  for (const vUrl of vercelConfigs) {
    try {
      const hostname = new URL(vUrl.startsWith('http') ? vUrl : `https://${vUrl}`).hostname;
      const appPrefix = hostname.replace(/\.vercel\.app$/, '');
      if (appPrefix) {
        const previewRegex = new RegExp(`^https:\\/\\/${appPrefix}(-[a-z0-9_-]+)?\\.vercel\\.app$`, 'i');
        if (previewRegex.test(normalized)) return true;
      }
    } catch {
      // ignore parsing error
    }
  }

  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Routes ────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service: 'Cold Call Companion Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      calls: '/api/calls',
    },
    frontendUrl: config.frontendOrigin,
    message: 'Backend API is active. Open the frontend URL in your browser to use the application.',
  });
});
app.use('/health',    healthRouter);
app.use('/api/calls', callsRouter);

// ── 404 catch-all ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}` } });
});

// ── Central error handler (must be last) ─────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[CCC Server] Running on http://localhost:${config.port}`);
  console.log(`[CCC Server] Accepting requests from: ${config.frontendOrigin}`);
  console.log(`[CCC Server] Gemini model: ${config.geminiModel}`);
  // NEVER log config.supabaseSecretKey or config.geminiApiKey here
});

export default app; // for testing
