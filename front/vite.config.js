import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      port: 5173,
      // Évite les soucis CORS lors du branchement sur le back
      proxy: {
        "/api": {
          target: env.VITE_BACK_URL || "http://localhost:3000",
          changeOrigin: true,
        },
      },
    },
  };
});
