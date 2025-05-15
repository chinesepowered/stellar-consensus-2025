import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['passkey-kit', 'passkey-kit-sdk', 'sac-sdk'],
};

export default nextConfig;
