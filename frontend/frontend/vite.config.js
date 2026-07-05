import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/auth': 'https://appointment-booking-system-backend-r37c.onrender.com',
      '/api': 'https://appointment-booking-system-backend-r37c.onrender.com',
    },
  },
})
