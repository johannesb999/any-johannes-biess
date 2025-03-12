import { supabase } from '../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  console.log("POST /api/groups - Anfrage erhalten");
  const body = await readBody(event);
  const { groupName, passphrase, adminName } = body;

  console.log("Request Daten:", {
    hasGroupName: !!groupName,
    hasPassphrase: !!passphrase,
    hasAdminName: !!adminName
  });

  if (!passphrase || !adminName) {
    console.log("Fehler: Fehlende Pflichtfelder");
    return { statusCode: 400, error: 'Passphrase und adminName sind erforderlich' };
  }

  try {
    console.log("Versuche Gruppe zu erstellen...");

    // Versuche die Einfügung mit umfangreichem Error-Handling
    const insertOperation = supabase
      .from('groups')
      .insert([{
        groupname: groupName || "",
        passphrase,
        adminname: adminName,
        createdat: new Date().toISOString()
      }])
      .single();

    console.log("Supabase-Anfrage gestartet");

    const { data, error } = await insertOperation;

    if (error) {
      console.error("Supabase-Fehler beim Einfügen:", error.message);
      console.error("Fehlercode:", error.code);
      console.error("Details:", JSON.stringify(error.details || {}));
      return { statusCode: 500, error: error.message, details: error.details };
    }

    console.log("Gruppe erfolgreich erstellt:", data?.id || "keine ID zurückgegeben");
    return { message: 'Gruppe erstellt', group: data };
  } catch (err) {
    console.error("Unbehandelte Exception in groups.post.js:", err);
    console.error("Stack trace:", err.stack);
    return {
      statusCode: 500,
      error: err.message,
      trace: process.env.NODE_ENV === 'production' ? 'Fehlerdetails im Server-Log' : err.stack
    };
  }
});
