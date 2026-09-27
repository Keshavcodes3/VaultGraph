/** @type {import('next').NextConfig} */
const nextConfig = {
  // Types are checked separately via `turbo run check-types`
  // (`next typegen && tsc --noEmit`). Skipping here keeps `next build`
  // from shelling out to tsc's platform binary, which bun-managed
  // installs may not have on disk for every platform.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
