import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Proxies Firebase Auth's redirect-sign-in helper through our own origin so
  // the browser never has to grant *.firebaseapp.com third-party storage
  // access (blocked by default since Chrome 115+/Safari 16.1+/Firefox 109+).
  // See https://firebase.google.com/docs/auth/web/redirect-best-practices
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        // Excludes /__/auth/* so Firebase Auth's proxied redirect-helper
        // iframe isn't blocked by our own X-Frame-Options: DENY header.
        source: "/:path((?!__/auth/).*)",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
