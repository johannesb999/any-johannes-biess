import { supabase } from '../supabase.js';

export default defineEventHandler(async () => {
    try {
        console.log('Debug: Supabase-Verbindung testen');

        // Konfiguration prüfen
        const runtimeConfig = useRuntimeConfig();
        const hasUrl = !!runtimeConfig.supabaseUrl;
        const hasKey = !!runtimeConfig.supabaseKey;

        // Einfachen Datenbankzugriff versuchen
        const { data, error } = await supabase
            .from('groups')
            .select('count')
            .limit(1);

        if (error) {
            return {
                success: false,
                hasUrl,
                hasKey,
                error: error.message,
                code: error.code
            };
        }

        return {
            success: true,
            hasUrl,
            hasKey,
            result: data
        };
    } catch (err) {
        return {
            success: false,
            error: err.message,
            type: err.name
        };
    }
});
