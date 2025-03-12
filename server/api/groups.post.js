import { supabase } from '../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { groupName, passphrase, adminName } = body;
  if (!passphrase || !adminName) {
    return { statusCode: 400, error: 'Passphrase und adminName sind erforderlich' };
  }
  try {
    const { data, error } = await supabase
      .from('groups')
      .insert([{
        groupname: groupName || "",
        passphrase,
        adminname: adminName,
        createdat: new Date().toISOString()
      }])
      .single();

    if (error) {
      console.error("Error inserting group:", error);
      return { statusCode: 500, error: error.message };
    }
    return { message: 'Gruppe erstellt', group: data };
  } catch (err) {
    console.error("Error in groups.post.js:", err);
    return { statusCode: 500, error: err.message };
  }
});
