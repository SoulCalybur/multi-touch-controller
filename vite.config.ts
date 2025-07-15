import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error: No type definitions for 'vite-plugin-eruda'
import eruda from "vite-plugin-eruda";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), eruda()],
});
