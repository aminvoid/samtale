import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true, // Vite 8 built-in; replaces vite-tsconfig-paths (ADR-0012)
    alias: {
      // `server-only` throws outside the react-server condition; stub it in unit tests.
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/i18n/{config,formats}.ts", "src/features/**/machine/**/*.ts"],
      exclude: ["**/*.test.ts", "src/lib/env/server.ts", "src/lib/env/public.ts"],
      thresholds: { lines: 90, branches: 90 },
    },
  },
});
