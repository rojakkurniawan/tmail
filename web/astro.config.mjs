// @ts-check
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  integrations: [react()],
  vite: {
    // @ts-ignore - Type conflict between Astro's bundled Vite and @tailwindcss/vite
    plugins: [tailwindcss()],
    server: {
      proxy: {
        // "/api": "https://mail.sunls.de",
        // "/api": "http://127.0.0.1:3000",
        "/api": "http://tmail.cannongate.tech",
      },
    },
  },
})
