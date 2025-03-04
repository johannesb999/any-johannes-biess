export default defineEventHandler((event) => {
    // Diese Middleware wird bei JEDER Anfrage ausgeführt
    console.log('Route angefragt:', event.path);

    // Wenn es die Root-Route ist, geben wir mehr Details aus
    if (event.path === '/') {
        console.log('Root-Route wurde angefragt!');
    }
})
