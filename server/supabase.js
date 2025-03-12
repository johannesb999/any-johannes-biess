// server/supabase.js
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#imports';

// Konfiguration aus Umgebungsvariablen holen
const runtimeConfig = useRuntimeConfig();
const supabaseUrl = runtimeConfig.supabaseUrl;
const supabaseKey = runtimeConfig.supabaseKey;

// Prüfe, ob die Umgebungsvariablen gesetzt sind
if (!supabaseUrl) {
    console.error("KRITISCHER FEHLER: SUPABASE_URL ist nicht definiert!");
}

if (!supabaseKey) {
    console.error("KRITISCHER FEHLER: SUPABASE_KEY ist nicht definiert!");
}

let client;
try {
    client = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false
        }
    });
    console.log("Supabase-Client initialisiert");
} catch (error) {
    console.error("Fehler bei der Initialisierung des Supabase-Clients:", error);
    // Erstelle einen Dummy-Client für Fehlerfall
    client = {
        from: () => ({
            select: () => Promise.reject(new Error('Supabase nicht konfiguriert')),
            insert: () => Promise.reject(new Error('Supabase nicht konfiguriert')),
        })
    };
}

export const supabase = client;
