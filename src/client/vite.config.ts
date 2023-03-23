import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, PluginOption } from "vite";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), viteTsconfigPaths(), visualizer({ filename: "build/bundle.html" }) as PluginOption,
        {
            name: "configure-response-headers",
            configureServer: server => {
                server.middlewares.use((_req, res, next) => {
                    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
                    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
                    next();
                });
            }
        }],
    build: {
        outDir: "build",
        rollupOptions: {
            output: {
                manualChunks: {
                    "mui": ["@mui/material"],
                    "perphs": ["xterm", "react-simple-keyboard"],
                },
            },
        },
    },
    server: {
        port: 3000,
    },
});
