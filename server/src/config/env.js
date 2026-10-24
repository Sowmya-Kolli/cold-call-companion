// src/config/env.js — Centralised environment config
// All env vars are validated at startup so the server
// fails fast rather than silently using undefined values.

import 'dotenv/config';

function requireEnv(name) {
  const val = process.env[name];
  if (!val || val.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Check your .env file.`);
  }
  return val.trim();
}

function optionalEnv(name, defaultVal = '') {
  return (process.env[name] || defaultVal).trim();
}

export const config = {
  port: parseInt(optionalEnv('PORT', '3001'), 10),
  supabaseUrl: requireEnv('SUPABASE_URL'),
  supabaseSecretKey: requireEnv('SUPABASE_SECRET_KEY'),
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  // Model name is configurable — swap to a newer model without code changes
  geminiModel: optionalEnv('GEMINI_MODEL', 'gemini-3.5-flash'),
  frontendOrigin: optionalEnv('FRONTEND_ORIGIN', 'http://localhost:5173'),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
};
