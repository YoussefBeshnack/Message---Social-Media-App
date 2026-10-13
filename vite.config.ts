import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Vite runs the React transform and Tailwind's first-party plugin together.
// This keeps the starter setup small: utility classes are compiled during dev/build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
