import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* no redirects needed; we now serve /addbook and /managebooks directly */
  eslint: {
    // Allow production builds to succeed even if there are ESLint errors.
    // We still recommend running `npm run lint` locally and fixing issues.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
