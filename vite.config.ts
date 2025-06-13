import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [solid(), tailwindcss()],
  build: {
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: {
        chat: "src/chat/index.tsx",
      },
      output: {
        format: "esm",
        manualChunks: {
          chat: ["src/chat/index.tsx"],
        },
        inlineDynamicImports: false,
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "chat") return "chat.js";
          return "[name].js";
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css"))
            return "chat.css";
          return "[name].[ext]";
        },
      },
    },
    watch: {
      exclude: ["node_modules", "dist", "src/sw/**/*"],
    },
  },
});
