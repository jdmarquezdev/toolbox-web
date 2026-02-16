import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  devToolbar: {
    enabled: false
  },
  experimental: {
    session: true
  },
  adapter: node({ mode: "standalone" })
});
