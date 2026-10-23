// CommonJS .js on purpose: Liara's build loads a next.config.js and, when the project had
// only next.config.ts, built without any of the settings below.
const createMDX = require("@next/mdx");

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Liara runs the standalone server (its build sets this anyway).
  output: "standalone",
  // Read from disk at runtime (posts, migrations), so file tracing cannot find them.
  outputFileTracingIncludes: {
    "/**": ["./content/blog/**/*", "./db/migrations/**/*"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Blog posts are MDX files in content/blog, loaded with dynamic imports (lib/blog.ts).
// Plugins are named as strings so Turbopack can load them.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

module.exports = withMDX(nextConfig);
