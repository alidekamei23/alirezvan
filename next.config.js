// CommonJS .js on purpose: Liara's build loads a next.config.js and, when the project had
// only next.config.ts, built without any of the settings below.
const createMDX = require("@next/mdx");

// Sent with every response. No script or style rules (Content-Security-Policy script-src):
// Next.js puts inline scripts in each page, and a wrong rule would break the site; the
// policy below only closes framing, <base> and plugins, which the site never uses.
// Clipboard and Web Share stay allowed: the calculators and the Q&A form use them.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // One year, this host only: subdomains of the future domain are not known yet.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Liara runs the standalone server (its build sets this anyway).
  output: "standalone",
  // Read from disk at runtime (posts, migrations), so file tracing cannot find them.
  outputFileTracingIncludes: {
    "/**": ["./content/blog/**/*", "./db/migrations/**/*"],
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Page 1 of a list lives at the list's own URL. Redirecting here, before rendering, is
  // what sends the Location header: a redirect from the prerendered page is served from
  // cache with a 308 status but no Location.
  async redirects() {
    return [
      { source: "/blog/page/1", destination: "/blog", permanent: true },
      {
        source: "/blog/topic/:area/page/1",
        destination: "/blog/topic/:area",
        permanent: true,
      },
    ];
  },
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
