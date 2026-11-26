import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' deixa o build funcionar em qualquer subcaminho (ex.: GitHub Pages em /brand-o-checker/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()]
});
