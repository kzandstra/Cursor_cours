import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars manquantes: définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans un fichier .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

