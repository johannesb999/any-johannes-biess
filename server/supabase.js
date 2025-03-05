// server/supabase.js
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#imports';

export default defineEventHandler(() => {
    const runtimeConfig = useRuntimeConfig();

    // Debug-Logging
    console.log('SUPABASE CONNECTION ATTEMPT');
    console.log('Supabase URL available:', !!runtimeConfig.supabaseUrl);
    console.log('Supabase Key available (first 5 chars):',
        runtimeConfig.supabaseKey ? runtimeConfig.supabaseKey.substring(0, 5) + '...' : 'NOT AVAILABLE');

    // Client mit erweiterten Debug-Optionen erstellen
    const supabase = createClient(
        runtimeConfig.supabaseUrl,
        runtimeConfig.supabaseKey,
        {
            auth: { persistSession: false },
            db: { schema: 'public' }
        }
    );

    return supabase;
});

// Alternativ, falls Sie keinen defineEventHandler verwenden möchten:
const runtimeConfig = useRuntimeConfig();
console.log('SUPABASE CONNECTION SETUP');
console.log('Supabase URL available:', !!runtimeConfig.supabaseUrl);

export const supabase = createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabaseKey
);
