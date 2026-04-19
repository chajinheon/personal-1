import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(process.cwd()),
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};
export default nextConfig;
