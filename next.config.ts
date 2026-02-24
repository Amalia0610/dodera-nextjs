import type { NextConfig } from "next";

const securityHeaders = [
  /* Prevent clickjacking */
  { key: "X-Frame-Options", value: "DENY" },
  /* Stop MIME-type sniffing */
  { key: "X-Content-Type-Options", value: "nosniff" },
  /* Control referrer leakage */
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  /* Disable browser features you don't use */
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  /* Force HTTPS (2 years, include subdomains, preload-eligible) */
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  /* XSS protection (legacy browsers) */
  { key: "X-XSS-Protection", value: "1; mode=block" },
  /* DNS prefetch control */
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  /* ── Security headers applied to every route ─────────── */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  /* ── Image optimisation ──────────────────────────────── */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
      {
        protocol: "https",
        hostname: "*.cdn.prismic.io",
      },
    ],
  },

  /* ── Powered-by header removal ───────────────────────── */
  poweredByHeader: false,
};

export default nextConfig;
