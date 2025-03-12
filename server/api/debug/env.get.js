export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    console.log("📊 Debug-Endpunkt aufgerufen - Prüfe Umgebungsvariablen");

    // Versuche sichere Health-Checks für externe Services
    let supabaseHealth = "nicht getestet";

    try {
        const supabaseUrl = config.supabaseUrl;
        if (supabaseUrl) {
            // Nur Ping-Test ohne Authentifizierung (öffentlich)
            const ping = await fetch(supabaseUrl, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            supabaseHealth = ping.ok ? "erreichbar" : `nicht erreichbar (Status: ${ping.status})`;
        } else {
            supabaseHealth = "URL nicht konfiguriert";
        }
    } catch (error) {
        supabaseHealth = `Fehler: ${error.message}`;
    }

    // Erweiterte Informationen zu Prozessumgebung und Server
    return {
        environment: process.env.NODE_ENV || 'undefined',
        timestamp: new Date().toISOString(),
        serverInfo: {
            platform: process.platform,
            architecture: process.arch,
            nodeVersion: process.version,
            memory: {
                total: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            },
            uptime: `${Math.round(process.uptime())} Sekunden`,
            pid: process.pid,
            cwd: process.cwd()
        },
        config: {
            supabaseUrl: config.supabaseUrl ?
                `${config.supabaseUrl.substring(0, 8)}...${config.supabaseUrl.substring(config.supabaseUrl.length - 4)}` :
                'undefined',
            supabaseKeyDefined: !!config.supabaseKey,
            supabaseKeyLength: config.supabaseKey ? config.supabaseKey.length : 0,
            publicRuntimeConfig: Object.keys(config.public || {})
        },
        externalServices: {
            supabase: supabaseHealth
        },
        request: {
            headers: {
                host: event.node.req.headers.host,
                userAgent: event.node.req.headers['user-agent'],
                referer: event.node.req.headers.referer,
                contentType: event.node.req.headers['content-type'],
                accept: event.node.req.headers.accept
            },
            url: event.node.req.url,
            method: event.node.req.method,
            remoteAddress: event.node.req.socket?.remoteAddress || 'unbekannt'
        }
    };
});
