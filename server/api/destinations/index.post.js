import { supabase } from '../../supabase.js';
import { readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { grouppassphrase, author, name, type, duration, budget, notes } = body;

    if (!grouppassphrase || !author || !name || !type || duration === undefined || !budget) {
        return { statusCode: 400, message: "Ungültige Anfrage - fehlende Pflichtfelder" };
    }

    // Stelle sicher, dass duration eine Zahl ist
    const durationNumber = parseInt(duration, 10);

    try {
        const { data, error } = await supabase
            .from('destinations')
            .insert([{
                grouppassphrase,
                author,
                name,
                type,
                duration: isNaN(durationNumber) ? 7 : durationNumber, // Fallback auf 7 Tage
                budget,
                notes: notes || '',
                createdat: new Date().toISOString()
            }])
            .select();

        if (error) {
            console.error("Error creating destination:", error);
            return { statusCode: 500, error: error.message };
        }

        return { message: "Destination erfolgreich erstellt", destination: data[0] };
    } catch (err) {
        console.error("Error in destinations/index.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
