import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { poll_id, username, selected_destinations } = body;

    if (!poll_id || !username) {
        return { statusCode: 400, message: "Ungültige Anfrage - fehlende Pflichtfelder" };
    }

    try {
        // Prüfe, ob der Nutzer bereits für diese Umfrage abgestimmt hat
        const { data: existingVotes, error: fetchError } = await supabase
            .from('poll_votes')
            .select('*')
            .eq('poll_id', poll_id)
            .eq('username', username);

        if (fetchError) {
            console.error("Fehler beim Prüfen vorhandener Abstimmungen:", fetchError);
            return { statusCode: 500, error: fetchError.message };
        }

        let result;

        // Update oder Insert basierend auf vorhandenen Votes
        if (existingVotes && existingVotes.length > 0) {
            // Update vorhandene Abstimmung
            result = await supabase
                .from('poll_votes')
                .update({
                    selected_destinations,
                    voted_at: new Date().toISOString()
                })
                .eq('id', existingVotes[0].id);
        } else {
            // Neue Abstimmung erstellen
            result = await supabase
                .from('poll_votes')
                .insert([
                    {
                        poll_id,
                        username,
                        selected_destinations,
                        voted_at: new Date().toISOString()
                    }
                ]);
        }

        if (result.error) {
            console.error("Fehler beim Speichern der Abstimmung:", result.error);
            return { statusCode: 500, error: result.error.message };
        }

        return { message: "Abstimmung erfolgreich gespeichert" };
    } catch (err) {
        console.error("Error in polls/vote.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
