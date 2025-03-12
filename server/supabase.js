// server/supabase.js
import { createClient } from '@supabase/supabase-js';

// Debug-Logging zur Initialisierung mit Zeitstempel
console.log(`🔄 [${new Date().toISOString()}] Supabase-Client wird initialisiert...`);

// Hole Umgebungsvariablen
const runtimeConfig = useRuntimeConfig();
const supabaseUrl = runtimeConfig.supabaseUrl;
const supabaseKey = runtimeConfig.supabaseKey;

// Validiere Umgebungsvariablen mit detailliertem Logging
if (!supabaseUrl || supabaseUrl === 'undefined') {
    console.error('🚨 KRITISCHER FEHLER: SUPABASE_URL ist nicht definiert!');
    console.error('Überprüfe folgende Umgebungsvariablen:',
        {
            NODE_ENV: process.env.NODE_ENV,
            // Zeige keine sensiblen Daten, nur Prüfungen
            SUPABASE_URL_defined: !!supabaseUrl,
            SUPABASE_URL_type: typeof supabaseUrl,
            SUPABASE_URL_empty: supabaseUrl === '',
            SUPABASE_KEY_defined: !!supabaseKey,
            SUPABASE_KEY_type: typeof supabaseKey,
            SUPABASE_KEY_empty: supabaseKey === '',
            process_env_keys: Object.keys(process.env).filter(key => key.includes('SUPA'))
        }
    );
}

if (!supabaseKey || supabaseKey === 'undefined') {
    console.error('🚨 KRITISCHER FEHLER: SUPABASE_KEY ist nicht definiert!');
}

let supabase;

try {
    if (supabaseUrl && supabaseKey) {
        // Zeige Informationen zur Verbindung
        console.log(`🔄 Verbinde zu Supabase... (URL: ${supabaseUrl.substring(0, 8)}...)`);
        console.log(`📊 Verbindungsdetails: URL-Länge=${supabaseUrl.length}, KEY-Länge=${supabaseKey.length}`);
        console.log(`💻 Server-Umgebung: ${process.env.NODE_ENV || 'undefined'}, Runtime: ${process.version}`);

        // Erweiterte Client-Optionen für bessere Fehlerbehandlung
        const clientOptions = {
            auth: {
                persistSession: false,
                autoRefreshToken: true,
                detectSessionInUrl: false
            },
            global: {
                headers: {
                    'x-application-name': 'dateplan',
                    'x-application-version': '1.0'
                },
                fetch: (url, options) => {
                    console.log(`🔄 Supabase-Request: ${options.method} ${url.toString().split('?')[0]}`);
                    return fetch(url, {
                        ...options,
                        signal: AbortSignal.timeout(15000)
                    }).then(response => {
                        if (!response.ok) {
                            console.warn(`⚠️ Supabase-Response: Status ${response.status}`);
                        }
                        return response;
                    }).catch(error => {
                        console.error(`🚨 Supabase-Fetch-Error: ${error.message}`);
                        throw error;
                    });
                }
            }
        };

        // Client erstellen mit Retry-Logik
        supabase = createClient(supabaseUrl, supabaseKey, clientOptions);

        console.log("✅ Supabase-Client initialisiert! Teste Verbindung...");

        // Verbindungstest mit Fehlerbehandlung
        (async () => {
            try {
                console.log("🔄 Führe Supabase-Verbindungstest durch...");
                const startTime = Date.now();
                const { data, error } = await supabase.from('groups').select('count').limit(1);
                const duration = Date.now() - startTime;

                if (error) {
                    console.error(`🚨 Verbindungstest fehlgeschlagen (${duration}ms):`, error.message);
                    console.error("Details:", JSON.stringify({
                        code: error.code,
                        message: error.message,
                        details: error.details || 'keine',
                        hint: error.hint || 'keine'
                    }, null, 2));
                } else {
                    console.log(`✅ Supabase-Verbindung erfolgreich getestet! (${duration}ms)`);
                }
            } catch (e) {
                console.error("🚨 Fehler beim Testen der Supabase-Verbindung:", e);
                console.error("Stack:", e.stack);
            }
        })();

    } else {
        console.error("🚨 Supabase-Client konnte nicht initialisiert werden: Fehlende Konfiguration");
        // Erstelle einen Dummy-Client für Fehlerfall mit besseren Fehlermeldungen
        supabase = {
            from: (table) => {
                console.error(`🚨 Versuchter Zugriff auf Tabelle '${table}' ohne Supabase-Konfiguration!`);
                return {
                    select: () => Promise.reject(new Error(`Supabase nicht konfiguriert - Tabelle: ${table}, Operation: select`)),
                    insert: () => Promise.reject(new Error(`Supabase nicht konfiguriert - Tabelle: ${table}, Operation: insert`)),
                    update: () => Promise.reject(new Error(`Supabase nicht konfiguriert - Tabelle: ${table}, Operation: update`)),
                    delete: () => Promise.reject(new Error(`Supabase nicht konfiguriert - Tabelle: ${table}, Operation: delete`)),
                }
            }
        };
    }
} catch (error) {
    console.error("🚨 KRITISCHER FEHLER bei Supabase-Client-Initialisierung:", error);
    console.error("Stack:", error.stack);
    // Verbesserte Fehlerdetails
    console.error("Fehlerdetails:", {
        name: error.name,
        message: error.message,
        cause: error.cause ? error.cause.toString() : 'keine'
    });

    // Fallback auf Dummy-Client mit präziseren Fehlern
    supabase = {
        from: (table) => ({
            select: () => Promise.reject(new Error(`Supabase-Initialisierung fehlgeschlagen - Tabelle: ${table}, Fehler: ${error.message}`)),
            insert: () => Promise.reject(new Error(`Supabase-Initialisierung fehlgeschlagen - Tabelle: ${table}, Fehler: ${error.message}`)),
            update: () => Promise.reject(new Error(`Supabase-Initialisierung fehlgeschlagen - Tabelle: ${table}, Fehler: ${error.message}`)),
            delete: () => Promise.reject(new Error(`Supabase-Initialisierung fehlgeschlagen - Tabelle: ${table}, Fehler: ${error.message}`)),
        })
    };
}

export { supabase };
