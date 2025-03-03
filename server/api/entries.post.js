import { supabase } from '../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { groupPassphrase, userName, unavailableDates } = body;
  if (!groupPassphrase || !userName || !unavailableDates) {
    return { statusCode: 400, error: 'groupPassphrase, userName und unavailableDates sind erforderlich' };
  }
  try {
    // Überprüfe, ob die Gruppe existiert
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('passphrase', groupPassphrase)
      .single();

    if (groupError || !group) {
      return { statusCode: 404, error: 'Gruppe nicht gefunden. Bitte erst eine Gruppe erstellen.' };
    }

    const { data, error } = await supabase
      .from('entries')
      .insert([{
        grouppassphrase: groupPassphrase,
        username: userName,
        unavailabledates: unavailableDates, // Erwartet ein Array von "YYYY-MM-DD"-Strings
        createdat: new Date().toISOString()
      }])
      .single();

    if (error) {
      console.error("Error inserting entry:", error);
      return { statusCode: 500, error: error.message };
    }
    return { message: 'Eintrag erstellt', entry: data };
  } catch (err) {
    console.error("Error in entries.post.js:", err);
    return { statusCode: 500, error: err.message };
  }
});
