import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.6", "localhost:3000", "0.0.0.0:3000"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xqivvgnzrikwcavcxjsi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
