// Beispiel für eine API-Route

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
    try {
        const groupId = event.context.params.groupId;

        // Supabase-Client mit Service-Role-Key initialisieren
        const config = useRuntimeConfig();
        const supabase = createClient(config.supabaseUrl, config.supabaseKey);

        // Mit AUTH-HEADER für RLS
        const { data, error } = await supabase
            .from('polls')
            .select('*')
            .eq('grouppassphrase', groupId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { polls: data || [] };
    } catch (error) {
        console.error('API-Fehler:', error);
        return { error: error.message };
    }
});
