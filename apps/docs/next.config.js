/** @type {import('next').NextConfig} */
const nextConfig = {
  // Types are checked separately via `turbo run check-types`.
  // Skipping here keeps `next build` from shelling out to tsc's
  // platform binary, which bun-managed installs may lack on disk.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
