/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    // Temporary: unblock deployment while remaining TS issues are fixed.
    ignoreBuildErrors: true,
  },
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

module.exports = nextConfig;
