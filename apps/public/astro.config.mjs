import { defineConfig } from "astro/config";
import node from "@astrojs/node";

const adminProxyTarget = process.env.ADMIN_DEV_PROXY_TARGET;
const proxy = adminProxyTarget
  ? {
      "/admin/_app": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/admin/icons": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/admin": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/api/public": {
        target: adminProxyTarget
      },
      "/api/admin": {
        target: adminProxyTarget
      },
      "/api/tools": {
        target: adminProxyTarget
      },
      "/admin/@vite": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/admin/@id": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "^/admin/@fs/.*": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/admin/node_modules/.vite/deps": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "/admin/.svelte-kit": {
        target: adminProxyTarget,
        rewrite: (path) => path.replace(/^\/admin/, "")
      },
      "^/@fs/.*": {
        target: adminProxyTarget
      },
      "/@vite": {
        target: adminProxyTarget
      },
      "/@id": {
        target: adminProxyTarget
      },
      "/node_modules/.vite/deps": {
        target: adminProxyTarget
      },
      "/.svelte-kit": {
        target: adminProxyTarget
      }
    }
  : {};

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
  vite: {
    server: {
      proxy
    }
  },
  adapter: node({ mode: "standalone" })
});
