import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, PluginOption } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), visualizer({ filename: "build/bundle.html" }),
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
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "ui",
                            test: /[\\/]node_modules[\\/](@mantine[\\/]core|@tabler[\\/]icons-react)[\\/]/,
                        },
                        {
                            name: "perphs",
                            test: /[\\/]node_modules[\\/](@xterm[\\/]xterm|react-simple-keyboard)[\\/]/,
                        },
                        {
                            name: "codemirror",
                            test: /[\\/]node_modules[\\/](codemirror|@codemirror)[\\/]/,
                        }
                    ]
                }
            },
        },
    },
    server: {
        port: 3000,
    },
});
