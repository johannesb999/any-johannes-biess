export default defineEventHandler(async (event) => {
    // Erfasse API-Anfrage-Startzeit
    const start = Date.now();
    const { method, url } = event.node.req;

    console.log(`🔹 [${method}] ${url} - Anfrage gestartet`);

    // Nach Abschluss der Anfrage
    event.node.res.on('finish', () => {
        const duration = Date.now() - start;
        const status = event.node.res.statusCode;

        // Farbiges Logging je nach Status-Code
        if (status >= 500) {
            console.error(`🔴 [${method}] ${url} - Status ${status} - ${duration}ms`);
        } else if (status >= 400) {
            console.warn(`🟠 [${method}] ${url} - Status ${status} - ${duration}ms`);
        } else {
            console.log(`🟢 [${method}] ${url} - Status ${status} - ${duration}ms`);
        }
    });
});
