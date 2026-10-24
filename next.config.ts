import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served publicly at https://kriv.agency/for/<slug> through a rewrite in the main site.
  basePath: "/for",
  images: { qualities: [75, 85] },
  poweredByHeader: false,
  // Lead records are read from disk at request time; ship them with the server bundle.
  outputFileTracingIncludes: { "/*": ["./leads/**/*.json"] },
  async headers() {
    return [
      {
        // Guardrail 1. basePath is prefixed automatically, so this covers /for and /for/*.
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
