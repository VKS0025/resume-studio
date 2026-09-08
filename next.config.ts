import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory makes Turbopack guess the wrong
  // workspace root locally. process.cwd() is the project root under `next dev`,
  // `next build` and on a build host alike — unlike __dirname, which depends on
  // how the config file itself gets loaded.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
