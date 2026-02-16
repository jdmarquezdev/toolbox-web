import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    appDir: "admin/_app",
    adapter: adapter()
  }
};

export default config;
