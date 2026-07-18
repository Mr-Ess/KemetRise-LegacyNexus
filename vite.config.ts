import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/LegacyNexus/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router-dom") || id.includes("/react/") || id.includes("react-dom")) return "react-vendor";
          if (id.includes("@supabase/supabase-js")) return "supabase-vendor";
          if (id.includes("recharts")) return "chart-vendor";
          if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf-vendor";
          if (id.includes("/xlsx")) return "xlsx-vendor";
          if (id.includes("i18next") || id.includes("react-i18next")) return "i18n-vendor";
          return undefined;
        },
      },
    },
  },
}));
