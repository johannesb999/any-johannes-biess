export default defineEventHandler((event) => {
    const config = useRuntimeConfig();

    // Nur sichere Informationen zurückgeben
    return {
        status: "ok",
        environment: process.env.NODE_ENV || 'undefined',
        hasSupabaseUrl: !!config.supabaseUrl,
        hasSupabaseKey: !!config.supabaseKey,
        timestamp: new Date().toISOString()
    };
});
