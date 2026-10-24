// src/config/supabase.js — Supabase client (server-side only)
// Uses the secret service_role key — bypasses RLS.
// This file MUST NOT be imported by any frontend code.

import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseSecretKey,
  {
    auth: {
      // Server side: we don't use Supabase Auth, so disable persistence
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
