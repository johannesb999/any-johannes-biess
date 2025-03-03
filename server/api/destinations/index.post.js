import { supabase } from '../../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { groupPassphrase, author, destination } = body;

    if (!groupPassphrase || !author || !destination || !destination.name) {
        return { statusCode: 400, error: 'Gruppenkennwort, Autor und Zielinformationen sind erforderlich' };
    }

    try {
        // Überprüfe, ob die Gruppe existiert
        const { data: group, error: groupError } = await supabase
            .from('groups')
            .select('*')
            .eq('passphrase', groupPassphrase)
            .single();

        if (groupError || !group) {
            return { statusCode: 404, error: 'Gruppe nicht gefunden.' };
        }

        const { data, error } = await supabase
            .from('destinations')
            .insert([{
                grouppassphrase: groupPassphrase,
                author: author,
                name: destination.name,
                type: destination.type,
                duration: destination.duration,
                budget: destination.budget,
                notes: destination.notes,
                createdat: new Date().toISOString()
            }]);

        if (error) {
            console.error("Error inserting destination:", error);
            return { statusCode: 500, error: error.message };
        }
        return { message: 'Ziel vorgeschlagen', destination: data };
    } catch (err) {
        console.error("Error in destinations.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
