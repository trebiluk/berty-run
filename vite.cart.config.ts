import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static cart for https://apps.kulibert.net/berty-run/
// Copy dist/ onto apps-kulibert public/berty-run/
export default defineConfig({
  root: fileURLToPath(new URL("./cart", import.meta.url)),
  base: "/berty-run/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 500,
  },
});
