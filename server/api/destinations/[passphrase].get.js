import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    const passphrase = event.context.params.passphrase;

    try {
        const { data, error } = await supabase
            .from('destinations')
            .select('*')
            .eq('grouppassphrase', passphrase)
            .order('createdat', { ascending: false });

        if (error) {
            console.error("Error fetching destinations:", error);
            return { statusCode: 500, error: error.message };
        }

        return { destinations: data || [] };
    } catch (err) {
        console.error("Error in destinations/[passphrase].get.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
