/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared workspace package is TypeScript source, so let Next transpile it.
  transpilePackages: ["@workshop-pulso/shared"],

  webpack: (config) => {
    // Privy declares several optional peerDependencies for features we don't
    // use. The four below aren't installed and sit behind optional/lazy code
    // paths, so alias them to an empty module (`false`) to stop webpack failing
    // to resolve them. The Solana packages are NOT listed here on purpose: they
    // are pulled in eagerly (Privy → x402 → @solana/kit) and are present
    // transitively, so they must bundle normally rather than be ignored.
    for (const dep of [
      "@stripe/crypto",
      "@farcaster/mini-app-solana",
      "@abstract-foundation/agw-client",
      "permissionless",
    ]) {
      config.resolve.alias[dep] = false;
    }
    return config;
  },
};

export default nextConfig;
