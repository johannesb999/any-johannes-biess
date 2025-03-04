// filepath: /C:/Users/biess/Documents/Development/any-johannes-biess/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/image-edge"],
  compatibilityDate: "2025-03-04",
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
   
    public: {
      baseURL: 'http://localhost:3000'
    }
  },
  // CSS-Einträge hier hinzufügen, wenn nötig
  css: [
    '~/assets/fonts.css'
  ]
});