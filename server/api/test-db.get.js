import { supabase } from '../supabase.js';

export default defineEventHandler(async () => {
    try {
        console.log('DB TEST: Attempting database connection...');

        // Einfacher Select ohne Bedingungen
        const { data, error } = await supabase
            .from('groups')
            .select('groupname')
            .limit(1);

        if (error) {
            console.error('DB TEST ERROR:', error);
            return {
                status: 'error',
                message: error.message,
                hint: 'Check environment variables and network access'
            };
        }

        console.log('DB TEST SUCCESS:', data);
        return {
            status: 'success',
            data,
            message: 'Database connection successful'
        };
    } catch (err) {
        console.error('DB TEST EXCEPTION:', err);
        return {
            status: 'exception',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        };
    }
});
