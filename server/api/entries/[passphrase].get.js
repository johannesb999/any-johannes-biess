import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
  const passphrase = event.context.params.passphrase;
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('grouppassphrase', passphrase);

    if (error) {
      console.error("Error fetching entries:", error);
      return { statusCode: 500, error: error.message };
    }
    return { entries: data };
  } catch (err) {
    console.error("Error in [passphrase].get.js:", err);
    return { statusCode: 500, error: err.message };
  }
});
