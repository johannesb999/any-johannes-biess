export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/image-edge"],
  compatibilityDate: "2025-03-04",
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
   
    public: {
      // Entfernen der statischen baseURL oder dynamisch basierend auf Umgebung setzen
      // baseURL wird nun automatisch vom Server abgeleitet
    }
  },
  app: {
    head: {
      title: 'Dateplan',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  css: [
    '~/assets/fonts.css'
  ]
});