import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/',
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "lucide-react",
      "date-fns",
      "zod",
      "@hookform/resolvers",
      "react-hook-form"
    ],
  },
  build: {
    chunkSizeWarningLimit: 1024,
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          router: ["react-router-dom"],
          supabase: ["@supabase/supabase-js"],
          tanstack: ["@tanstack/react-query"],
          lucide: ["lucide-react"],
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          utils: ["date-fns"],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
}));
