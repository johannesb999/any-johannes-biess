import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { grouppassphrase, createdby, enddate, destinations } = body;

    if (!grouppassphrase || !createdby || !enddate || !destinations || !destinations.length) {
        return { statusCode: 400, message: "Ungültige Anfrage - fehlende Pflichtfelder" };
    }

    try {
        const { data, error } = await supabase
            .from('polls')
            .insert([
                {
                    grouppassphrase,
                    createdby,
                    enddate,
                    destinations,
                    createdat: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error("Fehler beim Erstellen der Umfrage:", error);
            return { statusCode: 500, error: error.message };
        }

        return { message: "Umfrage erfolgreich erstellt", poll: data[0] };
    } catch (err) {
        console.error("Error in polls/index.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
