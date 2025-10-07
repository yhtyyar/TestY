import svgr from "vite-plugin-svgr"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [svgr(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
    coverage: {
      reporter: ["text", "json-summary", "json"],
      exclude: ["**/*.test.tsx", "**/*.test.ts"],
    },
  },
})
