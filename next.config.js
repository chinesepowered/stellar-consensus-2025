/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['passkey-kit', 'passkey-kit-sdk', 'sac-sdk'],
  webpack: (config) => {
    // Fix for passkey-kit and other packages that use node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
    };
    return config;
  },
};

module.exports = nextConfig; 