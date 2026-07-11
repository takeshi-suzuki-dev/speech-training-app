import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Vitest runs the component tests under jsdom. It is intentionally separate
// from the Next.js build: React Testing Library renders components in isolation
// so we can assert on wiring (which handler fires) and computed class output,
// not layout. Layout / hover / breakpoints are NOT covered here — verify those
// manually in `npm run dev` (see docs/handoff notes).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
  resolve: {
    // Mirror the tsconfig path alias ("@/*" -> "./src/*").
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
