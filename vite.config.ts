import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' makes the built site work both on a custom domain and on
// GitHub Pages (https://<you>.github.io/<repo>/) without changes.
export default defineConfig({
  plugins: [react()],
  base: './',
});
