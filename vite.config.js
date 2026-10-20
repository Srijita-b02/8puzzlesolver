import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // './' makes the built site work from any sub-path, e.g.
  // https://<username>.github.io/<repo-name>/ on GitHub Pages.
  base: './',
  plugins: [react(), tailwindcss()],
});
