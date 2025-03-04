import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    try {
        // Body der Anfrage lesen
        const body = await readBody(event);
        console.log("Löschanfrage empfangen:", body);

        const { poll_id, author } = body;

        if (!poll_id || !author) {
            console.log("Fehlerhafte Anfrage: ID oder Autor fehlt");
            return {
                success: false,
                message: "Poll ID und Author sind erforderlich"
            };
        }

        // Zuerst die Umfrage abrufen zum Prüfen der Autorenschaft
        const { data: poll, error: fetchError } = await supabase
            .from('polls')
            .select('createdby')
            .eq('id', poll_id)
            .single();

        if (fetchError) {
            console.error("Fehler beim Abrufen der Umfrage:", fetchError);
            return {
                success: false,
                message: "Umfrage konnte nicht gefunden werden: " + fetchError.message
            };
        }

        console.log("Gefundene Umfrage:", poll);
        console.log("Vergleiche: API-Autor =", author, "DB-Autor =", poll.createdby);

        // Prüfen, ob der Nutzer berechtigt ist
        if (poll.createdby !== author) {
            console.log("Autorisierungsfehler: Nutzer ist nicht der Ersteller");
            return {
                success: false,
                message: "Du bist nicht berechtigt, diese Umfrage zu löschen"
            };
        }

        // Zuerst alle zugehörigen Votes löschen
        const { error: votesDeleteError } = await supabase
            .from('poll_votes')
            .delete()
            .eq('poll_id', poll_id);

        if (votesDeleteError) {
            console.error("Fehler beim Löschen der Votes:", votesDeleteError);
            return {
                success: false,
                message: "Fehler beim Löschen der Abstimmungen: " + votesDeleteError.message
            };
        }

        // Dann den Poll selbst löschen
        const { error: pollDeleteError } = await supabase
            .from('polls')
            .delete()
            .eq('id', poll_id);

        if (pollDeleteError) {
            console.error("Fehler beim Löschen des Polls:", pollDeleteError);
            return {
                success: false,
                message: "Fehler beim Löschen der Umfrage: " + pollDeleteError.message
            };
        }

        console.log("Umfrage erfolgreich gelöscht");
        return {
            success: true,
            message: "Umfrage und alle zugehörigen Abstimmungen wurden erfolgreich gelöscht"
        };
    } catch (error) {
        console.error("Unerwarteter Fehler:", error);
        return {
            success: false,
            message: "Serverfehler: " + error.message
        };
    }
});
