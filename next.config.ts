import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow product images hosted on Unsplash (used by seed data) and
  // user-supplied image URLs from Supabase Storage.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
