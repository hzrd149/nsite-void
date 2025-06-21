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
        void: "src/void/index.tsx",
      },
      output: {
        format: "esm",
        manualChunks: {
          void: ["src/void/index.tsx"],
        },
        inlineDynamicImports: false,
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "void") return "void.js";
          return "[name].js";
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css"))
            return "void.css";
          return "[name].[ext]";
        },
      },
    },
  },
});
