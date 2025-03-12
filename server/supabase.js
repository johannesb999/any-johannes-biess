// server/supabase.js
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#imports';

// Konfiguration aus Umgebungsvariablen holen
const runtimeConfig = useRuntimeConfig();

// Supabase-Konfiguration mit Fallback für die Produktionsumgebung
let supabaseUrl = runtimeConfig.supabaseUrl;
let supabaseKey = runtimeConfig.supabaseKey;

// Fallback-Werte für die Produktionsumgebung, wenn Umgebungsvariablen nicht verfügbar sind
if (!supabaseUrl || !supabaseKey) {
    console.log("WARNUNG: Verwende Fallback-Werte für Supabase-Konfiguration");
    supabaseUrl = "https://mgeszojmmopdhtiscirg.supabase.co";
    supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nZXN6b2ptbW9wZGh0aXNjaXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5OTk3NzksImV4cCI6MjA1NjU3NTc3OX0.KKj1L__25M2s2t1aw56c97TGjzvTOSYBZFf1HNrCpYg";
}

console.log("Supabase URL verfügbar:", !!supabaseUrl);
console.log("Supabase Key verfügbar:", !!supabaseKey);

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
