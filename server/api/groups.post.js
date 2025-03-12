import { supabase } from '../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  console.log(`🔄 [${requestId}] POST /api/groups - Neue Anfrage erhalten`);

  try {
    // Request-Body mit Fehlerbehandlung einlesen
    let body;
    try {
      body = await readBody(event);
      console.log(`📦 [${requestId}] Request-Body empfangen:`, JSON.stringify(body, null, 2));
    } catch (bodyError) {
      console.error(`🚨 [${requestId}] Fehler beim Einlesen des Request-Body:`, bodyError);
      return { statusCode: 400, error: 'Ungültiger Request-Body' };
    }

    const { groupName, passphrase, adminName } = body;

    // Umfassende Validierung der Eingabedaten
    console.log(`🔍 [${requestId}] Validiere Anfragedaten:`);
    console.log(`  • groupName: ${groupName || '[leer]'} (${typeof groupName})`);
    console.log(`  • adminName: ${adminName || '[leer]'} (${typeof adminName})`);
    console.log(`  • passphrase: ${passphrase ? '✓ vorhanden' : '✗ fehlt'} (${typeof passphrase})`);

    if (!passphrase || !adminName) {
      console.warn(`⚠️ [${requestId}] Fehlerhafte Anfrage: Fehlende Pflichtfelder`);
      return { statusCode: 400, error: 'Passphrase und adminName sind erforderlich' };
    }

    // Supabase-Client-Check
    if (!supabase) {
      console.error(`🚨 [${requestId}] KRITISCHER FEHLER: Supabase-Client ist nicht initialisiert`);
      return {
        statusCode: 500,
        error: 'Datenbankverbindung ist nicht initialisiert',
        details: 'Bitte kontaktieren Sie den Administrator - Der Datenbankservice ist nicht verfügbar'
      };
    }

    console.log(`🔄 [${requestId}] Beginne Datenbankoperation - Neue Gruppe erstellen`);
    console.time(`db-op-${requestId}`);

    // Mit mehr Fehlerbehandlung und Logging
    let dbResponse;
    try {
      dbResponse = await supabase
        .from('groups')
        .insert([{
          groupname: groupName || "",
          passphrase,
          adminname: adminName,
          createdat: new Date().toISOString()
        }])
        .single();

      console.timeEnd(`db-op-${requestId}`);
      console.log(`📊 [${requestId}] Supabase-Antwort erhalten, Status: ${dbResponse.error ? 'Fehler' : 'Erfolg'}`);
    } catch (dbError) {
      console.timeEnd(`db-op-${requestId}`);
      console.error(`🚨 [${requestId}] Unbehandelte Exception bei Datenbankoperation:`, dbError);
      throw dbError; // Weiterleiten zum äußeren try-catch
    }

    const { data, error } = dbResponse;

    if (error) {
      console.error(`🚨 [${requestId}] Datenbank-Fehler beim Einfügen:`, error);
      console.error(`🔍 [${requestId}] Fehlerdetails:`, JSON.stringify({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      }, null, 2));

      // Differenzierte Fehlerbehandlung nach Fehlertyp
      if (error.code === '23505') {
        return {
          statusCode: 409,
          error: 'Diese Passphrase wird bereits verwendet',
          code: error.code
        };
      } else if (error.code && error.code.startsWith('22')) {
        return {
          statusCode: 400,
          error: 'Ungültige Eingabedaten: ' + error.message,
          code: error.code
        };
      } else {
        return {
          statusCode: 500,
          error: error.message,
          code: error.code,
          details: error.details || 'Keine weiteren Details verfügbar'
        };
      }
    }

    console.log(`✅ [${requestId}] Gruppe erfolgreich erstellt mit ID: ${data?.id || '[Keine ID zurückgegeben]'}`);
    return { message: 'Gruppe erstellt', group: data };
  } catch (err) {
    console.error(`🚨 [${requestId}] Unbehandelte Exception in groups.post.js:`, err);
    console.error(`📜 [${requestId}] Stack trace:`, err.stack);

    return {
      statusCode: 500,
      error: `Serverfehler: ${err.message}`,
      errorId: requestId,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : 'Fehlerdetails im Server-Log'
    };
  }
});
