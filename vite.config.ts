import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Pages from 'vite-plugin-pages';
import Sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    allowedHosts: ["boat.nodayoby.online"],
    port: 8080,
  },
  preview: {
    host: true,
    allowedHosts: ["boat.nodayoby.online"],
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    Pages(),
    Sitemap({
      hostname: 'https://theboatscanner.com',
      dynamicRoutes: ['/', '/404'],
      generateRobotsTxt: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
