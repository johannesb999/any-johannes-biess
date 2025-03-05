export default defineEventHandler((event) => {
    // Nur minimales Logging, keine Antwortmanipulation
    console.log('Route angefragt:', event.path);
})
