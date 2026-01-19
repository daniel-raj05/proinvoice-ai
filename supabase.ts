
import { createClient } from '@supabase/supabase-js';

// Fallback for browser environments where process might not be defined
const env = (window as any).process?.env || {};

const supabaseUrl = env.SUPABASE_URL || 'https://sxjvzrpxzauzrekscdbq.supabase.co';
const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'sb_publishable_9PRl7Cv5T8Il0oHt0Dk9Qg_EVBshviP';

const isConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('your-project');

if (!isConfigured) {
  console.warn('JKI Billing Warning: Supabase credentials are missing or invalid.');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export const isSupabaseConfigured = isConfigured;
