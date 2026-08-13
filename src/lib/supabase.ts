import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://bvmkiuxetrtltwvhpuxl.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_0t640hDMl_xjSC8ZZRUJQg_LZTmLVHG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
