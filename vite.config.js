import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            // Make sure the config.js gets copied to the dist folder
            onwarn: function (warning, warn) {
                // Ignore specific warnings
                if (warning.code === "EMPTY_BUNDLE")
                    return;
                warn(warning);
            },
        },
    },
});
