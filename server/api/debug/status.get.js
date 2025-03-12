export default defineEventHandler((event) => {
    const config = useRuntimeConfig();

    // Erweiterte Informationen zurückgeben
    return {
        status: "ok",
        environment: process.env.NODE_ENV || 'undefined',
        hasSupabaseUrl: !!config.supabaseUrl,
        hasSupabaseKey: !!config.supabaseKey,
        envVars: {
            NODE_ENV: process.env.NODE_ENV || 'undefined',
            hasSupabaseUrlEnv: !!process.env.SUPABASE_URL,
            hasSupabaseKeyEnv: !!process.env.SUPABASE_KEY
        },
        timestamp: new Date().toISOString(),
        runningIn: "Docker-Container",
        fallbackActive: !config.supabaseUrl || !config.supabaseKey
    };
});
