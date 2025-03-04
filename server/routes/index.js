export default defineEventHandler(async (event) => {
    // Nur für Debug-Zwecke - sollte normalerweise von Nuxt gehandhabt werden
    return { message: "Server erreicht die Root-Route" };
})
