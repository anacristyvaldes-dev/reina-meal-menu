import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  // public/ is served as static files at root (default Vite behavior)
  // images stay at /images/slug.png — no path changes needed
});
