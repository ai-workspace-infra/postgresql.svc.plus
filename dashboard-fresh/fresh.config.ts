import { defineConfig } from "$fresh/server.ts";
// import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  // Temporarily disable tailwind plugin due to npm module resolution issues
  // Will use custom tailwind build instead
  plugins: [
    // tailwind()
  ],
});
