import type { NextConfig } from "next";

const securityHeaders = [
  // Strict-Transport-Security — force HTTPS once a cert is in place. Include
  // subDomains so api.* / app.* subdomains are also covered. 2 years.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // X-Frame-Options — prevent clickjacking by framing the app elsewhere.
  // DENY (no framing at all). Combined with the CSP frame-ancestors 'none'.
  { key: "X-Frame-Options", value: "DENY" },
  // X-Content-Type-Options — stop browsers from MIME-sniffing responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer-Policy — only send origin (not full URL) on cross-origin requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions-Policy — disable camera, mic, geolocation by default.
  // The app never needs these; locking them down reduces the attack surface.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Content-Security-Policy — strict default-src. Allow inline styles (Tailwind
  // and shadcn/ui use them) and the Next.js inline runtime, but block inline
  // scripts and external script domains. img-src allows data: for inline avatars
  // and the YouTube/generic https sources used by NicheCard / ChannelCard.
  // connect-src allows self, googleapis (YouTube API), and the Z.ai upstream.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.googleapis.com https://internal-api.z.ai https://api.z.ai",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Self-hosting / container deploys use `output: 'standalone'` so Node can
  // serve the app from `.next/standalone/server.js` without `node_modules`.
  // On Vercel this flag is IGNORED — Vercel builds and serves with its own
  // pipeline. Keep it for Docker/PM2 deploys. See README "Producción" section.
  output: "standalone",
  // After audit-2, `npx tsc --noEmit` passes cleanly for `src/`. We can
  // therefore flip this to `false` so production builds surface any future
  // type regression instead of silently shipping it. (Errors in `examples/`
  // and `skills/` are outside `src/` and do not affect this build.)
  typescript: {
    ignoreBuildErrors: false,
  },
  // React strict mode was previously disabled to keep Turbopack stable in dev;
  // leaving unchanged to avoid surprising behaviour changes during the audit.
  reactStrictMode: false,
  // The app does not currently use next/image, but YouTube channel avatars
  // (yt3.ggpht.com / yt3.googleusercontent.com) and video thumbnails
  // (i.ytimg.com) are rendered as <img>. Declaring the allow-list here means
  // that switching to next/image in the future will Just Work™.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "z-cdn.chatglm.cn" },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
