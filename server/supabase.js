// server/supabase.js
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#imports';

const config = useRuntimeConfig();
const SUPABASE_URL = config.supabaseUrl;
const SUPABASE_KEY = config.supabaseKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
