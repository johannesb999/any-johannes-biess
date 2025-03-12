export default defineEventHandler((event) => {
    // Globaler Error-Handler für unbehandelte Fehler
    event.node.res.on('error', (error) => {
        console.error('🚨 UNHANDLED SERVER ERROR:', error);
        console.error('Stack trace:', error.stack);
        console.error('Headers:', event.node.req.headers);
        console.error('URL:', event.node.req.url);
        console.error('Method:', event.node.req.method);
    });
});
