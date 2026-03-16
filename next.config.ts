import type { NextConfig } from "next";
const isDevelopment = process.env.NODE_ENV !== "production";

function buildContentSecurityPolicy() {
  const scriptEval = isDevelopment ? " 'unsafe-eval'" : "";

  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptEval} https://js.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https://api.clerk.com https://*.clerk.accounts.dev https://*.clerk.dev https://challenges.cloudflare.com https://*.mongodb.net https://api.resend.com https://api.twilio.com",
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev",
    "worker-src 'self' blob:",
    "media-src 'self' data: blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];

  if (!isDevelopment) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

const securityHeaders = [
  { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }
];

const nextConfig: NextConfig = {
  async headers() {
    if (isDevelopment) {
      // Keep dev overlay/tooling functional and avoid false positives while iterating locally.
      return [];
    }

    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
