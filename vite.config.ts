import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: mode === 'development' ? {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    } : undefined
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Inject the API URL at build time for production
    'process.env.VITE_API_URL': JSON.stringify(
      // In production read the value that Vercel injects (must be set
      // in the dashboard) instead of hard-coding the Render slug.
      process.env.VITE_API_URL || (mode === 'production'
        ? ''                             // will be undefined if not set
        : 'http://localhost:8000')
    )
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  },
}));
