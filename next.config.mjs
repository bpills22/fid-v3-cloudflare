/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["assets-flightaware.bpillsbury.com"], // Retain your external image domain
    unoptimized: true, // Required for static export
  },
  reactStrictMode: true,
  output: "export", // Enable static export
};

export default nextConfig;
