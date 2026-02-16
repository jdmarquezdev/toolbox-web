import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  build: {
    server: "./dist/server",
    client: "./dist/client"
  },
  devToolbar: {
    enabled: false
  },
  experimental: {
    session: true
  },
  adapter: node({ mode: "standalone" })
});
