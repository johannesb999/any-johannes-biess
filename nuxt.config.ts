// nuxt.config.js
export default defineNuxtConfig({
  devtools: { enabled: false },
  modules: ["@nuxt/image-edge"],
  compatibilityDate: "2024-08-27",
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_KEY,
   
    public: {
      baseURL: 'http://localhost:3000'
    }
  }
});
