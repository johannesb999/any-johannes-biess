import { supabase } from '../../supabase.js';

export default defineEventHandler(async (event) => {
    const passphrase = event.context.params.passphrase;

    try {
        // Hole die Umfragen für diese Gruppe
        const { data: polls, error: pollsError } = await supabase
            .from('polls')
            .select('*')
            .eq('grouppassphrase', passphrase)
            .order('createdat', { ascending: false });

        if (pollsError) {
            console.error("Error fetching polls:", pollsError);
            return { statusCode: 500, error: pollsError.message };
        }

        // Hole die Stimmen für jede Umfrage
        const pollsWithVotes = await Promise.all(polls.map(async (poll) => {
            const { data: votes, error: votesError } = await supabase
                .from('poll_votes')
                .select('*')
                .eq('poll_id', poll.id);

            if (votesError) {
                console.error(`Error fetching votes for poll ${poll.id}:`, votesError);
                return { ...poll, votes: [] };
            }

            return {
                id: poll.id,
                groupPassphrase: poll.grouppassphrase,
                createdBy: poll.createdby,
                endDate: poll.enddate,
                destinations: poll.destinations,
                createdAt: poll.createdat,
                votes: votes || []
            };
        }));

        return { polls: pollsWithVotes || [] };
    } catch (err) {
        console.error("Error in polls/[passphrase].get.js:", err);
        return { statusCode: 500, error: err.message };
    }
});
