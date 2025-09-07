import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import pkgVersion from 'vite-plugin-package-version';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    pkgVersion()
  ],
  server: {
    host: true,
    port: 3001,
  }
})
