import path from "node:path";
import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ["@libsql/client", "@libsql/darwin-arm64", "@libsql/darwin-x64", "@libsql/win32-x64-msvc"],
    },
  },
});
