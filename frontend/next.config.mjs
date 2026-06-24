/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared workspace package is TypeScript source, so let Next transpile it.
  transpilePackages: ["@workshop-pulso/shared"],
};

export default nextConfig;
