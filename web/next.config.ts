import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      new URL(
        "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1199488&theme=light&t=1784331335857",
      ),
    ],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
