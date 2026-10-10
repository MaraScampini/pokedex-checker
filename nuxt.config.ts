export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  ssr: false,
  devtools: { enabled: false },
  modules: ['@nuxtjs/google-fonts', 'nitro-cloudflare-dev'],
  css: ['~/assets/css/main.css'],
  nitro: {
    preset: 'cloudflare-pages'
  },
  googleFonts: {
    display: 'swap',
    families: {
      'Atkinson Hyperlegible': [400, 700],
      'IBM Plex Mono': [500, 600]
    }
  },
  app: {
    head: {
      title: 'Binder Dex',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Which Pokémon we already have in our binders.' },
        { name: 'theme-color', content: '#F1F6F2', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0D1611', media: '(prefers-color-scheme: dark)' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' }
      ],
      script: [
        {
          // Apply the saved theme before first paint so dark mode doesn't flash.
          innerHTML: "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}"
        }
      ]
    }
  }
})
