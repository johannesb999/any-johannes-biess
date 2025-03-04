import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { id, author } = body;

    if (!id || !author) {
        return { statusCode: 400, message: "Ungültige Anfrage - ID und Autor sind erforderlich" };
    }

    try {
        // Zuerst den Eintrag abrufen, um zu überprüfen, ob der angeforderte Autor tatsächlich der Autor ist
        const { data: destination, error: fetchError } = await supabase
            .from('destinations')
            .select('author')
            .eq('id', id)
            .single();

        if (fetchError) {
            console.error("Error fetching destination:", fetchError);
            return { statusCode: 500, error: fetchError.message };
        }

        // Nur der Ersteller kann seinen Vorschlag löschen
        if (destination.author !== author) {
            return { statusCode: 403, message: "Nicht autorisiert - nur der Autor kann seinen Vorschlag löschen" };
        }

        // Wenn Autor übereinstimmt, Eintrag löschen
        const { error } = await supabase
            .from('destinations')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting destination:", error);
            return { statusCode: 500, error: error.message };
        }

        return { message: "Destination erfolgreich gelöscht", success: true };
    } catch (err) {
        console.error("Error in destinations/delete.post.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
