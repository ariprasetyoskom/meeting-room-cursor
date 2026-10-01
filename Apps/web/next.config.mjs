/** @type {import('next').NextConfig} */
const adminDevPort = process.env.NEXT_ADMIN_DEV_PORT ?? "3001";
const isAdminDevServer = process.env.PORT === adminDevPort;

const nextConfig = {
  // Dua `next dev` (3000 + 3001) berbagi folder .next → compile race & 404 intermiten.
  distDir: isAdminDevServer ? ".next-admin" : ".next",
};

export default nextConfig;
