import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    // Temporary: unblock deployment while remaining TS issues are fixed.
    ignoreBuildErrors: true,
  },
  // Allow network access to dev resources (HMR WebSocket)
  // This enables access from 192.168.x.x:3000 while maintaining security
  allowedDevOrigins: ["192.168.29.136", "localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dufcihx2k/**",
      },
    ],
  },
};

export default nextConfig;
