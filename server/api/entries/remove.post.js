import { supabase } from '../../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { groupPassphrase, userName, unavailableDates } = body;
    if (!groupPassphrase || !userName || !unavailableDates) {
        return { statusCode: 400, error: 'groupPassphrase, userName und unavailableDates sind erforderlich' };
    }
    try {
        // Finde alle Einträge, die grouppassphrase und username matchen
        const { data: rows, error } = await supabase
            .from('entries')
            .select('*')
            .eq('grouppassphrase', groupPassphrase)
            .eq('username', userName);

        if (error) {
            console.error("Error finding entries for removal:", error);
            return { statusCode: 500, error: error.message };
        }
        if (!rows || rows.length === 0) {
            return { message: 'Keine Einträge zum Entfernen gefunden.' };
        }

        // Convert array to Set, um Doppler in unavailableDates zu ignorieren
        const toRemove = new Set(unavailableDates);

        // Entferne die Tage aus dem existing Array oder lösche ganze Rows
        for (const row of rows) {
            const existingArray = row.unavailabledates || [];
            const existingSet = new Set(existingArray);
            // Subtraktion
            const newSet = new Set([...existingSet].filter(x => !toRemove.has(x)));

            if (newSet.size === 0) {
                // Keine Tage mehr -> lösche den gesamten Eintrag
                await supabase
                    .from('entries')
                    .delete()
                    .eq('id', row.id);
            } else {
                // Update das Array, ohne die entfernten Tage
                await supabase
                    .from('entries')
                    .update({ unavailabledates: [...newSet] })
                    .eq('id', row.id);
            }
        }

        return { message: 'Einträge entfernt' };
    } catch (err) {
        console.error("Error in remove.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
