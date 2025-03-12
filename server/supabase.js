// server/supabase.js
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#imports';

// Konfiguration aus Umgebungsvariablen holen
const runtimeConfig = useRuntimeConfig();

// Supabase-Client mit SERVICE ROLE KEY erstellen (umgeht RLS)
export const supabase = createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabaseServiceKey, // SERVICE KEY statt anon key verwenden
    {
        auth: {
            persistSession: false
        }
    }
);
