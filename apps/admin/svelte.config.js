import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    appDir: "admin/_app",
    paths: {
      base: "/admin"
    },
    adapter: adapter()
  }
};

export default config;
