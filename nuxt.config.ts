export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/image-edge"],
  compatibilityDate: "2025-03-04",
  
  // Die nitro-Konfiguration zum Routing hinzufügen
  nitro: {
    routeRules: {
      '/': { prerender: true }
    }
  },
  
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Service-Key hinzufügen
    
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