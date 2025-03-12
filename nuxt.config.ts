export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/image-edge"],
  compatibilityDate: "2025-03-04",
  
  // Die nitro-Konfiguration mit expliziter CORS-Konfiguration
  nitro: {
    // Verbessertes Logging
    logLevel: process.env.NODE_ENV === 'development' ? 3 : 1,
    
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
      '/': { prerender: true }
    },
    // Explizite CORS-Konfiguration für Nuxt 3
    cors: {
      origin: '*',
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      allowHeaders: ['Content-Type', 'Authorization']
    },
    // Verbesserte Fehlerbehandlung
    errorHandler: '~/server/error-handler'
  },
  
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    logLevel: process.env.LOG_LEVEL || 'info',
    
    public: {}
  },
  app: {
    baseURL: '/', 
    head: {
      title: 'Dateplan',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  
  css: ['~/assets/fonts.css']
});